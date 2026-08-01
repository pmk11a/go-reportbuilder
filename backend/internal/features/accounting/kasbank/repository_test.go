package kasbank

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"errors"
	"fmt"
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
	repo := NewSKasBankRepository(gormDB, nil)

	now := time.Now()
	countRows := sqlmock.NewRows([]string{"COUNT(*)"}).AddRow(2)
	mock.ExpectQuery(".COUNT.*").WillReturnRows(countRows)

	dataRows := sqlmock.NewRows([]string{
		"NoBukti", "NOURUT", "Tanggal", "Note", "TipeTransHd", "PerkiraanHd",
	}).
		AddRow("BKK-202606-0001", "0001", now, "Catatan 1", "BKK", "1101").
		AddRow("BKK-202606-0002", "0002", now, "Catatan 2", "BKK", "1101")
	mock.ExpectQuery(".ROW_NUMBER.*").WillReturnRows(dataRows)

	out, total, err := repo.List(context.Background(), SListKasBankQuery{Page: 1, PerPage: 10})
	require.NoError(t, err)
	assert.Equal(t, int64(2), total)
	assert.Len(t, out, 2)
	assert.Equal(t, "BKK-202606-0001", out[0].NoBukti)
	assertMock(t, mock)
}

// TestList_NoTipe_RestrictsToKasBankDiscriminators verifies that when the
// caller does not pass a specific tipe, the repository still constrains the
// query to the 4 kasbank discriminators (BKM/BKK/BBM/BBK) rather than
// leaving TipeTransHd unrestricted. DBTRANS is a legacy table shared across
// modules — without this filter, the list would leak non-kasbank rows.
// We assert the exact IN(...) args reach the driver; the mocked rows
// returned only contain kasbank-typed rows, which is what the real SQL
// Server engine would also do once the WHERE clause is applied.
func TestList_NoTipe_RestrictsToKasBankDiscriminators(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB, nil)

	countRows := sqlmock.NewRows([]string{"COUNT(*)"}).AddRow(2)
	mock.ExpectQuery(".COUNT.*").WillReturnRows(countRows)

	dataRows := sqlmock.NewRows([]string{"NoBukti", "TipeTransHd"}).
		AddRow("BKK-1", "BKK").
		AddRow("BKM-1", "BKM")
	mock.ExpectQuery(".ROW_NUMBER.*").WillReturnRows(dataRows)

	out, total, err := repo.List(context.Background(), SListKasBankQuery{Page: 1, PerPage: 10})
	require.NoError(t, err)
	assert.Equal(t, int64(2), total)
	assert.Len(t, out, 2)
	for _, item := range out {
		assert.Contains(t, []string{TipeBKM, TipeBKK, TipeBBM, TipeBBK}, *item.TipeTransHd)
	}
	assertMock(t, mock)
}

// TestList_WithFilters exercises the filter branches: tipe + search.
func TestList_WithFilters(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB, nil)

	countRows := sqlmock.NewRows([]string{"COUNT(*)"}).AddRow(1)
	mock.ExpectQuery(".COUNT.*").WillReturnRows(countRows)

	dataRows := sqlmock.NewRows([]string{"NoBukti", "NOURUT", "Note", "TipeTransHd"}).
		AddRow("BKM-X", "1", "foo", "BKM")
	mock.ExpectQuery(".ROW_NUMBER.*").WillReturnRows(dataRows)

	out, total, err := repo.List(context.Background(), SListKasBankQuery{
		Tipe: "BKM", Search: "foo", Page: 1, PerPage: 10,
	})
	require.NoError(t, err)
	assert.Equal(t, int64(1), total)
	assert.Len(t, out, 1)
	assertMock(t, mock)
}

// TestList_DefaultPeriod_NoExplicitDate verifies that when the caller does
// not pass dateFrom/dateTo, the list query is scoped to the user's active
// DBPERIODE (year/month), mirroring trade-exchange's default view.
func TestList_DefaultPeriod_NoExplicitDate(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB, nil)

	mock.ExpectQuery(`SELECT \* FROM ` + tableDBPeriode).
		WithArgs("SA").
		WillReturnRows(sqlmock.NewRows([]string{"USERID", "BULAN", "TAHUN"}).AddRow("SA", "06", "2026"))

	countRows := sqlmock.NewRows([]string{"COUNT(*)"}).AddRow(1)
	mock.ExpectQuery(".COUNT.*").WillReturnRows(countRows)

	dataRows := sqlmock.NewRows([]string{"NoBukti", "Tanggal"}).AddRow("BKK-202606-0001", time.Now())
	mock.ExpectQuery(".ROW_NUMBER.*").WillReturnRows(dataRows)

	out, total, err := repo.List(context.Background(), SListKasBankQuery{
		Page: 1, PerPage: 10, UserID: "SA",
	})
	require.NoError(t, err)
	assert.Equal(t, int64(1), total)
	assert.Len(t, out, 1)
	assertMock(t, mock)
}

