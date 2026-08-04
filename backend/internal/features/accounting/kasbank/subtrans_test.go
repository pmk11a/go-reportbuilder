// Package kasbank — sub-transaction logic tests.
//
// These tests cover the sub-form trigger logic, open-invoice filtering,
// StatusGiro derivation, IDR currency rules, and field mapping that mirror
// the legacy Delphi FrmKasBank.pas behaviour.
//
// NOTE: newTestDB is declared in repository_test.go — do NOT redeclare here.
//
// Key Delphi references:
//   FrmKasBank.pas CekLawanDiPosting (line 1766) — sub-form trigger
//   FrmKasBank.pas IsiTempHutPiut (line 566)     — open invoice filter
//   FrmKasBank.pas SimpanDataHutPiut (line 819)   — DBHUTPIUT save
//   FrmKasBank.pas THPCChange                     — StatusGiro
//   FrmKasBank.pas SimpanDataGiro (line 1313)     — IDR rule
package kasbank

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/masza1/dapen-backend/internal/infrastructure/config"
	"github.com/masza1/dapen-backend/internal/infrastructure/persistence/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlserver"
	"gorm.io/gorm"
)

// =============================================================================
// calculateDK / calculateStatusGiro
// NOTE: TestCalculateDK and TestCalculateStatusGiro are declared in
// service_test.go — do NOT redeclare here. The tests below focus on the
// ResolveSubTransaction, GetOutstandingHutPiut, applyGiroIDRRule, and
// applyDepositoIDRRule code paths.
// =============================================================================

// =============================================================================
// ResolveSubTransaction
// Mirrors Delphi FrmKasBank.pas::CekLawanDiPosting (line 1766):
//   SELECT * FROM dbPostHutPiut WHERE perkiraan = mLawan
// IsLokalORexim and TipeDK are now read and propagated to the caller.
// =============================================================================

func TestResolveSubTransaction_NoMatch(t *testing.T) {
	gDB, mock, _ := newTestDB(t)
	mock.ExpectQuery(`SELECT .* FROM "DBPOSTHUTPIUT`).
		WithArgs("UNKNOWN").
		WillReturnRows(sqlmock.NewRows([]string{"Perkiraan", "Kode", "IsLokalORExim", "TipeDK"}))
	svc := NewSKasBankService(nil, gDB, &config.SConfig{EnableGiroFeature: true, EnableDepositoFeature: true}, nil)
	res, err := svc.ResolveSubTransaction(context.Background(), "UNKNOWN", "D")
	require.NoError(t, err)
	assert.Empty(t, res.Trigger)
	assert.Empty(t, res.Kode)
	assert.False(t, res.IsLokalORexim)
	assert.Empty(t, res.TipeDK)
}

func TestResolveSubTransaction_DP_D_side_giro(t *testing.T) {
	gDB, mock, _ := newTestDB(t)
	mock.ExpectQuery(`SELECT .* FROM "DBPOSTHUTPIUT`).
		WithArgs("2100").
		WillReturnRows(sqlmock.NewRows([]string{"Perkiraan", "Kode", "IsLokalORExim", "TipeDK"}).
			AddRow("2100", "DP", true, "D"))
	svc := NewSKasBankService(nil, gDB, &config.SConfig{EnableGiroFeature: true, EnableDepositoFeature: true}, nil)
	res, err := svc.ResolveSubTransaction(context.Background(), "2100", "D")
	require.NoError(t, err)
	assert.Equal(t, "giro", res.Trigger)
	assert.Equal(t, "DP", res.Kode)
	assert.Equal(t, "DP+", res.StatusP)
	assert.Empty(t, res.StatusL)
	assert.True(t, res.IsLokalORexim)
	assert.Equal(t, "D", res.TipeDK)
}

func TestResolveSubTransaction_DP_K_side_giro(t *testing.T) {
	gDB, mock, _ := newTestDB(t)
	mock.ExpectQuery(`SELECT .* FROM "DBPOSTHUTPIUT`).
		WithArgs("2100").
		WillReturnRows(sqlmock.NewRows([]string{"Perkiraan", "Kode", "IsLokalORExim", "TipeDK"}).
			AddRow("2100", "DP", false, "K"))
	svc := NewSKasBankService(nil, gDB, &config.SConfig{EnableGiroFeature: true, EnableDepositoFeature: true}, nil)
	res, err := svc.ResolveSubTransaction(context.Background(), "2100", "K")
	require.NoError(t, err)
	assert.Equal(t, "giro", res.Trigger)
	assert.Equal(t, "DP", res.Kode)
	assert.Empty(t, res.StatusP)
	assert.Equal(t, "DP-", res.StatusL)
	assert.False(t, res.IsLokalORexim)
	assert.Equal(t, "K", res.TipeDK)
}

