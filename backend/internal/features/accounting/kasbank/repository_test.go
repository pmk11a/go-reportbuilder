package kasbank

import (
	"context"
	"database/sql"
	"errors"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlserver"
	"gorm.io/gorm"
)

// GORM's default SQL Server dialect quotes table/column names with
// double-quotes (ANSI style). We use plain strings as regexes — the
// default QueryMatcherRegexp matcher handles the rest.
const (
	tableDBTrans      = `"DBTRANS"`
	tableDBTransaksi  = `"DBTRANSAKSI"`
	tableDBPerkiraan  = `"DBPERKIRAAN"`
	tableDBPeriode    = `"DBPERIODE"`
)

// newTestDB returns a GORM *gorm.DB backed by go-sqlmock. The sqlserver
// driver is used so the production tag names match. We register
// QueryMatcherRegexp so LIKE wildcards and quoted identifiers work.
func newTestDB(t *testing.T) (*gorm.DB, sqlmock.Sqlmock, *sql.DB) {
	t.Helper()
	mockDB, mock, err := sqlmock.New(sqlmock.QueryMatcherOption(sqlmock.QueryMatcherRegexp))
	require.NoError(t, err)
	gormDB, err := gorm.Open(sqlserver.New(sqlserver.Config{
		Conn: mockDB,
	}), &gorm.Config{})
	require.NoError(t, err)
	return gormDB, mock, mockDB
}

// assertMock verifies that every expected query was consumed.
func assertMock(t *testing.T, mock sqlmock.Sqlmock) {
	t.Helper()
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("mock expectations not met: %v", err)
	}
}

// TestList_NoFilters covers the happy path: empty filters return the
// first page of DBTRANS rows with a count.
func TestList_NoFilters(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB)

	now := time.Now()
	rows := sqlmock.NewRows([]string{
		"NoBukti", "NOURUT", "Tanggal", "Note", "TipeTransHd", "PerkiraanHd",
	}).
		AddRow("BKK-202606-0001", "0001", now, "Catatan 1", "BKK", "1101").
		AddRow("BKK-202606-0002", "0002", now, "Catatan 2", "BKK", "1101")

	mock.ExpectQuery(`SELECT count\(\*\) FROM ` + tableDBTrans).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(2))

	mock.ExpectQuery(`SELECT \* FROM ` + tableDBTrans).
		WillReturnRows(rows)

	out, total, err := repo.List(context.Background(), SListKasBankQuery{Page: 1, PerPage: 10})
	require.NoError(t, err)
	assert.Equal(t, int64(2), total)
	assert.Len(t, out, 2)
	assert.Equal(t, "BKK-202606-0001", out[0].NoBukti)
	assertMock(t, mock)
}

// TestList_WithFilters exercises the filter branches: tipe + search.
func TestList_WithFilters(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB)

	mock.ExpectQuery(`SELECT count\(\*\) FROM ` + tableDBTrans).
		WithArgs("BKM", "%foo%", "%foo%").
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))

	mock.ExpectQuery(`SELECT \* FROM ` + tableDBTrans).
		WithArgs("BKM", "%foo%", "%foo%").
		WillReturnRows(sqlmock.NewRows([]string{"NoBukti", "NOURUT", "Note", "TipeTransHd"}).
			AddRow("BKM-X", "1", "foo", "BKM"))

	out, total, err := repo.List(context.Background(), SListKasBankQuery{
		Tipe: "BKM", Search: "foo", Page: 1, PerPage: 10,
	})
	require.NoError(t, err)
	assert.Equal(t, int64(1), total)
	assert.Len(t, out, 1)
	assertMock(t, mock)
}

// TestList_CountError covers the error path on the count query.
func TestList_CountError(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB)

	mock.ExpectQuery(`SELECT count\(\*\) FROM ` + tableDBTrans).
		WillReturnError(errors.New("db down"))

	_, _, err := repo.List(context.Background(), SListKasBankQuery{Page: 1, PerPage: 10})
	require.Error(t, err)
	assertMock(t, mock)
}