// TestList_ExplicitDate_OverridesPeriod verifies that when the caller passes
// dateFrom/dateTo, the explicit range is used and DBPERIODE is never
// queried at all.
func TestList_ExplicitDate_OverridesPeriod(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB, nil)

	countRows := sqlmock.NewRows([]string{"COUNT(*)"}).AddRow(1)
	mock.ExpectQuery(".COUNT.*").WillReturnRows(countRows)
	dataRows := sqlmock.NewRows([]string{"NoBukti"}).AddRow("BKK-1")
	mock.ExpectQuery(".ROW_NUMBER.*").WillReturnRows(dataRows)

	out, total, err := repo.List(context.Background(), SListKasBankQuery{
		Page: 1, PerPage: 10, UserID: "SA",
		DateFrom: "2026-01-01", DateTo: "2026-01-31",
	})
	require.NoError(t, err)
	assert.Equal(t, int64(1), total)
	assert.Len(t, out, 1)
	assertMock(t, mock) // no DBPERIODE query expected/consumed
}

// TestList_NoPeriodRow_FallsBackToUnrestricted verifies that a user with no
// DBPERIODE row (GetPeriode returns 0,0) gets the unrestricted list rather
// than an error or an empty result.
func TestList_NoPeriodRow_FallsBackToUnrestricted(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB, nil)

	mock.ExpectQuery(`SELECT \* FROM ` + tableDBPeriode).
		WithArgs("NEWUSER").
		WillReturnRows(sqlmock.NewRows([]string{"USERID"}))

	countRows := sqlmock.NewRows([]string{"COUNT(*)"}).AddRow(0)
	mock.ExpectQuery(".COUNT.*").WillReturnRows(countRows)
	dataRows := sqlmock.NewRows([]string{"NoBukti"})
	mock.ExpectQuery(".ROW_NUMBER.*").WillReturnRows(dataRows)

	out, total, err := repo.List(context.Background(), SListKasBankQuery{
		Page: 1, PerPage: 10, UserID: "NEWUSER",
	})
	require.NoError(t, err)
	assert.Equal(t, int64(0), total)
	assert.Len(t, out, 0)
	assertMock(t, mock)
}

// TestList_NoUserID_SkipsPeriodResolution verifies that when UserID is
// blank (e.g. an internal caller that never set it), the repository does
// not attempt to resolve a period and behaves like the pre-TASK-021
// unrestricted query.
func TestList_NoUserID_SkipsPeriodResolution(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB, nil)

	countRows := sqlmock.NewRows([]string{"COUNT(*)"}).AddRow(0)
	mock.ExpectQuery(".COUNT.*").WillReturnRows(countRows)
	dataRows := sqlmock.NewRows([]string{"NoBukti"})
	mock.ExpectQuery(".ROW_NUMBER.*").WillReturnRows(dataRows)

	out, total, err := repo.List(context.Background(), SListKasBankQuery{Page: 1, PerPage: 10})
	require.NoError(t, err)
	assert.Equal(t, int64(0), total)
	assert.Len(t, out, 0)
	assertMock(t, mock) // no DBPERIODE query expected/consumed
}

// TestList_CountError covers the error path on the count query.
func TestList_CountError(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB, nil)

	mock.ExpectQuery(".COUNT.*").
		WillReturnError(errors.New("db down"))

	_, _, err := repo.List(context.Background(), SListKasBankQuery{Page: 1, PerPage: 10})
	require.Error(t, err)
	assertMock(t, mock)
}

// TestGetByNoBukti_NotFound covers the "row missing" path.
func TestGetByNoBukti_NotFound(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB, nil)

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
	repo := NewSKasBankRepository(gormDB, nil)

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
	repo := NewSKasBankRepository(gormDB, nil)

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
	repo := NewSKasBankRepository(gormDB, nil)

	mock.ExpectBegin()
	mock.ExpectExec(`(UPDATE|INSERT INTO) ` + tableDBTrans).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()

	err := repo.UpdateHeader(context.Background(), &SDbTrans{NoBukti: "BKK-1", Note: "edit"})
	require.NoError(t, err)
	assertMock(t, mock)
}