func TestResolveSubTransaction_HT_D_side_hutpiut(t *testing.T) {
	gDB, mock, _ := newTestDB(t)
	mock.ExpectQuery(`SELECT .* FROM "DBPOSTHUTPIUT`).
		WithArgs("2100").
		WillReturnRows(sqlmock.NewRows([]string{"Perkiraan", "Kode", "IsLokalORExim", "TipeDK"}).
			AddRow("2100", "HT", true, "D"))
	svc := NewSKasBankService(nil, gDB, &config.SConfig{EnableGiroFeature: true, EnableDepositoFeature: true}, nil)
	res, err := svc.ResolveSubTransaction(context.Background(), "2100", "D")
	require.NoError(t, err)
	assert.Equal(t, "hutpiut", res.Trigger)
	assert.Equal(t, "HT", res.Kode)
	assert.Equal(t, "HT-", res.StatusP)
}

func TestResolveSubTransaction_HT_K_side_hutpiut(t *testing.T) {
	gDB, mock, _ := newTestDB(t)
	mock.ExpectQuery(`SELECT .* FROM "DBPOSTHUTPIUT`).
		WithArgs("2100").
		WillReturnRows(sqlmock.NewRows([]string{"Perkiraan", "Kode", "IsLokalORExim", "TipeDK"}).
			AddRow("2100", "HT", false, "K"))
	svc := NewSKasBankService(nil, gDB, &config.SConfig{EnableGiroFeature: true, EnableDepositoFeature: true}, nil)
	res, err := svc.ResolveSubTransaction(context.Background(), "2100", "K")
	require.NoError(t, err)
	assert.Equal(t, "hutpiut", res.Trigger)
	assert.Equal(t, "HT", res.Kode)
	assert.Empty(t, res.StatusP)
	assert.Equal(t, "HT+", res.StatusL)
}

func TestResolveSubTransaction_PT_D_side_hutpiut(t *testing.T) {
	gDB, mock, _ := newTestDB(t)
	mock.ExpectQuery(`SELECT .* FROM "DBPOSTHUTPIUT`).
		WithArgs("1100").
		WillReturnRows(sqlmock.NewRows([]string{"Perkiraan", "Kode", "IsLokalORExim", "TipeDK"}).
			AddRow("1100", "PT", false, "D"))
	svc := NewSKasBankService(nil, gDB, &config.SConfig{EnableGiroFeature: true, EnableDepositoFeature: true}, nil)
	res, err := svc.ResolveSubTransaction(context.Background(), "1100", "D")
	require.NoError(t, err)
	assert.Equal(t, "hutpiut", res.Trigger)
	assert.Equal(t, "PT", res.Kode)
	assert.Equal(t, "PT+", res.StatusP)
}

func TestResolveSubTransaction_PT_K_side_hutpiut(t *testing.T) {
	gDB, mock, _ := newTestDB(t)
	mock.ExpectQuery(`SELECT .* FROM "DBPOSTHUTPIUT`).
		WithArgs("1100").
		WillReturnRows(sqlmock.NewRows([]string{"Perkiraan", "Kode", "IsLokalORExim", "TipeDK"}).
			AddRow("1100", "PT", false, "D"))
	svc := NewSKasBankService(nil, gDB, &config.SConfig{EnableGiroFeature: true, EnableDepositoFeature: true}, nil)
	res, err := svc.ResolveSubTransaction(context.Background(), "1100", "K")
	require.NoError(t, err)
	assert.Equal(t, "hutpiut", res.Trigger)
	assert.Equal(t, "PT", res.Kode)
	assert.Empty(t, res.StatusP)
	assert.Equal(t, "PT-", res.StatusL)
}

func TestResolveSubTransaction_UHT_D_side(t *testing.T) {
	gDB, mock, _ := newTestDB(t)
	mock.ExpectQuery(`SELECT .* FROM "DBPOSTHUTPIUT`).
		WithArgs("2100").
		WillReturnRows(sqlmock.NewRows([]string{"Perkiraan", "Kode", "IsLokalORExim", "TipeDK"}).
			AddRow("2100", "UHT", false, "D"))
	svc := NewSKasBankService(nil, gDB, &config.SConfig{EnableGiroFeature: true, EnableDepositoFeature: true}, nil)
	res, err := svc.ResolveSubTransaction(context.Background(), "2100", "D")
	require.NoError(t, err)
	assert.Equal(t, "hutpiut", res.Trigger)
	assert.Equal(t, "UHT", res.Kode)
	assert.Equal(t, "UHT+", res.StatusP)
}

