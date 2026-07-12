package browse

import (
	"regexp"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"gorm.io/driver/sqlserver"
	"gorm.io/gorm"
)

// newTestDB returns a GORM *gorm.DB backed by sqlmock so we can verify the
// SQL GORM actually emits (including named-binding handling) without needing
// a live SQL Server. The sqlserver dialect is used so any `?`-vs-`@`
// placeholder rewriting matches production behaviour.
func newTestDB(t *testing.T) (*gorm.DB, sqlmock.Sqlmock) {
	t.Helper()
	conn, mock, err := sqlmock.New(sqlmock.QueryMatcherOption(sqlmock.QueryMatcherRegexp))
	if err != nil {
		t.Fatalf("sqlmock new: %v", err)
	}
	gdb, err := gorm.Open(sqlserver.New(sqlserver.Config{Conn: conn, DriverName: "sqlserver"}), &gorm.Config{})
	if err != nil {
		t.Fatalf("gorm open: %v", err)
	}
	return gdb, mock
}

// TestScanSearchResults_NumericColumn is the regression test for the
// browse-search bug:
//
//   `sql: Scan error on column index 0, name "Perkiraan": destination not a pointer`
//
// GORM's prepareValues allocates `**[]byte` destinations for SQL Server
// numeric/decimal columns (because the driver's ScanType() returns []byte),
// which database/sql cannot convert into. scanSearchResults bypasses that
// path entirely by allocating one *interface{} per column.
func TestScanSearchResults_NumericColumn(t *testing.T) {
	db, mock := newTestDB(t)

	// The sqlserver driver returns `numeric`/`decimal` columns as `[]byte`
	// (see makeGoLangScanType in the driver). A previous GORM path allocated
	// `**[]byte` for these and database/sql rejected the destination. We
	// assert here that scanSearchResults handles that case and yields the
	// underlying string value back to the caller.
	mock.ExpectQuery(regexp.QuoteMeta("SELECT Perkiraan, Keterangan, Simbol FROM dbPerkiraan")).
		WillReturnRows(
			sqlmock.NewRows([]string{"Perkiraan", "Keterangan", "Simbol"}).
				AddRow([]byte("1101"), "Kas", "KAS").
				AddRow([]byte("1102"), "Bank BCA", "BCA"),
		)

	r := &SConfigResolver{db: db}
	rows, err := r.scanSearchResults(db, "SELECT Perkiraan, Keterangan, Simbol FROM dbPerkiraan", nil)
	if err != nil {
		t.Fatalf("scanSearchResults: %v", err)
	}
	if len(rows) != 2 {
		t.Fatalf("expected 2 rows, got %d", len(rows))
	}
	if got := rows[0]["Perkiraan"]; got != "1101" {
		// The driver returns []byte for numeric; our scan normalises it to
		// string via the *interface{} dest.
		t.Errorf("rows[0].Perkiraan: want %q, got %T %v", "1101", got, got)
	}
	if got := rows[0]["Keterangan"]; got != "Kas" {
		t.Errorf("rows[0].Keterangan: want %q, got %v", "Kas", got)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("sqlmock: %v", err)
	}
}

// TestScanSearchResults_NamedBindings verifies that GORM named bindings
// (`@name` placeholders) flow through correctly - production browse
// queries use this pattern for parent-filter substitution.
func TestScanSearchResults_NamedBindings(t *testing.T) {
	db, mock := newTestDB(t)

	mock.ExpectQuery(`SELECT TOP 20 Perkiraan, Keterangan, Simbol FROM dbPerkiraan`).
		WithArgs(sqlmock.AnyArg()).
		WillReturnRows(
			sqlmock.NewRows([]string{"Perkiraan", "Keterangan", "Simbol"}).
				AddRow("1101", "Kas Utama", "KAS"),
		)

	r := &SConfigResolver{db: db}
	rows, err := r.scanSearchResults(
		db,
		"SELECT TOP 20 Perkiraan, Keterangan, Simbol FROM dbPerkiraan WHERE Tipe=1 AND Kode=@qparent0",
		map[string]interface{}{"qparent0": "KAS"},
	)
	if err != nil {
		t.Fatalf("scanSearchResults: %v", err)
	}
	if len(rows) != 1 {
		t.Fatalf("expected 1 row, got %d", len(rows))
	}
	if rows[0]["Perkiraan"] != "1101" {
		t.Errorf("Perkiraan: got %v", rows[0]["Perkiraan"])
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("sqlmock: %v", err)
	}
}

// TestScanSearchResults_NilValue covers a SQL Server NULL coming back as
// Go nil (rather than a typed zero value). database/sql's `case nil`
// branch must place nil in our *interface{} destination.
func TestScanSearchResults_NilValue(t *testing.T) {
	db, mock := newTestDB(t)

	mock.ExpectQuery(`SELECT Perkiraan FROM dbPerkiraan`).
		WillReturnRows(
			sqlmock.NewRows([]string{"Perkiraan"}).AddRow(nil),
		)

	r := &SConfigResolver{db: db}
	rows, err := r.scanSearchResults(db, "SELECT Perkiraan FROM dbPerkiraan", nil)
	if err != nil {
		t.Fatalf("scanSearchResults: %v", err)
	}
	if len(rows) != 1 {
		t.Fatalf("expected 1 row, got %d", len(rows))
	}
	v, ok := rows[0]["Perkiraan"]
	if !ok {
		t.Fatalf("Perkiraan missing from result map")
	}
	if v != nil {
		t.Errorf("expected nil for NULL Perkiraan, got %T %v", v, v)
	}
}