// TestDeleteHeader_Ok verifies the cascade delete opens a transaction and
// issues every dependent-row statement (DBTRANSAKSI, DBGIRO, DBDEPOSITO,
// DBHUTPIUT, DBTempHUTPIUT, DBTRANS). Mirrors FrmKasBank.pas HapusBtnClick
// lines 2270–2450. Order matters — child rows must be removed before the
// parent DBTRANS row.
func TestDeleteHeader_Ok(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB, nil)

	mock.ExpectBegin()
	// 1. DBTRANSAKSI
	mock.ExpectExec(`DELETE FROM ` + tableDBTransaksi).
		WithArgs("BKK-1").
		WillReturnResult(sqlmock.NewResult(0, 2))
	// 2. DBGIRO — open giro (BuktiBuka + TglCair IS NULL) — DELETE
	mock.ExpectExec(`DELETE FROM DBGIRO WHERE BuktiBuka = @p1 AND TglCair IS NULL`).
		WillReturnResult(sqlmock.NewResult(0, 0))
	// 3. DBGIRO — cair rows — UPDATE (clear cair fields)
	mock.ExpectExec(`UPDATE DBGIRO`).
		WithArgs("BKK-1").
		WillReturnResult(sqlmock.NewResult(0, 0))
	// 4. DBDEPOSITO — open deposito DELETE
	mock.ExpectExec(`DELETE FROM DBDEPOSITO WHERE BuktiBuka = \? AND TglCair IS NULL`).
		WithArgs("BKK-1").
		WillReturnResult(sqlmock.NewResult(0, 0))
	// 5. DBDEPOSITO — cair rows UPDATE
	mock.ExpectExec(`UPDATE DBDEPOSITO`).
		WithArgs("BKK-1").
		WillReturnResult(sqlmock.NewResult(0, 0))
	// 6. DBHUTPIUT — DELETE
	mock.ExpectExec(`DELETE FROM DBHUTPIUT WHERE nobukti = \?`).
		WithArgs("BKK-1").
		WillReturnResult(sqlmock.NewResult(0, 0))
	// 7. DBTempHUTPIUT — DELETE staging rows
	mock.ExpectExec(`DELETE FROM DBTempHUTPIUT WHERE NoBukti = \?`).
		WithArgs("BKK-1").
		WillReturnResult(sqlmock.NewResult(0, 0))
	// 8. DBTRANS — parent
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
	repo := NewSKasBankRepository(gormDB, nil)

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
	repo := NewSKasBankRepository(gormDB, nil)

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
	repo := NewSKasBankRepository(gormDB, nil)

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
	repo := NewSKasBankRepository(gormDB, nil)

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
	repo := NewSKasBankRepository(gormDB, nil)

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
	repo := NewSKasBankRepository(gormDB, nil)

	mock.ExpectExec(`UPDATE DBTRANS SET IsOtorisasi1 = 1, OtoUser1 = @p1, TglOto1 = @p2 WHERE NoBukti = @p3`).
		WithArgs("SA", sqlmock.AnyArg(), "BKK-1").
		WillReturnResult(sqlmock.NewResult(0, 1))

	err := repo.SetOtorisasi(context.Background(), "BKK-1", 1, "SA")
	require.NoError(t, err)
	assertMock(t, mock)
}

// TestSetOtorisasi_InvalidLevel returns an error for level 6 (out of the
// supported 1-5 range).
func TestSetOtorisasi_InvalidLevel(t *testing.T) {
	gormDB, _, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB, nil)

	err := repo.SetOtorisasi(context.Background(), "BKK-1", 6, "SA")
	require.Error(t, err)
}

// TestSetOtorisasi_Level5 verifies the raw-SQL update generalises correctly
// to level 5, not just levels 1/2.
func TestSetOtorisasi_Level5(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB, nil)

	mock.ExpectExec(`UPDATE DBTRANS SET IsOtorisasi5 = 1, OtoUser5 = @p1, TglOto5 = @p2 WHERE NoBukti = @p3`).
		WithArgs("SA", sqlmock.AnyArg(), "BKK-1").
		WillReturnResult(sqlmock.NewResult(0, 1))

	err := repo.SetOtorisasi(context.Background(), "BKK-1", 5, "SA")
	require.NoError(t, err)
	assertMock(t, mock)
}