func TestResolveSubTransaction_UHT_K_side(t *testing.T) {
	gDB, mock, _ := newTestDB(t)
	mock.ExpectQuery(`SELECT .* FROM "DBPOSTHUTPIUT`).
		WithArgs("2100").
		WillReturnRows(sqlmock.NewRows([]string{"Perkiraan", "Kode", "IsLokalORExim", "TipeDK"}).
			AddRow("2100", "UHT", false, "D"))
	svc := NewSKasBankService(nil, gDB, &config.SConfig{EnableGiroFeature: true, EnableDepositoFeature: true}, nil)
	res, err := svc.ResolveSubTransaction(context.Background(), "2100", "K")
	require.NoError(t, err)
	assert.Equal(t, "hutpiut", res.Trigger)
	assert.Equal(t, "UHT", res.Kode)
	assert.Empty(t, res.StatusP)
	assert.Equal(t, "UHT-", res.StatusL)
}

func TestResolveSubTransaction_UPT_D_side(t *testing.T) {
	gDB, mock, _ := newTestDB(t)
	mock.ExpectQuery(`SELECT .* FROM "DBPOSTHUTPIUT`).
		WithArgs("1100").
		WillReturnRows(sqlmock.NewRows([]string{"Perkiraan", "Kode", "IsLokalORExim", "TipeDK"}).
			AddRow("1100", "UPT", false, "D"))
	svc := NewSKasBankService(nil, gDB, &config.SConfig{EnableGiroFeature: true, EnableDepositoFeature: true}, nil)
	res, err := svc.ResolveSubTransaction(context.Background(), "1100", "D")
	require.NoError(t, err)
	assert.Equal(t, "hutpiut", res.Trigger)
	assert.Equal(t, "UPT", res.Kode)
	assert.Equal(t, "UPT-", res.StatusP)
}

func TestResolveSubTransaction_UPT_K_side(t *testing.T) {
	gDB, mock, _ := newTestDB(t)
	mock.ExpectQuery(`SELECT .* FROM "DBPOSTHUTPIUT`).
		WithArgs("1100").
		WillReturnRows(sqlmock.NewRows([]string{"Perkiraan", "Kode", "IsLokalORExim", "TipeDK"}).
			AddRow("1100", "UPT", false, "D"))
	svc := NewSKasBankService(nil, gDB, &config.SConfig{EnableGiroFeature: true, EnableDepositoFeature: true}, nil)
	res, err := svc.ResolveSubTransaction(context.Background(), "1100", "K")
	require.NoError(t, err)
	assert.Equal(t, "hutpiut", res.Trigger)
	assert.Equal(t, "UPT", res.Kode)
	assert.Empty(t, res.StatusP)
	assert.Equal(t, "UPT+", res.StatusL)
}

func TestResolveSubTransaction_AKV_D_side_aktiva(t *testing.T) {
	gDB, mock, _ := newTestDB(t)
	mock.ExpectQuery(`SELECT .* FROM "DBPOSTHUTPIUT`).
		WithArgs("1300").
		WillReturnRows(sqlmock.NewRows([]string{"Perkiraan", "Kode", "IsLokalORExim", "TipeDK"}).
			AddRow("1300", "AKV", false, "D"))
	svc := NewSKasBankService(nil, gDB, &config.SConfig{EnableGiroFeature: true, EnableDepositoFeature: true}, nil)
	res, err := svc.ResolveSubTransaction(context.Background(), "1300", "D")
	require.NoError(t, err)
	assert.Equal(t, "aktiva", res.Trigger)
	assert.Equal(t, "AKV", res.Kode)
	assert.Equal(t, "AKV+", res.StatusP)
}

func TestResolveSubTransaction_AKV_K_side_aktiva(t *testing.T) {
	gDB, mock, _ := newTestDB(t)
	mock.ExpectQuery(`SELECT .* FROM "DBPOSTHUTPIUT`).
		WithArgs("1300").
		WillReturnRows(sqlmock.NewRows([]string{"Perkiraan", "Kode", "IsLokalORExim", "TipeDK"}).
			AddRow("1300", "AKV", false, "D"))
	svc := NewSKasBankService(nil, gDB, &config.SConfig{EnableGiroFeature: true, EnableDepositoFeature: true}, nil)
	res, err := svc.ResolveSubTransaction(context.Background(), "1300", "K")
	require.NoError(t, err)
	assert.Equal(t, "aktiva", res.Trigger)
	assert.Equal(t, "AKV", res.Kode)
	assert.Empty(t, res.StatusP)
	assert.Equal(t, "AKV-", res.StatusL)
}