// TestGetByNoBukti_NotFound covers the "row missing" path.
func TestGetByNoBukti_NotFound(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB)

	mock.ExpectQuery(`SELECT \* FROM ` + tableDBTrans).
		WithArgs("BKK-MISSING").
		WillReturnRows(sqlmock.NewRows([]string{"NoBukti"}))

	out, err := repo.GetByNoBukti(context.Background(), "BKK-MISSING")
	require.NoError(t, err)
	assert.Nil(t, out)
	assertMock(t, mock)
}

// TestGetByNoBukti_Found covers the happy path.
func TestGetByNoBukti_Found(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB)

	rows := sqlmock.NewRows([]string{"NoBukti", "NOURUT", "Note", "TipeTransHd"}).
		AddRow("BKK-1", "0001", "catatan", "BKK")
	mock.ExpectQuery(`SELECT \* FROM ` + tableDBTrans).
		WithArgs("BKK-1").
		WillReturnRows(rows)

	out, err := repo.GetByNoBukti(context.Background(), "BKK-1")
	require.NoError(t, err)
	require.NotNil(t, out)
	assert.Equal(t, "BKK-1", out.NoBukti)
	assertMock(t, mock)
}

// TestInsertHeader_Ok covers the happy path.
func TestInsertHeader_Ok(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB)

	mock.ExpectBegin()
	mock.ExpectExec(`INSERT INTO ` + tableDBTrans).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	err := repo.InsertHeader(context.Background(), &SDbTrans{NoBukti: "BKK-1", Note: "test"})
	require.NoError(t, err)
	assertMock(t, mock)
}

// TestUpdateHeader_Ok covers the happy path. GORM Save() may emit
// UPDATE or INSERT (upsert) depending on the dialect, so we match
// either.
func TestUpdateHeader_Ok(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB)

	mock.ExpectBegin()
	mock.ExpectExec(`(UPDATE|INSERT INTO) ` + tableDBTrans).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()

	err := repo.UpdateHeader(context.Background(), &SDbTrans{NoBukti: "BKK-1", Note: "edit"})
	require.NoError(t, err)
	assertMock(t, mock)
}

// TestDeleteHeader_Ok verifies the cascade delete opens a transaction and
// issues two DELETE statements (DBTRANSAKSI then DBTRANS).
func TestDeleteHeader_Ok(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB)

	mock.ExpectBegin()
	mock.ExpectExec(`DELETE FROM ` + tableDBTransaksi).
		WithArgs("BKK-1").
		WillReturnResult(sqlmock.NewResult(0, 2))
	mock.ExpectExec(`DELETE FROM ` + tableDBTrans).
		WithArgs("BKK-1").
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()

	err := repo.DeleteHeader(context.Background(), "BKK-1")
	require.NoError(t, err)
	assertMock(t, mock)
}

// TestListDetail_Ok covers the happy path.
func TestListDetail_Ok(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB)

	rows := sqlmock.NewRows([]string{"NoBukti", "Urut", "Perkiraan", "Debet", "Kredit"}).
		AddRow("BKK-1", 1, "1101", 1000.0, 0.0).
		AddRow("BKK-1", 2, "2100", 0.0, 1000.0)
	mock.ExpectQuery(`SELECT \* FROM ` + tableDBTransaksi).
		WithArgs("BKK-1").
		WillReturnRows(rows)

	out, err := repo.ListDetail(context.Background(), "BKK-1")
	require.NoError(t, err)
	assert.Len(t, out, 2)
	assertMock(t, mock)
}

// TestGetDetail_NotFound covers the "row missing" path.
func TestGetDetail_NotFound(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB)

	mock.ExpectQuery(`SELECT \* FROM ` + tableDBTransaksi).
		WithArgs("BKK-1", 99).
		WillReturnRows(sqlmock.NewRows([]string{"NoBukti"}))

	out, err := repo.GetDetail(context.Background(), "BKK-1", 99)
	require.NoError(t, err)
	assert.Nil(t, out)
	assertMock(t, mock)
}