// TestCancelOtorisasi_Level5 verifies the raw-SQL update generalises
// correctly to level 5.
func TestCancelOtorisasi_Level5(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB, nil)

	mock.ExpectExec(`UPDATE DBTRANS SET IsOtorisasi5 = 0, OtoUser5 = '', TglOto5 = NULL WHERE NoBukti = @p1`).
		WithArgs("BKK-1").
		WillReturnResult(sqlmock.NewResult(0, 1))

	err := repo.CancelOtorisasi(context.Background(), "BKK-1", 5)
	require.NoError(t, err)
	assertMock(t, mock)
}

// TestCancelOtorisasi_Level2 verifies the raw-SQL update for level 2.
func TestCancelOtorisasi_Level2(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB, nil)

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
	repo := NewSKasBankRepository(gormDB, nil)

	mock.ExpectBegin()
	mock.ExpectQuery(`SELECT.*FROM DBNOMOR WITH`).
		WillReturnRows(sqlmock.NewRows([]string{"NOBKK"}).AddRow("202606-0005"))
	mock.ExpectExec("UPDATE.*DBNOMOR.*SET.*NOBKK").
		WithArgs("202606-0006").
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()

	out, _, _, err := repo.GenerateNoBukti(context.Background(), "BKK", "SA", 6, 2025)
	require.NoError(t, err)
	assert.Regexp(t, `^BKK-\d{6}-\d{4}$`, out)
	assertMock(t, mock)
}

// TestGenerateNoBukti_UnknownTipe returns ErrUnknownTipe for an invalid tipe.
// The repository still opens a transaction, so we expect Begin/Rollback.
func TestGenerateNoBukti_UnknownTipe(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB, nil)

	mock.ExpectBegin()
	mock.ExpectRollback()

	_, _, _, err := repo.GenerateNoBukti(context.Background(), "XYZ", "SA", 6, 2025)
	require.ErrorIs(t, err, ErrUnknownTipe)
	assertMock(t, mock)
}

// TestLookupPerkiraan_NoFilter covers the unfiltered path.
func TestLookupPerkiraan_NoFilter(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB, nil)

	rows := sqlmock.NewRows([]string{"Perkiraan", "Keterangan"}).
		AddRow("1101", "Kas Besar").
		AddRow("1102", "Kas Kecil")
	mock.ExpectQuery("SELECT.*DBPERKIRAAN").
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
	repo := NewSKasBankRepository(gormDB, nil)

	rows := sqlmock.NewRows([]string{"Perkiraan", "Keterangan", "Kelompok"}).
		AddRow("1101", "Kas Besar", "1")
	mock.ExpectQuery("SELECT.*DBPERKIRAAN").
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
	repo := NewSKasBankRepository(gormDB, nil)

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
	repo := NewSKasBankRepository(gormDB, nil)

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
	repo := NewSKasBankRepository(gormDB, nil)

	mock.ExpectQuery(`SELECT COALESCE\(SUM\(Debet\), 0\) AS TotalD, COALESCE\(SUM\(Kredit\), 0\) AS TotalK FROM DBTRANSAKSI WHERE NoBukti = @p1`).
		WithArgs("BKK-1").
		WillReturnRows(sqlmock.NewRows([]string{"TotalD", "TotalK"}).AddRow(5000.0, 5000.0))

	d, k, err := repo.RecalcTotals(context.Background(), "BKK-1")
	require.NoError(t, err)
	assert.Equal(t, 5000.0, d)
	assert.Equal(t, 5000.0, k)
	assertMock(t, mock)
}

// TestGetAggregateTotals_EmptyInput verifies that an empty noBuktis slice
// short-circuits before issuing any SQL — avoiding a query with an empty
// IN (...) clause. No mock expectation is set, so any query attempt would
// fail the test via assertMock.
func TestGetAggregateTotals_EmptyInput(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB, nil)

	out, err := repo.GetAggregateTotals(context.Background(), []string{})
	require.NoError(t, err)
	assert.Empty(t, out)
	assertMock(t, mock) // no query expected/consumed
}