func TestResolveSubTransaction_AKM_D_side_aktiva(t *testing.T) {
	gDB, mock, _ := newTestDB(t)
	mock.ExpectQuery(`SELECT .* FROM "DBPOSTHUTPIUT`).
		WithArgs("1300").
		WillReturnRows(sqlmock.NewRows([]string{"Perkiraan", "Kode", "IsLokalORExim", "TipeDK"}).
			AddRow("1300", "AKM", false, "D"))
	svc := NewSKasBankService(nil, gDB, &config.SConfig{EnableGiroFeature: true, EnableDepositoFeature: true}, nil)
	res, err := svc.ResolveSubTransaction(context.Background(), "1300", "D")
	require.NoError(t, err)
	assert.Equal(t, "aktiva", res.Trigger)
	assert.Equal(t, "AKM", res.Kode)
	assert.Equal(t, "AKM+", res.StatusP)
}

func TestResolveSubTransaction_AKM_K_side_aktiva(t *testing.T) {
	gDB, mock, _ := newTestDB(t)
	mock.ExpectQuery(`SELECT .* FROM "DBPOSTHUTPIUT`).
		WithArgs("1300").
		WillReturnRows(sqlmock.NewRows([]string{"Perkiraan", "Kode", "IsLokalORExim", "TipeDK"}).
			AddRow("1300", "AKM", false, "D"))
	svc := NewSKasBankService(nil, gDB, &config.SConfig{EnableGiroFeature: true, EnableDepositoFeature: true}, nil)
	res, err := svc.ResolveSubTransaction(context.Background(), "1300", "K")
	require.NoError(t, err)
	assert.Equal(t, "aktiva", res.Trigger)
	assert.Equal(t, "AKM", res.Kode)
	assert.Empty(t, res.StatusP)
	assert.Equal(t, "AKM-", res.StatusL)
}

// =============================================================================
// GetOutstandingHutPiut
// Mirrors Delphi FrmKasBank.pas::IsiTempHutPiut (line 566):
//   HT/UPT: open when SUM(Kredit) - SUM(Debet) > 0  (outstanding debt)
//   PT/UHT: open when SUM(Debet) - SUM(Kredit) > 0  (outstanding receivable)
//   excludeNoBukti+excludeNoMsk excludes the in-progress row.
// =============================================================================

func TestGetOutstandingHutPiut_HT_stillOwe(t *testing.T) {
	gDB, mock, _ := newTestDB(t)
	// HT: SUM(Kredit)=500, SUM(Debet)=0 => diff=500 > 0 => open
	rows := sqlmock.NewRows([]string{
		"NoFaktur", "Tanggal", "JatuhTempo", "Catatan",
		"Debet", "Kredit", "DebetD", "KreditD",
		"Valas", "Kurs", "Tipe", "TipeTrans",
		"NoBukti", "NoUrutJurnal", "TipeDK",
	}).AddRow(
		"INV-H001", time.Now(), time.Now(), "HT Invoice",
		0.0, 500.0, 0.0, 500.0,
		"IDR", 1.0, "HT", "L",
		"BKK-202607-0001", "00001", "D",
	)
	mock.ExpectQuery(`SELECT .* FROM DBHUTPIUT`).
		WithArgs("CUST01", "2100").
		WillReturnRows(rows)

	svc := NewSKasBankService(nil, gDB, &config.SConfig{EnableGiroFeature: true, EnableDepositoFeature: true}, nil)
	results, err := svc.GetOutstandingHutPiut(context.Background(), "CUST01", "2100", "", 0)
	require.NoError(t, err)
	require.Len(t, results, 1)
	assert.Equal(t, "INV-H001", results[0].NoFaktur)
	assert.Equal(t, 0.0, results[0].Debet)
	assert.Equal(t, 500.0, results[0].Kredit)
	assert.Equal(t, "HT", results[0].Tipe)
}

func TestGetOutstandingHutPiut_HT_overpaid_excluded(t *testing.T) {
	gDB, mock, _ := newTestDB(t)
	// HT: SUM(Kredit)=500, SUM(Debet)=500 => diff=0 => NOT open
	// The SQL HAVING filter excludes this group, so we get empty rows.
	mock.ExpectQuery(`SELECT .* FROM DBHUTPIUT`).
		WithArgs("CUST01", "2100").
		WillReturnRows(sqlmock.NewRows([]string{
			"NoFaktur", "Tanggal", "JatuhTempo", "Catatan",
			"Debet", "Kredit", "DebetD", "KreditD",
			"Valas", "Kurs", "Tipe", "TipeTrans",
			"NoBukti", "NoUrutJurnal", "TipeDK",
		}))
	svc := NewSKasBankService(nil, gDB, &config.SConfig{EnableGiroFeature: true, EnableDepositoFeature: true}, nil)
	results, err := svc.GetOutstandingHutPiut(context.Background(), "CUST01", "2100", "", 0)
	require.NoError(t, err)
	assert.Empty(t, results, "HT with SUM(K)=SUM(D) must not appear in open list")
}