// TestInsertDetail_Ok covers the happy path.
func TestInsertDetail_Ok(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB)

	mock.ExpectBegin()
	mock.ExpectExec(`INSERT INTO ` + tableDBTransaksi).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	err := repo.InsertDetail(context.Background(), &SDbTransaksi{NoBukti: "BKK-1", Urut: 1, Perkiraan: "1101", Debet: 1000})
	require.NoError(t, err)
	assertMock(t, mock)
}

// TestUpdateDetail_Ok covers the happy path. GORM Save() with a populated
// primary key on the legacy SDbTransaksi (composite PK) emits an UPDATE.
func TestUpdateDetail_Ok(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB)

	mock.ExpectBegin()
	mock.ExpectExec(`(UPDATE|INSERT INTO) ` + tableDBTransaksi).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()

	err := repo.UpdateDetail(context.Background(), &SDbTransaksi{NoBukti: "BKK-1", Urut: 1, Perkiraan: "1101", Debet: 2000})
	require.NoError(t, err)
	assertMock(t, mock)
}

// TestDeleteDetail_Ok covers the happy path.
func TestDeleteDetail_Ok(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB)

	mock.ExpectBegin()
	mock.ExpectExec(`DELETE FROM ` + tableDBTransaksi).
		WithArgs("BKK-1", 1).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()

	err := repo.DeleteDetail(context.Background(), "BKK-1", 1)
	require.NoError(t, err)
	assertMock(t, mock)
}

// TestSetOtorisasi_Level1 verifies the raw-SQL update for level 1.
// The raw SQL is sent unquoted (no GORM table-name quoting because we
// bypass the query builder) — we match the literal statement.
func TestSetOtorisasi_Level1(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB)

	mock.ExpectExec(`UPDATE DBTRANS SET IsOtorisasi1 = 1, OtoUser1 = @p1, TglOto1 = @p2 WHERE NoBukti = @p3`).
		WithArgs("SA", sqlmock.AnyArg(), "BKK-1").
		WillReturnResult(sqlmock.NewResult(0, 1))

	err := repo.SetOtorisasi(context.Background(), "BKK-1", 1, "SA")
	require.NoError(t, err)
	assertMock(t, mock)
}

// TestSetOtorisasi_InvalidLevel returns an error for level 3.
func TestSetOtorisasi_InvalidLevel(t *testing.T) {
	gormDB, _, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB)

	err := repo.SetOtorisasi(context.Background(), "BKK-1", 3, "SA")
	require.Error(t, err)
}

// TestCancelOtorisasi_Level2 verifies the raw-SQL update for level 2.
func TestCancelOtorisasi_Level2(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB)

	mock.ExpectExec(`UPDATE DBTRANS SET IsOtorisasi2 = 0, OtoUser2 = '', TglOto2 = NULL WHERE NoBukti = @p1`).
		WithArgs("BKK-1").
		WillReturnResult(sqlmock.NewResult(0, 1))

	err := repo.CancelOtorisasi(context.Background(), "BKK-1", 2)
	require.NoError(t, err)
	assertMock(t, mock)
}

// TestGenerateNoBukti_Ok covers the full increment flow. The repository
// wraps GenerateNoBukti in a GORM transaction, so we expect Begin/Commit
// around the SELECT and UPDATE.
func TestGenerateNoBukti_Ok(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB)

	mock.ExpectBegin()
	mock.ExpectQuery(`SELECT \[NOBKK\] FROM DBNOMOR WITH`).
		WillReturnRows(sqlmock.NewRows([]string{"NOBKK"}).AddRow("202606-0005"))
	mock.ExpectExec(`UPDATE DBNOMOR SET \[NOBKK\] = @p1`).
		WithArgs("202606-0006").
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()

	out, err := repo.GenerateNoBukti(context.Background(), "BKK")
	require.NoError(t, err)
	assert.Regexp(t, `^BKK-\d{6}-\d{4}$`, out)
	assertMock(t, mock)
}