// TestScanSearchResults_Empty ensures the function returns an empty slice
// (not nil) when no rows match, so the FE can iterate without a nil check.
func TestScanSearchResults_Empty(t *testing.T) {
	db, mock := newTestDB(t)

	mock.ExpectQuery(`SELECT Perkiraan FROM dbPerkiraan WHERE 1=0`).
		WillReturnRows(sqlmock.NewRows([]string{"Perkiraan"}))

	r := &SConfigResolver{db: db}
	rows, err := r.scanSearchResults(db, "SELECT Perkiraan FROM dbPerkiraan WHERE 1=0", nil)
	if err != nil {
		t.Fatalf("scanSearchResults: %v", err)
	}
	if rows == nil {
		t.Errorf("expected empty slice, got nil")
	}
	if len(rows) != 0 {
		t.Errorf("expected 0 rows, got %d", len(rows))
	}
}


// TestScanSearchResults_KasBank20011Regression is a direct regression test
// for the production failure:
//
//   GET /api/browse/search?kodeBrowse=20011&q=ka&limit=50&parent_NoKira1=KAS 500
//   →  sql: Scan error on column index 0, name "Perkiraan": destination not a pointer
//
// browse 20011's SQL is `Select Perkiraan, Keterangan, Simbol from dbPerkiraan`
// where `Perkiraan` is a numeric/decimal column in the legacy SQL Server
// schema. We assert that scanSearchResults returns usable row maps for that
// exact shape and that the SQL Server driver's `[]byte` representation of
// `Perkiraan` is normalised to a Go string the FE can render directly.
func TestScanSearchResults_KasBank20011Regression(t *testing.T) {
	db, mock := newTestDB(t)

	// Browses that include `dbPostHutPiut` in the WHERE clause still surface
	// `Perkiraan` as the leading SELECT column, which is what triggered the
	// original failure.
	mock.ExpectQuery(`SELECT TOP 50 Perkiraan, Keterangan, Simbol`).
		WithArgs(sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg()).
		WillReturnRows(
			sqlmock.NewRows([]string{"Perkiraan", "Keterangan", "Simbol"}).
				AddRow([]byte("1101"), "Kas Utama", "KAS").
				AddRow([]byte("1102"), "Kas Bank", "KAS2"),
		)

	r := &SConfigResolver{db: db}
	rows, err := r.scanSearchResults(
		db,
		"SELECT TOP 50 Perkiraan, Keterangan, Simbol FROM dbPerkiraan "+
			"WHERE Tipe=1 AND Perkiraan IN (SELECT Perkiraan FROM dbPostHutPiut WHERE Kode=@qparent0) "+
			"AND (Perkiraan LIKE @qKey OR Keterangan LIKE @qLabel) "+
			"ORDER BY Perkiraan",
		map[string]interface{}{
			"qparent0": "KAS",
			"qKey":     "%ka%",
			"qLabel":   "%ka%",
		},
	)
	if err != nil {
		t.Fatalf("scanSearchResults (KasBank regression): %v", err)
	}
	if len(rows) != 2 {
		t.Fatalf("expected 2 rows, got %d", len(rows))
	}

	// The FE accesses these via `row.Per ?? row.KODE` and `String(...)`. A
	// `[]byte` value here would render as "[49 49 48 49]" instead of
	// "1101" — that's the bug we're guarding against.
	for i, want := range []string{"1101", "1102"} {
		got, ok := rows[i]["Perkiraan"].(string)
		if !ok {
			t.Errorf("rows[%d].Perkiraan is %T, want string (%v)", i, rows[i]["Perkiraan"], rows[i]["Perkiraan"])
			continue
		}
		if got != want {
			t.Errorf("rows[%d].Perkiraan: got %q, want %q", i, got, want)
		}
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("sqlmock: %v", err)
	}
}

// TestNormalizeScanValue guards the `[]byte` → `string` coercion that lets
// the FE render numeric/decimal columns without per-column type juggling.
func TestNormalizeScanValue(t *testing.T) {
	cases := []struct {
		name string
		in   interface{}
		want interface{}
	}{
		{"ascii numeric", []byte("1101"), "1101"},
		{"empty", []byte{}, ""},
		{"text string", "hello", "hello"},
		{"utf-8 string", "Kas Bank — IDR", "Kas Bank — IDR"},
		{"int passed through", 42, 42},
		{"nil passed through", nil, nil},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got := normalizeScanValue(c.in)
			if got != c.want {
				t.Errorf("normalizeScanValue(%v): got %#v (%T), want %#v (%T)", c.in, got, got, c.want, c.want)
			}
		})
	}
}