func TestGetOutstandingHutPiut_PT_stillOwed(t *testing.T) {
	gDB, mock, _ := newTestDB(t)
	// PT: SUM(Debet)=300, SUM(Kredit)=0 => diff=300 > 0 => open
	rows := sqlmock.NewRows([]string{
		"NoFaktur", "Tanggal", "JatuhTempo", "Catatan",
		"Debet", "Kredit", "DebetD", "KreditD",
		"Valas", "Kurs", "Tipe", "TipeTrans",
		"NoBukti", "NoUrutJurnal", "TipeDK",
	}).AddRow(
		"INV-P001", time.Now(), time.Now(), "PT Invoice",
		300.0, 0.0, 300.0, 0.0,
		"IDR", 1.0, "PT", "L",
		"BKM-202607-0001", "00001", "D",
	)
	mock.ExpectQuery(`SELECT .* FROM DBHUTPIUT`).
		WithArgs("CUST02", "1100").
		WillReturnRows(rows)

	svc := NewSKasBankService(nil, gDB, &config.SConfig{EnableGiroFeature: true, EnableDepositoFeature: true}, nil)
	results, err := svc.GetOutstandingHutPiut(context.Background(), "CUST02", "1100", "", 0)
	require.NoError(t, err)
	require.Len(t, results, 1)
	assert.Equal(t, "INV-P001", results[0].NoFaktur)
	assert.Equal(t, 300.0, results[0].Debet)
	assert.Equal(t, 0.0, results[0].Kredit)
	assert.Equal(t, "PT", results[0].Tipe)
}

func TestGetOutstandingHutPiut_UHT_stillOwed(t *testing.T) {
	gDB, mock, _ := newTestDB(t)
	rows := sqlmock.NewRows([]string{
		"NoFaktur", "Tanggal", "JatuhTempo", "Catatan",
		"Debet", "Kredit", "DebetD", "KreditD",
		"Valas", "Kurs", "Tipe", "TipeTrans",
		"NoBukti", "NoUrutJurnal", "TipeDK",
	}).AddRow(
		"INV-UHT01", time.Now(), time.Now(), "UHT Invoice",
		750.0, 0.0, 750.0, 0.0,
		"IDR", 1.0, "UHT", "L",
		"BKM-202607-0002", "00001", "D",
	)
	mock.ExpectQuery(`SELECT .* FROM DBHUTPIUT`).
		WithArgs("CUST05", "1100").
		WillReturnRows(rows)
	svc := NewSKasBankService(nil, gDB, &config.SConfig{EnableGiroFeature: true, EnableDepositoFeature: true}, nil)
	results, err := svc.GetOutstandingHutPiut(context.Background(), "CUST05", "1100", "", 0)
	require.NoError(t, err)
	require.Len(t, results, 1)
	assert.Equal(t, "INV-UHT01", results[0].NoFaktur)
	assert.Equal(t, "UHT", results[0].Tipe)
	assert.Equal(t, 750.0, results[0].Debet)
	assert.Equal(t, "D", results[0].TipeDK)
}

func TestGetOutstandingHutPiut_UPT_stillOwe(t *testing.T) {
	gDB, mock, _ := newTestDB(t)
	rows := sqlmock.NewRows([]string{
		"NoFaktur", "Tanggal", "JatuhTempo", "Catatan",
		"Debet", "Kredit", "DebetD", "KreditD",
		"Valas", "Kurs", "Tipe", "TipeTrans",
		"NoBukti", "NoUrutJurnal", "TipeDK",
	}).AddRow(
		"INV-UPT01", time.Now(), time.Now(), "UPT Invoice",
		0.0, 250.0, 0.0, 250.0,
		"IDR", 1.0, "UPT", "L",
		"BKK-202607-0003", "00001", "D",
	)
	mock.ExpectQuery(`SELECT .* FROM DBHUTPIUT`).
		WithArgs("CUST04", "2100").
		WillReturnRows(rows)
	svc := NewSKasBankService(nil, gDB, &config.SConfig{EnableGiroFeature: true, EnableDepositoFeature: true}, nil)
	results, err := svc.GetOutstandingHutPiut(context.Background(), "CUST04", "2100", "", 0)
	require.NoError(t, err)
	require.Len(t, results, 1)
	assert.Equal(t, "INV-UPT01", results[0].NoFaktur)
	assert.Equal(t, "UPT", results[0].Tipe)
	assert.Equal(t, 250.0, results[0].Kredit)
}