// TestGenerateNoBukti_UnknownTipe returns ErrUnknownTipe for an invalid tipe.
// The repository still opens a transaction, so we expect Begin/Rollback.
func TestGenerateNoBukti_UnknownTipe(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB)

	mock.ExpectBegin()
	mock.ExpectRollback()

	_, err := repo.GenerateNoBukti(context.Background(), "XYZ")
	require.ErrorIs(t, err, ErrUnknownTipe)
	assertMock(t, mock)
}

// TestLookupPerkiraan_NoFilter covers the unfiltered path.
func TestLookupPerkiraan_NoFilter(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB)

	rows := sqlmock.NewRows([]string{"Perkiraan", "Keterangan"}).
		AddRow("1101", "Kas Besar").
		AddRow("1102", "Kas Kecil")
	mock.ExpectQuery(`SELECT \* FROM ` + tableDBPerkiraan).
		WillReturnRows(rows)

	out, err := repo.LookupPerkiraan(context.Background(), "", false, 10)
	require.NoError(t, err)
	assert.Len(t, out, 2)
	assertMock(t, mock)
}

// TestLookupPerkiraan_KelompokKas covers the kelompokKas filter.
func TestLookupPerkiraan_KelompokKas(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB)

	rows := sqlmock.NewRows([]string{"Perkiraan", "Keterangan", "Kelompok"}).
		AddRow("1101", "Kas Besar", "1")
	mock.ExpectQuery(`SELECT \* FROM ` + tableDBPerkiraan).
		WillReturnRows(rows)

	out, err := repo.LookupPerkiraan(context.Background(), "", true, 10)
	require.NoError(t, err)
	assert.Len(t, out, 1)
	assertMock(t, mock)
}

// TestGetPeriode_Found covers the found path.
func TestGetPeriode_Found(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB)

	mock.ExpectQuery(`SELECT \* FROM ` + tableDBPeriode).
		WithArgs("SA").
		WillReturnRows(sqlmock.NewRows([]string{"USERID", "BULAN", "TAHUN"}).AddRow("SA", "06", "2026"))

	bulan, tahun, err := repo.GetPeriode(context.Background(), "SA")
	require.NoError(t, err)
	assert.Equal(t, 6, bulan)
	assert.Equal(t, 2026, tahun)
	assertMock(t, mock)
}

// TestGetPeriode_NotFound returns 0,0 with no error.
func TestGetPeriode_NotFound(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB)

	mock.ExpectQuery(`SELECT \* FROM ` + tableDBPeriode).
		WithArgs("SA").
		WillReturnRows(sqlmock.NewRows([]string{"USERID"}))

	bulan, tahun, err := repo.GetPeriode(context.Background(), "SA")
	require.NoError(t, err)
	assert.Equal(t, 0, bulan)
	assert.Equal(t, 0, tahun)
	assertMock(t, mock)
}

// TestRecalcTotals_Ok covers the aggregation query. The raw SQL
// emitted by tx.Raw uses @p1 placeholders, so we match that.
func TestRecalcTotals_Ok(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB)

	mock.ExpectQuery(`SELECT COALESCE\(SUM\(Debet\), 0\) AS TotalD, COALESCE\(SUM\(Kredit\), 0\) AS TotalK FROM DBTRANSAKSI WHERE NoBukti = @p1`).
		WithArgs("BKK-1").
		WillReturnRows(sqlmock.NewRows([]string{"TotalD", "TotalK"}).AddRow(5000.0, 5000.0))

	d, k, err := repo.RecalcTotals(context.Background(), "BKK-1")
	require.NoError(t, err)
	assert.Equal(t, 5000.0, d)
	assert.Equal(t, 5000.0, k)
	assertMock(t, mock)
}