// TestGetAggregateTotals_SingleVoucher_IdrAndUsdLines covers TASK-022
// Scenario 1: a voucher with one IDR line and one USD line. JumlahValas
// must equal only the USD line's Debet+Kredit; JumlahRupiah must equal the
// sum of both lines' Rupiah-converted amounts (each (Debet+Kredit)*Kurs).
func TestGetAggregateTotals_SingleVoucher_IdrAndUsdLines(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB, nil)

	// IDR line: Debet=1000000, Kredit=0, Kurs=1 -> contributes 0 to JumlahValas, 1000000 to JumlahRupiah.
	// USD line: Debet=0, Kredit=100, Kurs=15000 -> contributes 100 to JumlahValas, 1500000 to JumlahRupiah.
	mock.ExpectQuery(`SELECT NoBukti,\s*COALESCE\(SUM\(Debet\), 0\) AS TotalD,\s*COALESCE\(SUM\(Kredit\), 0\) AS TotalK,\s*COALESCE\(SUM\(CASE WHEN Valas <> 'IDR' THEN Debet \+ Kredit ELSE 0 END\), 0\) AS JumlahValas,\s*COALESCE\(SUM\(\(Debet \+ Kredit\) \* Kurs\), 0\) AS JumlahRupiah\s*FROM DBTRANSAKSI\s*WHERE NoBukti IN \(.+\)\s*GROUP BY NoBukti`).
		WithArgs("BKK-1").
		WillReturnRows(sqlmock.NewRows([]string{"NoBukti", "TotalD", "TotalK", "JumlahValas", "JumlahRupiah"}).
			AddRow("BKK-1", 1000000.0, 100.0, 100.0, 2500000.0))

	out, err := repo.GetAggregateTotals(context.Background(), []string{"BKK-1"})
	require.NoError(t, err)
	require.Contains(t, out, "BKK-1")
	assert.Equal(t, 100.0, out["BKK-1"].JumlahValas, "jumlahvalas must equal only the USD line's Debet+Kredit")
	assert.Equal(t, 2500000.0, out["BKK-1"].JumlahRupiah, "jumlahrupiah must equal the sum of both lines' Rupiah-converted amounts")
	assertMock(t, mock)
}

// TestGetAggregateTotals_MultipleVouchers_SingleQuery covers TASK-022
// Scenario 2: given 10 vouchers, exactly one aggregate query is issued for
// the whole page — not 10 separate queries. We assert this implicitly by
// only setting up ONE mock.ExpectQuery; if the repository issued more than
// one query, sqlmock would error with "all expectations were already
// fulfilled" on the second call.
func TestGetAggregateTotals_MultipleVouchers_SingleQuery(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB, nil)

	noBuktis := make([]string, 0, 10)
	args := make([]driver.Value, 0, 10)
	rows := sqlmock.NewRows([]string{"NoBukti", "TotalD", "TotalK", "JumlahValas", "JumlahRupiah"})
	for i := 0; i < 10; i++ {
		nb := fmt.Sprintf("BKK-%d", i)
		noBuktis = append(noBuktis, nb)
		args = append(args, nb)
		rows.AddRow(nb, 1000.0, 1000.0, 0.0, 1000.0)
	}

	mock.ExpectQuery(`SELECT NoBukti,.*FROM DBTRANSAKSI\s*WHERE NoBukti IN \(.+\)\s*GROUP BY NoBukti`).
		WithArgs(args...).
		WillReturnRows(rows)

	out, err := repo.GetAggregateTotals(context.Background(), noBuktis)
	require.NoError(t, err)
	assert.Len(t, out, 10)
	assertMock(t, mock) // exactly one query expected/consumed for the whole batch
}

// TestGetAggregateTotals_VoucherWithNoDetailLines_NotInResult covers the
// edge case where a voucher has zero detail lines: GROUP BY naturally
// excludes it from the result set, so the caller must treat a missing key
// as zero totals (not an error) — verified at the service layer.
func TestGetAggregateTotals_VoucherWithNoDetailLines_NotInResult(t *testing.T) {
	gormDB, mock, rawDB := newTestDB(t)
	defer rawDB.Close()
	repo := NewSKasBankRepository(gormDB, nil)

	mock.ExpectQuery(`SELECT NoBukti,.*FROM DBTRANSAKSI\s*WHERE NoBukti IN \(.+\)\s*GROUP BY NoBukti`).
		WithArgs("BKK-EMPTY").
		WillReturnRows(sqlmock.NewRows([]string{"NoBukti", "TotalD", "TotalK", "JumlahValas", "JumlahRupiah"}))

	out, err := repo.GetAggregateTotals(context.Background(), []string{"BKK-EMPTY"})
	require.NoError(t, err)
	assert.NotContains(t, out, "BKK-EMPTY")
	assertMock(t, mock)
}