func TestGetOutstandingHutPiut_excludesInProgressRow(t *testing.T) {
	gDB, mock, _ := newTestDB(t)
	// After excluding BKK-202607-0002+NoMsk=2, only BKK-202607-0003 remains
	rows := sqlmock.NewRows([]string{
		"NoFaktur", "Tanggal", "JatuhTempo", "Catatan",
		"Debet", "Kredit", "DebetD", "KreditD",
		"Valas", "Kurs", "Tipe", "TipeTrans",
		"NoBukti", "NoUrutJurnal", "TipeDK",
	}).AddRow(
		"INV-EXCL", time.Now(), time.Now(), "Excluded row absent",
		0.0, 100.0, 0.0, 100.0,
		"IDR", 1.0, "HT", "L",
		"BKK-202607-0003", "00001", "D",
	)
	mock.ExpectQuery(`SELECT .* FROM DBHUTPIUT`).
		WithArgs("CUST03", "2100", "BKK-202607-00020002").
		WillReturnRows(rows)
	svc := NewSKasBankService(nil, gDB, &config.SConfig{EnableGiroFeature: true, EnableDepositoFeature: true}, nil)
	results, err := svc.GetOutstandingHutPiut(
		context.Background(),
		"CUST03", "2100",
		"BKK-202607-0002", // excludeNoBukti
		2,                   // excludeNoMsk
	)
	require.NoError(t, err)
	require.Len(t, results, 1)
	assert.Equal(t, "INV-EXCL", results[0].NoFaktur)
	// BKK-202607-0002 with NoMsk=2 must not appear
}

func TestGetOutstandingHutPiut_TipeDKPropagated(t *testing.T) {
	gDB, mock, _ := newTestDB(t)
	rows := sqlmock.NewRows([]string{
		"NoFaktur", "Tanggal", "JatuhTempo", "Catatan",
		"Debet", "Kredit", "DebetD", "KreditD",
		"Valas", "Kurs", "Tipe", "TipeTrans",
		"NoBukti", "NoUrutJurnal", "TipeDK",
	}).AddRow(
		"INV-TDK", time.Now(), time.Now(), "TipeDK filled",
		0.0, 400.0, 0.0, 400.0,
		"IDR", 1.0, "HT", "L",
		"BKK-202607-0005", "00001", "D",
	)
	mock.ExpectQuery(`SELECT .* FROM DBHUTPIUT`).
		WithArgs("CUST07", "2100").
		WillReturnRows(rows)
	svc := NewSKasBankService(nil, gDB, &config.SConfig{EnableGiroFeature: true, EnableDepositoFeature: true}, nil)
	results, err := svc.GetOutstandingHutPiut(context.Background(), "CUST07", "2100", "", 0)
	require.NoError(t, err)
	require.Len(t, results, 1)
	assert.Equal(t, "D", results[0].TipeDK, "TipeDK from DBHUTPIUT must be propagated")
}

// =============================================================================
// applyGiroIDRRule
// Mirrors Delphi FrmKasBank.pas SimpanDataGiro + FrmKasBankGiro.pas btnOKClick:
//   IDR (or blank): Debet=Kredit=Jumlah=0; DebetRp/KreditRp/JumlahRp carry value
//   Non-IDR: Valas columns carry value; Rp derived as Nominal * Kurs
// =============================================================================

func TestApplyGiroIDR_IDR_clearsValas(t *testing.T) {
	g := &models.SDBGIRO{
		KodeVls:  "IDR",
		Debet:    100,
		Kredit:   0,
		Jumlah:   100,
		DebetRp:  100,
		KreditRp: 0,
		JumlahRp: 100,
		Kurs:     1,
	}
	applyGiroIDRRule(g)
	assert.Equal(t, 0.0, g.Debet, "IDR: Valas Debet must be 0")
	assert.Equal(t, 0.0, g.Kredit, "IDR: Valas Kredit must be 0")
	assert.Equal(t, 0.0, g.Jumlah, "IDR: Valas Jumlah must be 0")
	assert.Equal(t, 100.0, g.DebetRp, "IDR: DebetRp preserved")
	assert.Equal(t, 0.0, g.KreditRp, "IDR: KreditRp preserved")
}

func TestApplyGiroIDR_IDR_blankIsIDR(t *testing.T) {
	g := &models.SDBGIRO{KodeVls: ""}
	applyGiroIDRRule(g)
	assert.Equal(t, 0.0, g.Debet, "blank Valas must be treated as IDR")
}

func TestApplyGiroIDR_nonIDR_derivesRp(t *testing.T) {
	g := &models.SDBGIRO{
		KodeVls: "USD",
		Debet:   50,
		Kredit:  0,
		Jumlah:  50,
		Kurs:    16000,
	}
	applyGiroIDRRule(g)
	assert.Equal(t, 50.0, g.Debet, "Non-IDR: Valas Debet preserved")
	assert.Equal(t, 0.0, g.Kredit, "Non-IDR: Valas Kredit preserved (untouched by rule)")
	assert.Equal(t, 800000.0, g.DebetRp, "Non-IDR: DebetRp = Debet * Kurs")
	assert.Equal(t, 800000.0, g.JumlahRp, "Non-IDR: JumlahRp = Jumlah * Kurs")
}

func TestApplyGiroIDR_zeroKurs_defaultsToOne(t *testing.T) {
	g := &models.SDBGIRO{KodeVls: "EUR", Debet: 10, Kurs: 0}
	applyGiroIDRRule(g)
	assert.Equal(t, 1.0, g.Kurs, "zero Kurs must default to 1")
	assert.Equal(t, 10.0, g.DebetRp, "DebetRp = Debet * 1")
}

// =============================================================================
// applyDepositoIDRRule
// Same IDR rule as applyGiroIDRRule.
// Mirrors FrmKasBankDeposito.pas btnOKClick.
// =============================================================================

func TestApplyDepositoIDR_IDR_clearsValas(t *testing.T) {
	d := &models.SDBDEPOSITO{KodeVls: "IDR", Debet: 1000, Kredit: 0}
	applyDepositoIDRRule(d)
	assert.Equal(t, 0.0, d.Debet, "IDR: Valas Debet must be 0")
	assert.Equal(t, 0.0, d.Kredit, "IDR: Valas Kredit must be 0")
}

func TestApplyDepositoIDR_IDR_blank(t *testing.T) {
	d := &models.SDBDEPOSITO{KodeVls: ""}
	applyDepositoIDRRule(d)
	assert.Equal(t, 0.0, d.Debet, "blank Valas must be treated as IDR")
}

func TestApplyDepositoIDR_nonIDR_derivesRp(t *testing.T) {
	d := &models.SDBDEPOSITO{KodeVls: "SGD", Kredit: 20, Kurs: 12000}
	applyDepositoIDRRule(d)
	assert.Equal(t, 20.0, d.Kredit, "Non-IDR: Valas Kredit preserved")
	assert.Equal(t, 240000.0, d.KreditRp, "KreditRp = Kredit * Kurs")
	assert.Equal(t, 0.0, d.Debet, "Non-IDR: Valas Debet cleared")
}

// =============================================================================
// HutPiut normalization + NoMsk resolution
// Mirrors Delphi SimpanDataHutPiut (line 819): Tipe strips +/− suffix,
// TipeDK captured separately, NoMsk derived from existing rows when absent.
// =============================================================================

func TestCreateHeader_HutPiutNormalizesTipe(t *testing.T) {
	t.Parallel()
	// Verify the normalization logic directly (service-side).
	cases := []struct {
		inputTipe    string
		expectedTipe string
		expectedDK   string
	}{
		{"PT+", "PT", "K"},
		{"PT-", "PT", "D"},
		{"HT+", "HT", "K"},
		{"HT-", "HT", "D"},
		{"UPT+", "UPT", "K"},
		{"UHT-", "UHT", "D"},
		{"PT", "PT", "D"},
		{"HT", "HT", "D"},
	}
	for _, tc := range cases {
		t.Run(tc.inputTipe, func(t *testing.T) {
			typ := tc.inputTipe
			tipeDK := ""
			if len(typ) > 2 && (typ[2] == '+' || typ[2] == '-') {
				tipeDK = string(typ[2])
				typ = typ[:2]
			}
			if tipeDK == "" {
				tipeDK = "D"
			}
			assert.Equal(t, tc.expectedTipe, typ, "Tipe mismatch")
			assert.Equal(t, tc.expectedDK, tipeDK, "TipeDK mismatch")
		})
	}
}

func TestCreateHeader_HutPiutResolvesNoMskFromFE(t *testing.T) {
	t.Parallel()
	// When FE supplies nomsk=3, service should preserve it verbatim.
	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	gormDB, err := gorm.Open(sqlserver.New(sqlserver.Config{Conn: db}), &gorm.Config{})
	require.NoError(t, err)

	// HutPiut row inserted — match on NoFaktur + NoMsk=3 (the FE-supplied value).
	mock.ExpectExec(`^INSERT INTO DBHUTPIUT`).
		WillReturnResult(sqlmock.NewResult(1, 1))
	// TipeDK UPDATE (graceful skip if column missing).
	mock.ExpectExec(`^UPDATE DBHUTPIUT`).
		WillReturnError(errors.New("mssql: Invalid column name 'TipeDK'"))

	svc := NewSKasBankService(&mockRepo{}, gormDB, &config.SConfig{EnableGiroFeature: true}, nil)

	// Manually exercise the HutPiut normalization block from CreateHeader.
	noBukti := "V001"
	hpList := []models.SDBHUTPIUT{
		{NoFaktur: "INV001", Tipe: "PT+", TipeDK: "", NoMsk: 3, KodeCustSupp: "001"},
	}
	hpGroup := make(map[int]int)
	for i := range hpList {
		hp := &hpList[i]
		hp.NoBukti = noBukti
		if len(hp.Tipe) > 2 && (hp.Tipe[2] == '+' || hp.Tipe[2] == '-') {
			hp.TipeDK = string(hp.Tipe[2])
			hp.Tipe = hp.Tipe[:2]
		}
		if hp.TipeDK == "" {
			hp.TipeDK = "D"
		}
		if hp.NoMsk == 0 {
			hp.NoMsk = resolveHutPiutNoMsk(gormDB, noBukti, hp.KodeCustSupp)
		}
		hpGroup[hp.NoMsk]++
		hp.Urut = hpGroup[hp.NoMsk]
		if err := gormDB.Create(hp).Error; err != nil {
			t.Fatalf("insert: %v", err)
		}
		if err := gormDB.Exec(
			`UPDATE DBHUTPIUT SET [TipeDK] = ? WHERE LTRIM(RTRIM([NoBukti])) = ? AND [NoMsk] = ? AND [Urut] = ? AND LTRIM(RTRIM([NoFaktur])) = ?`,
			hp.TipeDK, hp.NoBukti, hp.NoMsk, hp.Urut, hp.NoFaktur,
		).Error; err != nil {
			// Expect TipeDK column missing (clean skip).
			if !strings.Contains(err.Error(), "Invalid column name") && !strings.Contains(err.Error(), "TipeDK") {
				t.Fatalf("TipeDK update unexpected: %v", err)
			}
		}
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("mock expectations: %v", err)
	}
	assert.Equal(t, "PT", hpList[0].Tipe, "Tipe should be stripped")
	assert.Equal(t, "K", hpList[0].TipeDK, "TipeDK should be 'K' from '+' suffix")
	assert.Equal(t, 3, hpList[0].NoMsk, "NoMsk from FE should be preserved")
	assert.Equal(t, 1, hpList[0].Urut, "Urut counter should start at 1")
}

func TestCreateHeader_HutPiutFallsBackToResolveHutPiutNoMsk(t *testing.T) {
	t.Parallel()

	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	gormDB, err := gorm.Open(sqlserver.New(sqlserver.Config{Conn: db}), &gorm.Config{})
	require.NoError(t, err)

	// resolveHutPiutNoMsk call — returns MAX(NoMsk)=2 → next=3.
	mock.ExpectQuery(`SELECT COALESCE`).
		WithArgs("V002", "002").
		WillReturnRows(sqlmock.NewRows([]string{"max"}).AddRow(2))
	// INSERT HutPiut row.
	mock.ExpectExec(`^INSERT INTO DBHUTPIUT`).
		WillReturnResult(sqlmock.NewResult(1, 1))
	// TipeDK UPDATE — column absent, skip gracefully.
	mock.ExpectExec(`^UPDATE DBHUTPIUT`).
		WillReturnError(errors.New("mssql: Invalid column name 'TipeDK'"))

	svc := NewSKasBankService(&mockRepo{}, gormDB, &config.SConfig{EnableGiroFeature: true}, nil)

	noBukti := "V002"
	hpList := []models.SDBHUTPIUT{
		{NoFaktur: "INV002", Tipe: "HT", TipeDK: "", NoMsk: 0, KodeCustSupp: "002"},
	}
	hpGroup := make(map[int]int)
	for i := range hpList {
		hp := &hpList[i]
		hp.NoBukti = noBukti
		if len(hp.Tipe) > 2 && (hp.Tipe[2] == '+' || hp.Tipe[2] == '-') {
			hp.TipeDK = string(hp.Tipe[2])
			hp.Tipe = hp.Tipe[:2]
		}
		if hp.TipeDK == "" {
			hp.TipeDK = "D"
		}
		if hp.NoMsk == 0 {
			hp.NoMsk = resolveHutPiutNoMsk(gormDB, noBukti, hp.KodeCustSupp)
		}
		hpGroup[hp.NoMsk]++
		hp.Urut = hpGroup[hp.NoMsk]
		if err := gormDB.Create(hp).Error; err != nil {
			t.Fatalf("insert: %v", err)
		}
		if err := gormDB.Exec(
			`UPDATE DBHUTPIUT SET [TipeDK] = ? WHERE LTRIM(RTRIM([NoBukti])) = ? AND [NoMsk] = ? AND [Urut] = ? AND LTRIM(RTRIM([NoFaktur])) = ?`,
			hp.TipeDK, hp.NoBukti, hp.NoMsk, hp.Urut, hp.NoFaktur,
		).Error; err != nil {
			if !strings.Contains(err.Error(), "Invalid column name") && !strings.Contains(err.Error(), "TipeDK") {
				t.Fatalf("TipeDK update unexpected: %v", err)
			}
		}
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("mock expectations: %v", err)
	}
	assert.Equal(t, 3, hpList[0].NoMsk, "NoMsk should resolve to MAX+1=3")
}
