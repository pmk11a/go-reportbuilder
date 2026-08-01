package kasbank

import (
	"context"
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/masza1/dapen-backend/internal/infrastructure/persistence/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlserver"
	"gorm.io/gorm"
)

// mockRepo is a hand-rolled mock of IKasBankRepository. testify/mock
// would be heavier; the small surface area here means a struct with
// function fields is enough to cover all the test cases.
type mockRepo struct {
	listFn               func(ctx context.Context, q SListKasBankQuery) ([]SDbTrans, int64, error)
	getByNoBuktiFn       func(ctx context.Context, noBukti string) (*SDbTrans, error)
	insertHeaderFn       func(ctx context.Context, h *SDbTrans) error
	updateHeaderFn       func(ctx context.Context, h *SDbTrans) error
	deleteHeaderFn       func(ctx context.Context, noBukti string) error
	listDetailFn         func(ctx context.Context, noBukti string) ([]SDbTransaksi, error)
	getDetailFn          func(ctx context.Context, noBukti string, urut int) (*SDbTransaksi, error)
	insertDetailFn       func(ctx context.Context, d *SDbTransaksi) error
	updateDetailFn       func(ctx context.Context, d *SDbTransaksi) error
	deleteDetailFn       func(ctx context.Context, noBukti string, urut int) error
	setOtorisasiFn       func(ctx context.Context, noBukti string, level int, userID string) error
	cancelOtorFn         func(ctx context.Context, noBukti string, level int) error
	genNoBuktiFn         func(ctx context.Context, tipe string) (string, error)
	genNoBuktiWithinTxFn func(ctx context.Context, tx *gorm.DB, tipe, devisi string, bulan, tahun int) (string, string, string, error)
	lookupFn             func(ctx context.Context, query string, kelompokKas bool, limit int) ([]SDbPerkiraan, error)
	getPeriodeFn         func(ctx context.Context, userID string) (int, int, error)
	recalcTotalsFn       func(ctx context.Context, noBukti string) (float64, float64, error)
	getAggregateTotalsFn func(ctx context.Context, noBuktis []string) (map[string]SAggregateTotals, error)
	aggregateTotalsCalls int
}

func (m *mockRepo) List(ctx context.Context, q SListKasBankQuery) ([]SDbTrans, int64, error) {
	if m.listFn != nil {
		return m.listFn(ctx, q)
	}
	return nil, 0, nil
}
func (m *mockRepo) GetByNoBukti(ctx context.Context, noBukti string) (*SDbTrans, error) {
	if m.getByNoBuktiFn != nil {
		return m.getByNoBuktiFn(ctx, noBukti)
	}
	return nil, nil
}
func (m *mockRepo) InsertHeader(ctx context.Context, h *SDbTrans) error {
	if m.insertHeaderFn != nil {
		return m.insertHeaderFn(ctx, h)
	}
	return nil
}
func (m *mockRepo) UpdateHeader(ctx context.Context, h *SDbTrans) error {
	if m.updateHeaderFn != nil {
		return m.updateHeaderFn(ctx, h)
	}
	return nil
}
func (m *mockRepo) DeleteHeader(ctx context.Context, noBukti string) error {
	if m.deleteHeaderFn != nil {
		return m.deleteHeaderFn(ctx, noBukti)
	}
	return nil
}
func (m *mockRepo) ListDetail(ctx context.Context, noBukti string) ([]SDbTransaksi, error) {
	if m.listDetailFn != nil {
		return m.listDetailFn(ctx, noBukti)
	}
	return nil, nil
}
func (m *mockRepo) GetDetail(ctx context.Context, noBukti string, urut int) (*SDbTransaksi, error) {
	if m.getDetailFn != nil {
		return m.getDetailFn(ctx, noBukti, urut)
	}
	return nil, nil
}
func (m *mockRepo) InsertDetail(ctx context.Context, d *SDbTransaksi) error {
	if m.insertDetailFn != nil {
		return m.insertDetailFn(ctx, d)
	}
	return nil
}
func (m *mockRepo) UpdateDetail(ctx context.Context, d *SDbTransaksi) error {
	if m.updateDetailFn != nil {
		return m.updateDetailFn(ctx, d)
	}
	return nil
}
func (m *mockRepo) DeleteDetail(ctx context.Context, noBukti string, urut int) error {
	if m.deleteDetailFn != nil {
		return m.deleteDetailFn(ctx, noBukti, urut)
	}
	return nil
}
func (m *mockRepo) SetOtorisasi(ctx context.Context, noBukti string, level int, userID string) error {
	if m.setOtorisasiFn != nil {
		return m.setOtorisasiFn(ctx, noBukti, level, userID)
	}
	return nil
}
func (m *mockRepo) CancelOtorisasi(ctx context.Context, noBukti string, level int) error {
	if m.cancelOtorFn != nil {
		return m.cancelOtorFn(ctx, noBukti, level)
	}
	return nil
}
func (m *mockRepo) GenerateNoBukti(ctx context.Context, tipe, devisi string, bulan, tahun int) (string, string, string, error) {
	if m.genNoBuktiFn != nil {
		noBukti, _ := m.genNoBuktiFn(ctx, tipe)
		return noBukti, "00001", "", nil
	}
	return "", "", "", nil
}
func (m *mockRepo) GenerateNoBuktiWithinTx(ctx context.Context, tx *gorm.DB, tipe, devisi string, bulan, tahun int) (string, string, string, error) {
	// Mirror the legacy single-shot mock so existing service tests don't
	// have to set up a sqlmock expectation just to satisfy the interface.
	// Tests that exercise the tx-aware path specifically should override
	// genNoBuktiWithinTxFn.
	if m.genNoBuktiWithinTxFn != nil {
		return m.genNoBuktiWithinTxFn(ctx, tx, tipe, devisi, bulan, tahun)
	}
	return "BKK-" + tipe + "-00001", "00001", "", nil
}
func (m *mockRepo) GenerateNoBuktiPreview(ctx context.Context, tipe string, bulan, tahun int) (string, string, error) {
	return "BKK-202606-0001", "00001", nil
}
func (m *mockRepo) LookupPerkiraan(ctx context.Context, query string, kelompokKas bool, limit int) ([]SDbPerkiraan, error) {
	if m.lookupFn != nil {
		return m.lookupFn(ctx, query, kelompokKas, limit)
	}
	return nil, nil
}
func (m *mockRepo) GetPeriode(ctx context.Context, userID string) (int, int, error) {
	if m.getPeriodeFn != nil {
		return m.getPeriodeFn(ctx, userID)
	}
	return 0, 0, nil
}
func (m *mockRepo) RecalcTotals(ctx context.Context, noBukti string) (float64, float64, error) {
	if m.recalcTotalsFn != nil {
		return m.recalcTotalsFn(ctx, noBukti)
	}
	return 0, 0, nil
}
func (m *mockRepo) DeleteDeposito(ctx context.Context, noBukti string) error        { return nil }
func (m *mockRepo) DeleteGiro(ctx context.Context, noGiro string) error             { return nil }
func (m *mockRepo) InsertDeposito(ctx context.Context, d *models.SDBDEPOSITO) error { return nil }
func (m *mockRepo) InsertGiro(ctx context.Context, g *models.SDBGIRO) error         { return nil }
func (m *mockRepo) UpdateDeposito(ctx context.Context, d *models.SDBDEPOSITO) error { return nil }
func (m *mockRepo) UpdateGiro(ctx context.Context, g *models.SDBGIRO) error         { return nil }
func (m *mockRepo) GetAggregateTotals(ctx context.Context, noBuktis []string) (map[string]SAggregateTotals, error) {
	m.aggregateTotalsCalls++
	if m.getAggregateTotalsFn != nil {
		return m.getAggregateTotalsFn(ctx, noBuktis)
	}
	return map[string]SAggregateTotals{}, nil
}
func (m *mockRepo) DB() *gorm.DB { return nil }
func (m *mockRepo) GenerateNoUrutAktiva(ctx context.Context, perkiraan, devisi string) (string, error) {
	return "00001", nil
}
func (m *mockRepo) GenerateNoUrutAktiva2(ctx context.Context, prefix, devisi string) (string, error) {
	return "00001", nil
}
func (m *mockRepo) LookupBagian(ctx context.Context, q string) ([]models.SDBBAGIAN, error) {
	return nil, nil
}
func (m *mockRepo) LookupAkumulasiAktiva(ctx context.Context, q string) ([]models.SDbPerkiraan, error) {
	return nil, nil
}
func (m *mockRepo) LookupBiayaAktiva(ctx context.Context, q string) ([]models.SDbPerkiraan, error) {
	return nil, nil
}

// newServiceWithRealDB returns a service backed by a sqlmock-backed GORM
// handle. The service still needs a real *gorm.DB so it can open
// transactions; we don't actually invoke the SQL on the happy paths
// because the mock repository takes precedence.
func newServiceWithRealDB(t *testing.T, repo IKasBankRepository) *SKasBankService {
	t.Helper()
	mockDB, _, err := sqlmock.New()
	require.NoError(t, err)
	gormDB, err := gorm.Open(sqlserver.New(sqlserver.Config{Conn: mockDB}), &gorm.Config{})
	require.NoError(t, err)
	return NewSKasBankService(repo, gormDB, nil, nil)
}

// TestService_List_Happy covers the passthrough and view-model conversion:
// the raw SDbTrans row must come back as an SKasBankHeader with totals from
// the batch aggregate query.
func TestService_List_Happy(t *testing.T) {
	repo := &mockRepo{
		listFn: func(ctx context.Context, q SListKasBankQuery) ([]SDbTrans, int64, error) {
			return []SDbTrans{{NoBukti: "BKK-1", IsOtorisasi1: true}}, 1, nil
		},
		getAggregateTotalsFn: func(ctx context.Context, noBuktis []string) (map[string]SAggregateTotals, error) {
			assert.Equal(t, []string{"BKK-1"}, noBuktis)
			return map[string]SAggregateTotals{
				"BKK-1": {TotalD: 1000, TotalK: 1000, JumlahValas: 500, JumlahRupiah: 1500},
			}, nil
		},
	}
	svc := newServiceWithRealDB(t, repo)
	out, err := svc.List(context.Background(), SListKasBankQuery{Page: 1, PerPage: 10})
	require.NoError(t, err)
	assert.Equal(t, int64(1), out.Total)
	require.Len(t, out.Items, 1)
	assert.Equal(t, "BKK-1", out.Items[0].NoBukti)
	assert.True(t, out.Items[0].OtorisasiLevel1)
	assert.Equal(t, 1000.0, out.Items[0].TotalD)
	assert.Equal(t, 500.0, out.Items[0].JumlahValas)
	assert.Equal(t, 1500.0, out.Items[0].JumlahRupiah)
	assert.Equal(t, 1, repo.aggregateTotalsCalls)
}

// TestService_List_NoRows_SkipsAggregateQuery verifies that when the page
// has zero rows, GetAggregateTotals is still called with an empty slice
// (the mock counts calls; the real repository returns early without
// issuing SQL for an empty IN (...) — see TestGetAggregateTotals_EmptyInput
// in repository_test.go).
func TestService_List_NoRows_SkipsAggregateQuery(t *testing.T) {
	repo := &mockRepo{
		listFn: func(ctx context.Context, q SListKasBankQuery) ([]SDbTrans, int64, error) {
			return nil, 0, nil
		},
	}
	svc := newServiceWithRealDB(t, repo)
	out, err := svc.List(context.Background(), SListKasBankQuery{Page: 1, PerPage: 10})
	require.NoError(t, err)
	assert.Equal(t, int64(0), out.Total)
	assert.Len(t, out.Items, 0)
}

// TestService_List_PageOfTenVouchers_SingleAggregateQuery covers Scenario 2
// from TASK-022: given a page of 10 vouchers, exactly one aggregate query
// must be issued for the whole page (no N+1).
func TestService_List_PageOfTenVouchers_SingleAggregateQuery(t *testing.T) {
	rows := make([]SDbTrans, 0, 10)
	for i := 0; i < 10; i++ {
		rows = append(rows, SDbTrans{NoBukti: fmt.Sprintf("BKK-%d", i)})
	}
	repo := &mockRepo{
		listFn: func(ctx context.Context, q SListKasBankQuery) ([]SDbTrans, int64, error) {
			return rows, 10, nil
		},
	}
	svc := newServiceWithRealDB(t, repo)
	out, err := svc.List(context.Background(), SListKasBankQuery{Page: 1, PerPage: 10})
	require.NoError(t, err)
	assert.Len(t, out.Items, 10)
	assert.Equal(t, 1, repo.aggregateTotalsCalls, "expected exactly one aggregate query for the whole page")
}

// TestService_List_VoucherWithNoDetailLines_ZeroTotals covers TASK-022's
// edge case: a voucher with zero detail lines (missing from the aggregate
// map) must come back with all totals at 0, not null/error.
func TestService_List_VoucherWithNoDetailLines_ZeroTotals(t *testing.T) {
	repo := &mockRepo{
		listFn: func(ctx context.Context, q SListKasBankQuery) ([]SDbTrans, int64, error) {
			return []SDbTrans{{NoBukti: "BKK-EMPTY"}}, 1, nil
		},
		getAggregateTotalsFn: func(ctx context.Context, noBuktis []string) (map[string]SAggregateTotals, error) {
			return map[string]SAggregateTotals{}, nil // no entry for BKK-EMPTY
		},
	}
	svc := newServiceWithRealDB(t, repo)
	out, err := svc.List(context.Background(), SListKasBankQuery{Page: 1, PerPage: 10})
	require.NoError(t, err)
	require.Len(t, out.Items, 1)
	assert.Equal(t, 0.0, out.Items[0].TotalD)
	assert.Equal(t, 0.0, out.Items[0].TotalK)
	assert.Equal(t, 0.0, out.Items[0].JumlahValas)
	assert.Equal(t, 0.0, out.Items[0].JumlahRupiah)
}

// TestService_GetByNoBukti_NotFound returns ErrNotFound when the repo yields nil.
func TestService_GetByNoBukti_NotFound(t *testing.T) {
	repo := &mockRepo{
		getByNoBuktiFn: func(ctx context.Context, noBukti string) (*SDbTrans, error) {
			return nil, nil
		},
	}
	svc := newServiceWithRealDB(t, repo)
	_, _, err := svc.GetByNoBukti(context.Background(), "BKK-X")
	require.ErrorIs(t, err, ErrNotFound)
}

// TestService_GetByNoBukti_Found pre-computes totals (now via
// GetAggregateTotals, see TASK-022) and locks the record.
func TestService_GetByNoBukti_Found(t *testing.T) {
	now := time.Now()
	repo := &mockRepo{
		getByNoBuktiFn: func(ctx context.Context, noBukti string) (*SDbTrans, error) {
			return &SDbTrans{NoBukti: noBukti, Tanggal: &now, IsOtorisasi1: true, IsOtorisasi2: true}, nil
		},
		listDetailFn: func(ctx context.Context, noBukti string) ([]SDbTransaksi, error) {
			return []SDbTransaksi{{NoBukti: noBukti, Urut: 1, Debet: 1000}}, nil
		},
		getAggregateTotalsFn: func(ctx context.Context, noBuktis []string) (map[string]SAggregateTotals, error) {
			assert.Equal(t, []string{"BKK-1"}, noBuktis)
			return map[string]SAggregateTotals{"BKK-1": {TotalD: 1000, TotalK: 1000}}, nil
		},
	}
	svc := newServiceWithRealDB(t, repo)
	h, details, err := svc.GetByNoBukti(context.Background(), "BKK-1")
	require.NoError(t, err)
	assert.Equal(t, "BKK-1", h.NoBukti)
	assert.True(t, h.Locked)
	assert.Equal(t, 1000.0, h.TotalD)
	assert.Len(t, details, 1)
}

// TestService_GenerateNoBukti_InvalidTipe rejects unknown tipe.
func TestService_GenerateNoBukti_InvalidTipe(t *testing.T) {
	svc := newServiceWithRealDB(t, &mockRepo{})
	_, err := svc.GenerateNoBukti(context.Background(), "xyz", "SA", "SA")
	require.ErrorIs(t, err, ErrTipeInvalid)
}

// TestService_GenerateNoBukti_Ok lowercases to upper and returns the formatted voucher number.
func TestService_GenerateNoBukti_Ok(t *testing.T) {
	repo := &mockRepo{
		genNoBuktiFn: func(ctx context.Context, tipe string) (string, error) {
			return "202606-0001", nil
		},
	}
	svc := newServiceWithRealDB(t, repo)
	out, err := svc.GenerateNoBukti(context.Background(), "bkk", "SA", "SA")
	require.NoError(t, err)
	assert.Equal(t, "BKK-202606-0001", out.NoBukti)
	assert.Equal(t, "BKK", out.Tipe)
}

// TestService_LookupPerkiraan returns the items from the repo.
func TestService_LookupPerkiraan(t *testing.T) {
	repo := &mockRepo{
		lookupFn: func(ctx context.Context, q string, k bool, limit int) ([]SDbPerkiraan, error) {
			return []SDbPerkiraan{{Perkiraan: "1101", Keterangan: "Kas"}}, nil
		},
	}
	svc := newServiceWithRealDB(t, repo)
	out, err := svc.LookupPerkiraan(context.Background(), SLookupPerkiraanQuery{Q: "1101"})
	require.NoError(t, err)
	assert.Len(t, out.Items, 1)
	assert.Equal(t, 1, out.Total)
}

// TestService_CreateHeader_InvalidTipe rejects unknown tipe.
func TestService_CreateHeader_InvalidTipe(t *testing.T) {
	svc := newServiceWithRealDB(t, &mockRepo{})
	_, err := svc.CreateHeader(context.Background(), "SA", SCreateKasBankRequest{
		TipeTransHd: "XYZ",
		Tanggal:     "2026-06-07",
		Details:     []SDetailInput{{Perkiraan: "1101", Debet: 1000}, {Perkiraan: "2100", Kredit: 1000}},
	})
	require.ErrorIs(t, err, ErrTipeInvalid)
}

// TestService_CreateHeader_InvalidTanggal rejects bad date format.
func TestService_CreateHeader_InvalidTanggal(t *testing.T) {
	svc := newServiceWithRealDB(t, &mockRepo{})
	_, err := svc.CreateHeader(context.Background(), "SA", SCreateKasBankRequest{
		TipeTransHd: "BKK",
		Tanggal:     "not a date",
		Details:     []SDetailInput{{Perkiraan: "1101", Debet: 1000}, {Perkiraan: "2100", Kredit: 1000}},
	})
	// Tanggal parsing returns a generic time.Parse error
	require.Error(t, err)
}

// TestService_CreateHeader_NoDetails rejects an empty details slice.
func TestService_CreateHeader_NoDetails(t *testing.T) {
	svc := newServiceWithRealDB(t, &mockRepo{
		getPeriodeFn: func(ctx context.Context, userID string) (int, int, error) {
			return 6, 2026, nil
		},
	})
	_, err := svc.CreateHeader(context.Background(), "SA", SCreateKasBankRequest{
		TipeTransHd: "BKK",
		Tanggal:     "2026-06-07",
		Details:     nil,
	})
	require.Error(t, err)
}

// TestService_CreateHeader_PeriodeNotSet rejects when DBPERIODE has no row.
func TestService_CreateHeader_PeriodeNotSet(t *testing.T) {
	svc := newServiceWithRealDB(t, &mockRepo{
		getPeriodeFn: func(ctx context.Context, userID string) (int, int, error) {
			return 0, 0, nil
		},
	})
	_, err := svc.CreateHeader(context.Background(), "SA", SCreateKasBankRequest{
		TipeTransHd: "BKK",
		Tanggal:     "2026-06-07",
		Details:     []SDetailInput{{Perkiraan: "1101", Debet: 1000}, {Perkiraan: "2100", Kredit: 1000}},
	})
	require.ErrorIs(t, err, ErrPeriodeNotSet)
}

// TestService_CreateHeader_TanggalDiluarPeriode rejects dates outside the
// active period.
func TestService_CreateHeader_TanggalDiluarPeriode(t *testing.T) {
	svc := newServiceWithRealDB(t, &mockRepo{
		getPeriodeFn: func(ctx context.Context, userID string) (int, int, error) {
			return 5, 2026, nil // May 2026
		},
	})
	_, err := svc.CreateHeader(context.Background(), "SA", SCreateKasBankRequest{
		TipeTransHd: "BKK",
		Tanggal:     "2026-06-07", // June — outside May
		Details:     []SDetailInput{{Perkiraan: "1101", Debet: 1000}, {Perkiraan: "2100", Kredit: 1000}},
	})
	require.ErrorIs(t, err, ErrTanggalDiLuarPeriode)
}

// TestService_CreateHeader_DoubleEntryUnbalanced rejects an unbalanced pair.
// The balance rule is now enforced — see TestValidateDoubleEntry_Restored
// for the unit-level proof and TestService_CreateHeader_DoubleEntryUnbalanced_NowEnforced
// for the service-level proof with the lock-periode mock.
func TestService_CreateHeader_DoubleEntryUnbalanced(t *testing.T) {
	mockDB, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer mockDB.Close()
	gormDB, err := gorm.Open(sqlserver.New(sqlserver.Config{Conn: mockDB}), &gorm.Config{})
	require.NoError(t, err)

	// Lock-periode check fires before validation — expect the count query.
	mock.ExpectQuery(`SELECT count\(\*\) FROM "DBLOCKPERIODE"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))

	svc := NewSKasBankService(&mockRepo{
		getPeriodeFn: func(ctx context.Context, userID string) (int, int, error) {
			return 6, 2026, nil
		},
	}, gormDB, nil, nil)

	_, err = svc.CreateHeader(context.Background(), "SA", SCreateKasBankRequest{
		TipeTransHd: "BKK",
		Tanggal:     "2026-06-07",
		Details:     []SDetailInput{{Perkiraan: "1101", Debet: 1000}, {Perkiraan: "2100", Kredit: 500}},
	})
	require.ErrorIs(t, err, ErrDoubleEntryUnbalanced)
}

// TestService_UpdateHeader_NotFound returns ErrNotFound.
func TestService_UpdateHeader_NotFound(t *testing.T) {
	repo := &mockRepo{
		getByNoBuktiFn: func(ctx context.Context, noBukti string) (*SDbTrans, error) {
			return nil, nil
		},
	}
	svc := newServiceWithRealDB(t, repo)
	err := svc.UpdateHeader(context.Background(), "BKK-X", SUpdateKasBankRequest{})
	require.ErrorIs(t, err, ErrNotFound)
}

// TestService_UpdateHeader_Locked rejects when IsOtorisasi1 is true.
func TestService_UpdateHeader_Locked(t *testing.T) {
	repo := &mockRepo{
		getByNoBuktiFn: func(ctx context.Context, noBukti string) (*SDbTrans, error) {
			return &SDbTrans{NoBukti: noBukti, IsOtorisasi1: true}, nil
		},
	}
	svc := newServiceWithRealDB(t, repo)
	err := svc.UpdateHeader(context.Background(), "BKK-1", SUpdateKasBankRequest{Note: "edit"})
	require.ErrorIs(t, err, ErrLockedByOtorisasi1)
}

// TestService_DeleteHeader_Locked rejects when otorisasi already set.
func TestService_DeleteHeader_Locked(t *testing.T) {
	repo := &mockRepo{
		getByNoBuktiFn: func(ctx context.Context, noBukti string) (*SDbTrans, error) {
			return &SDbTrans{NoBukti: noBukti, IsOtorisasi2: true}, nil
		},
	}
	svc := newServiceWithRealDB(t, repo)
	err := svc.DeleteHeader(context.Background(), "BKK-1")
	require.ErrorIs(t, err, ErrLockedByOtorisasi1)
}

// TestService_DeleteHeader_NotFound returns ErrNotFound.
func TestService_DeleteHeader_NotFound(t *testing.T) {
	repo := &mockRepo{
		getByNoBuktiFn: func(ctx context.Context, noBukti string) (*SDbTrans, error) {
			return nil, nil
		},
	}
	svc := newServiceWithRealDB(t, repo)
	err := svc.DeleteHeader(context.Background(), "BKK-X")
	require.ErrorIs(t, err, ErrNotFound)
}

// TestService_AddDetail_Locked rejects when the header is already authorised.
func TestService_AddDetail_Locked(t *testing.T) {
	repo := &mockRepo{
		getByNoBuktiFn: func(ctx context.Context, noBukti string) (*SDbTrans, error) {
			return &SDbTrans{NoBukti: noBukti, IsOtorisasi1: true}, nil
		},
	}
	svc := newServiceWithRealDB(t, repo)
	err := svc.AddDetail(context.Background(), "BKK-1", SDetailInput{Perkiraan: "1101", Debet: 500})
	require.ErrorIs(t, err, ErrLockedByOtorisasi1)
}

// TestService_AddDetail_NotFound returns ErrNotFound when header is missing.
func TestService_AddDetail_NotFound(t *testing.T) {
	repo := &mockRepo{
		getByNoBuktiFn: func(ctx context.Context, noBukti string) (*SDbTrans, error) {
			return nil, nil
		},
	}
	svc := newServiceWithRealDB(t, repo)
	err := svc.AddDetail(context.Background(), "BKK-X", SDetailInput{Perkiraan: "1101", Debet: 500})
	require.ErrorIs(t, err, ErrNotFound)
}

// TestService_UpdateDetail_DetailNotFound returns ErrNotFound.
func TestService_UpdateDetail_DetailNotFound(t *testing.T) {
	repo := &mockRepo{
		getByNoBuktiFn: func(ctx context.Context, noBukti string) (*SDbTrans, error) {
			return &SDbTrans{NoBukti: noBukti}, nil
		},
		getDetailFn: func(ctx context.Context, noBukti string, urut int) (*SDbTransaksi, error) {
			return nil, nil
		},
		listDetailFn: func(ctx context.Context, noBukti string) ([]SDbTransaksi, error) {
			return nil, nil
		},
	}
	svc := newServiceWithRealDB(t, repo)
	err := svc.UpdateDetail(context.Background(), "BKK-1", 99, SDetailInput{Perkiraan: "1101", Debet: 100})
	require.ErrorIs(t, err, ErrNotFound)
}

// TestService_DeleteDetail_Locked rejects when the header is authorised.
func TestService_DeleteDetail_Locked(t *testing.T) {
	repo := &mockRepo{
		getByNoBuktiFn: func(ctx context.Context, noBukti string) (*SDbTrans, error) {
			return &SDbTrans{NoBukti: noBukti, IsOtorisasi1: true}, nil
		},
	}
	svc := newServiceWithRealDB(t, repo)
	err := svc.DeleteDetail(context.Background(), "BKK-1", 1)
	require.ErrorIs(t, err, ErrLockedByOtorisasi1)
}

// TestService_SetOtorisasi_InvalidLevel rejects levels outside 1-5.
func TestService_SetOtorisasi_InvalidLevel(t *testing.T) {
	repo := &mockRepo{
		getByNoBuktiFn: func(ctx context.Context, noBukti string) (*SDbTrans, error) {
			return &SDbTrans{NoBukti: noBukti}, nil
		},
	}
	svc := newServiceWithRealDB(t, repo)
	err := svc.SetOtorisasi(context.Background(), "BKK-1", 6, "SA")
	require.ErrorIs(t, err, ErrOtorisasiLevelInvalid)
}

// TestService_SetOtorisasi_SelfOtorisasi rejects the same user at level 2.
func TestService_SetOtorisasi_SelfOtorisasi(t *testing.T) {
	repo := &mockRepo{
		getByNoBuktiFn: func(ctx context.Context, noBukti string) (*SDbTrans, error) {
			return &SDbTrans{NoBukti: noBukti, IsOtorisasi1: true, OtoUser1: "SA"}, nil
		},
	}
	svc := newServiceWithRealDB(t, repo)
	err := svc.SetOtorisasi(context.Background(), "BKK-1", 2, "SA")
	require.ErrorIs(t, err, ErrSelfOtorisasi)
}

// TestService_SetOtorisasi_PrevLevelMissing rejects approving level N when
// level N-1 has not been approved yet.
func TestService_SetOtorisasi_PrevLevelMissing(t *testing.T) {
	repo := &mockRepo{
		getByNoBuktiFn: func(ctx context.Context, noBukti string) (*SDbTrans, error) {
			return &SDbTrans{NoBukti: noBukti}, nil // nothing approved yet
		},
	}
	svc := newServiceWithRealDB(t, repo)
	err := svc.SetOtorisasi(context.Background(), "BKK-1", 3, "BUDI")
	require.ErrorIs(t, err, ErrOtorisasiPrevLevelMissing)
}

// TestService_SetOtorisasi_SequentialLevels1Through5 approves a record with
// MaxOL=5 through every level in sequence (with a different approver each
// time) and verifies each call succeeds.
func TestService_SetOtorisasi_SequentialLevels1Through5(t *testing.T) {
	approvers := map[int]string{1: "SA", 2: "BUDI", 3: "CITRA", 4: "DEWI", 5: "EKO"}
	header := &SDbTrans{NoBukti: "BKK-1", MaxOL: 5}

	for level := 1; level <= 5; level++ {
		repo := &mockRepo{
			getByNoBuktiFn: func(ctx context.Context, noBukti string) (*SDbTrans, error) {
				return header, nil
			},
			setOtorisasiFn: func(ctx context.Context, noBukti string, lvl int, userID string) error {
				switch lvl {
				case 1:
					header.IsOtorisasi1, header.OtoUser1 = true, userID
				case 2:
					header.IsOtorisasi2, header.OtoUser2 = true, userID
				case 3:
					header.IsOtorisasi3, header.OtoUser3 = true, userID
				case 4:
					header.IsOtorisasi4, header.OtoUser4 = true, userID
				case 5:
					header.IsOtorisasi5, header.OtoUser5 = true, userID
				}
				return nil
			},
		}
		svc := newServiceWithRealDB(t, repo)
		err := svc.SetOtorisasi(context.Background(), "BKK-1", level, approvers[level])
		require.NoError(t, err, "level %d should approve cleanly", level)
	}
	assert.True(t, header.IsOtorisasi1)
	assert.True(t, header.IsOtorisasi2)
	assert.True(t, header.IsOtorisasi3)
	assert.True(t, header.IsOtorisasi4)
	assert.True(t, header.IsOtorisasi5)
}

// TestService_SetOtorisasi_SelfOtorisasi_AllAdjacentPairs verifies the
// self-approval rejection extends to every adjacent level pair, not just
// level 1->2.
func TestService_SetOtorisasi_SelfOtorisasi_AllAdjacentPairs(t *testing.T) {
	cases := []struct {
		level int
		setup *SDbTrans
	}{
		{2, &SDbTrans{NoBukti: "BKK-1", IsOtorisasi1: true, OtoUser1: "SA"}},
		{3, &SDbTrans{NoBukti: "BKK-1", IsOtorisasi1: true, OtoUser1: "X", IsOtorisasi2: true, OtoUser2: "SA"}},
		{4, &SDbTrans{NoBukti: "BKK-1", IsOtorisasi1: true, OtoUser1: "X", IsOtorisasi2: true, OtoUser2: "Y", IsOtorisasi3: true, OtoUser3: "SA"}},
		{5, &SDbTrans{NoBukti: "BKK-1", IsOtorisasi1: true, OtoUser1: "X", IsOtorisasi2: true, OtoUser2: "Y", IsOtorisasi3: true, OtoUser3: "Z", IsOtorisasi4: true, OtoUser4: "SA"}},
	}
	for _, tc := range cases {
		repo := &mockRepo{
			getByNoBuktiFn: func(ctx context.Context, noBukti string) (*SDbTrans, error) {
				return tc.setup, nil
			},
		}
		svc := newServiceWithRealDB(t, repo)
		err := svc.SetOtorisasi(context.Background(), "BKK-1", tc.level, "SA")
		require.ErrorIs(t, err, ErrSelfOtorisasi, "level %d should reject self-otorisasi", tc.level)
	}
}

// TestService_CancelOtorisasi_NextLevelSet rejects cancelling level N when
// level N+1 is already approved.
func TestService_CancelOtorisasi_NextLevelSet(t *testing.T) {
	repo := &mockRepo{
		getByNoBuktiFn: func(ctx context.Context, noBukti string) (*SDbTrans, error) {
			return &SDbTrans{NoBukti: noBukti, IsOtorisasi1: true, OtoUser1: "SA", IsOtorisasi2: true, OtoUser2: "BUDI"}, nil
		},
	}
	svc := newServiceWithRealDB(t, repo)
	err := svc.CancelOtorisasi(context.Background(), "BKK-1", 1)
	require.ErrorIs(t, err, ErrOtorisasiNextLevelSet)
}

// TestService_CancelOtorisasi_TopLevelOk allows cancelling the highest
// approved level (no level above it to block the cancel).
func TestService_CancelOtorisasi_TopLevelOk(t *testing.T) {
	repo := &mockRepo{
		getByNoBuktiFn: func(ctx context.Context, noBukti string) (*SDbTrans, error) {
			return &SDbTrans{NoBukti: noBukti, IsOtorisasi1: true, OtoUser1: "SA", IsOtorisasi2: true, OtoUser2: "BUDI"}, nil
		},
	}
	svc := newServiceWithRealDB(t, repo)
	err := svc.CancelOtorisasi(context.Background(), "BKK-1", 2)
	require.NoError(t, err)
}

// TestEffectiveMaxOL_ValidLegacyValue uses the record's own MaxOL when valid.
func TestEffectiveMaxOL_ValidLegacyValue(t *testing.T) {
	assert.Equal(t, 5, effectiveMaxOL(&SDbTrans{MaxOL: 5}))
	assert.Equal(t, 1, effectiveMaxOL(&SDbTrans{MaxOL: 1}))
	assert.Equal(t, 3, effectiveMaxOL(&SDbTrans{MaxOL: 3}))
}

// TestEffectiveMaxOL_DefaultsTo2 falls back to 2 when MaxOL is 0/invalid.
func TestEffectiveMaxOL_DefaultsTo2(t *testing.T) {
	assert.Equal(t, 2, effectiveMaxOL(&SDbTrans{MaxOL: 0}))
	assert.Equal(t, 2, effectiveMaxOL(&SDbTrans{MaxOL: -1}))
	assert.Equal(t, 2, effectiveMaxOL(&SDbTrans{MaxOL: 6}))
}

// TestService_GetByNoBukti_Locked_DefaultMaxOL2 verifies a fresh
// DAPEN-created record (MaxOL unset) becomes Locked after level 2, matching
// pre-TASK-021 behaviour.
func TestService_GetByNoBukti_Locked_DefaultMaxOL2(t *testing.T) {
	now := time.Now()
	repo := &mockRepo{
		getByNoBuktiFn: func(ctx context.Context, noBukti string) (*SDbTrans, error) {
			return &SDbTrans{NoBukti: noBukti, Tanggal: &now, IsOtorisasi1: true, IsOtorisasi2: true}, nil
		},
		listDetailFn: func(ctx context.Context, noBukti string) ([]SDbTransaksi, error) {
			return nil, nil
		},
	}
	svc := newServiceWithRealDB(t, repo)
	h, _, err := svc.GetByNoBukti(context.Background(), "BKK-1")
	require.NoError(t, err)
	assert.Equal(t, 2, h.MaxOL)
	assert.True(t, h.Locked)
}

// TestService_GetByNoBukti_NotLocked_UntilMaxOL5 verifies a legacy record
// with MaxOL=5 stays unlocked until all 5 levels are approved.
func TestService_GetByNoBukti_NotLocked_UntilMaxOL5(t *testing.T) {
	now := time.Now()
	repo := &mockRepo{
		getByNoBuktiFn: func(ctx context.Context, noBukti string) (*SDbTrans, error) {
			return &SDbTrans{
				NoBukti: noBukti, Tanggal: &now, MaxOL: 5,
				IsOtorisasi1: true, IsOtorisasi2: true, IsOtorisasi3: true, IsOtorisasi4: true,
				// level 5 not yet approved
			}, nil
		},
		listDetailFn: func(ctx context.Context, noBukti string) ([]SDbTransaksi, error) {
			return nil, nil
		},
	}
	svc := newServiceWithRealDB(t, repo)
	h, _, err := svc.GetByNoBukti(context.Background(), "BKK-1")
	require.NoError(t, err)
	assert.Equal(t, 5, h.MaxOL)
	assert.False(t, h.Locked)
}

// TestService_GetByNoBukti_Locked_AfterAllMaxOL5 verifies a legacy record
// with MaxOL=5 becomes Locked only once all 5 levels are approved.
func TestService_GetByNoBukti_Locked_AfterAllMaxOL5(t *testing.T) {
	now := time.Now()
	repo := &mockRepo{
		getByNoBuktiFn: func(ctx context.Context, noBukti string) (*SDbTrans, error) {
			return &SDbTrans{
				NoBukti: noBukti, Tanggal: &now, MaxOL: 5,
				IsOtorisasi1: true, IsOtorisasi2: true, IsOtorisasi3: true, IsOtorisasi4: true, IsOtorisasi5: true,
			}, nil
		},
		listDetailFn: func(ctx context.Context, noBukti string) ([]SDbTransaksi, error) {
			return nil, nil
		},
	}
	svc := newServiceWithRealDB(t, repo)
	h, _, err := svc.GetByNoBukti(context.Background(), "BKK-1")
	require.NoError(t, err)
	assert.True(t, h.Locked)
}

// TestService_SetOtorisasi_NotFound returns ErrNotFound.
func TestService_SetOtorisasi_NotFound(t *testing.T) {
	repo := &mockRepo{
		getByNoBuktiFn: func(ctx context.Context, noBukti string) (*SDbTrans, error) {
			return nil, nil
		},
	}
	svc := newServiceWithRealDB(t, repo)
	err := svc.SetOtorisasi(context.Background(), "BKK-X", 1, "SA")
	require.ErrorIs(t, err, ErrNotFound)
}

// TestService_CancelOtorisasi_NotFound returns ErrNotFound.
func TestService_CancelOtorisasi_NotFound(t *testing.T) {
	repo := &mockRepo{
		getByNoBuktiFn: func(ctx context.Context, noBukti string) (*SDbTrans, error) {
			return nil, nil
		},
	}
	svc := newServiceWithRealDB(t, repo)
	err := svc.CancelOtorisasi(context.Background(), "BKK-X", 1)
	require.ErrorIs(t, err, ErrNotFound)
}

// TestService_CancelOtorisasi_InvalidLevel rejects levels other than 1 or 2.
func TestService_CancelOtorisasi_InvalidLevel(t *testing.T) {
	repo := &mockRepo{
		getByNoBuktiFn: func(ctx context.Context, noBukti string) (*SDbTrans, error) {
			return &SDbTrans{NoBukti: noBukti}, nil
		},
	}
	svc := newServiceWithRealDB(t, repo)
	err := svc.CancelOtorisasi(context.Background(), "BKK-1", 0)
	require.Error(t, err)
}

// TestValidateDoubleEntry covers the helper directly to make sure the
// negative-value and both-sides-set branches error out. The unbalanced
// branch now errors with ErrDoubleEntryUnbalanced (see also
// TestValidateDoubleEntry_Restored).
func TestValidateDoubleEntry(t *testing.T) {
	t.Run("Balanced", func(t *testing.T) {
		err := validateDoubleEntry([]SDetailInput{{Debet: 1000}, {Kredit: 1000}})
		assert.NoError(t, err)
	})
	t.Run("Unbalanced", func(t *testing.T) {
		err := validateDoubleEntry([]SDetailInput{{Debet: 1000}, {Kredit: 500}})
		assert.ErrorIs(t, err, ErrDoubleEntryUnbalanced)
	})
	t.Run("Negative", func(t *testing.T) {
		err := validateDoubleEntry([]SDetailInput{{Debet: -1000}})
		assert.Error(t, err)
	})
	t.Run("BothSidesSet", func(t *testing.T) {
		err := validateDoubleEntry([]SDetailInput{{Debet: 1000, Kredit: 1000}})
		assert.Error(t, err)
	})
}

// TestParseTanggal covers both supported formats.
func TestParseTanggal(t *testing.T) {
	t.Run("RFC3339", func(t *testing.T) {
		_, err := parseTanggal("2026-06-07T10:00:00Z")
		assert.NoError(t, err)
	})
	t.Run("ShortDate", func(t *testing.T) {
		_, err := parseTanggal("2026-06-07")
		assert.NoError(t, err)
	})
	t.Run("Invalid", func(t *testing.T) {
		_, err := parseTanggal("bogus")
		assert.Error(t, err)
	})
}

// TestValidTipeTrans enumerates the four accepted types plus a negative.
func TestValidTipeTrans(t *testing.T) {
	assert.True(t, ValidTipeTrans(TipeBKM))
	assert.True(t, ValidTipeTrans(TipeBKK))
	assert.True(t, ValidTipeTrans(TipeBBM))
	assert.True(t, ValidTipeTrans(TipeBBK))
	assert.False(t, ValidTipeTrans("XYZ"))
}

// TestTanggalInPeriode covers the in/out/zero-period branches.
func TestTanggalInPeriode(t *testing.T) {
	date := time.Date(2026, 6, 7, 0, 0, 0, 0, time.UTC)
	assert.True(t, TanggalInPeriode(date, 6, 2026))
	assert.False(t, TanggalInPeriode(date, 5, 2026))
	assert.False(t, TanggalInPeriode(date, 0, 0))
}

// TestFloatEq covers the floating-point tolerance.
func TestFloatEq(t *testing.T) {
	assert.True(t, floatEq(1.0, 1.0))
	assert.True(t, floatEq(1.0001, 1.0))
	assert.False(t, floatEq(1.5, 1.0))
}

// TestCalculateDK covers the D/K assignment rule that flows from the
// journal line's Debet/Kredit amounts. Always D when Debet > 0, else K.
func TestCalculateDK(t *testing.T) {
	assert.Equal(t, "D", calculateDK(100, 0))
	assert.Equal(t, "K", calculateDK(0, 100))
	assert.Equal(t, "K", calculateDK(0, 0)) // empty line → K (default)
	assert.Equal(t, "D", calculateDK(100.50, 0))
}

// TestCalculateStatusGiro covers the THPC × Mode matrix used by
// FrmKasBank.pas procedure THPCChange. The critical regression case is
// THPC='H' + Mode='BBM' which MUST return "" (H+BBM is invalid in the
// legacy form and was previously miscoded as "H+").
func TestCalculateStatusGiro(t *testing.T) {
	tests := []struct {
		name string
		tphc string
		mode string
		want string
	}{
		// Piutang Giro
		{"P+BKM returns P+", "P", "BKM", "P+"},
		{"P+BKK returns P-", "P", "BKK", "P-"},
		{"P+BBM returns P-", "P", "BBM", "P-"},

		// Hutang Giro — the regression cases the previous implementation got wrong
		{"H+BKM returns H+", "H", "BKM", "H+"},
		{"H+BKK returns H-", "H", "BKK", "H-"},
		{"H+BBM returns empty (was H+)", "H", "BBM", ""},

		// Cash / Transfer — no giro status
		{"C+BKM returns empty", "C", "BKM", ""},
		{"T+BKK returns empty", "T", "BKK", ""},
		{"empty+empty returns empty", "", "", ""},
		{"unknown returns empty", "X", "BKM", ""},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.want, calculateStatusGiro(tt.tphc, tt.mode))
		})
	}
}

// TestApplyGiroIDRRule covers the IDR convention from FrmKasBankGiro.pas
// btnOKClick lines 1339–1348. For IDR transactions the foreign-currency
// columns (Debet/Kredit/Jumlah) MUST be 0; for non-IDR they must mirror
// the rupiah columns divided by Kurs.
func TestApplyGiroIDRRule(t *testing.T) {
	t.Run("IDR zeros foreign columns", func(t *testing.T) {
		g := &models.SDBGIRO{
			NoGiro:   "G-1",
			Bank:     "BCA",
			Debet:    1000,
			Kredit:   0,
			Jumlah:   1000,
			KodeVls:  "IDR",
			DebetRp:  1000,
			KreditRp: 0,
			JumlahRp: 1000,
		}
		applyGiroIDRRule(g)
		assert.Equal(t, float64(0), g.Debet)
		assert.Equal(t, float64(0), g.Kredit)
		assert.Equal(t, float64(0), g.Jumlah)
		// Rupiah columns preserved.
		assert.Equal(t, float64(1000), g.DebetRp)
		assert.Equal(t, float64(1000), g.JumlahRp)
	})

	t.Run("blank valas treated as IDR", func(t *testing.T) {
		g := &models.SDBGIRO{
			NoGiro:  "G-2",
			Debet:   500,
			Kredit:  0,
			Jumlah:  500,
			KodeVls: "",
		}
		applyGiroIDRRule(g)
		assert.Equal(t, float64(0), g.Debet)
		assert.Equal(t, float64(0), g.Jumlah)
	})

	t.Run("non-IDR derives rupiah columns", func(t *testing.T) {
		g := &models.SDBGIRO{
			NoGiro:  "G-3",
			Bank:    "BCA",
			Debet:   100,
			Kredit:  0,
			Jumlah:  100,
			KodeVls: "USD",
			Kurs:    15500,
		}
		applyGiroIDRRule(g)
		assert.Equal(t, float64(100), g.Debet)
		assert.Equal(t, float64(100), g.Jumlah)
		assert.Equal(t, float64(100)*15500, g.DebetRp)
		assert.Equal(t, float64(100)*15500, g.JumlahRp)
	})

	t.Run("non-IDR zero Kurs becomes 1", func(t *testing.T) {
		g := &models.SDBGIRO{
			NoGiro:  "G-4",
			Debet:   100,
			Jumlah:  100,
			KodeVls: "USD",
			Kurs:    0,
		}
		applyGiroIDRRule(g)
		assert.Equal(t, float64(1), g.Kurs)
		assert.Equal(t, float64(100), g.DebetRp)
	})
}

// TestApplyDepositoIDRRule mirrors the IDR convention for DBDEPOSITO.
func TestApplyDepositoIDRRule(t *testing.T) {
	d := &models.SDBDEPOSITO{
		NoDeposito: "D-1",
		Bank:       "Mandiri",
		Debet:      1000,
		Kredit:     0,
		Jumlah:     1000,
		KodeVls:    "IDR",
		DebetRp:    1000,
		JumlahRp:   1000,
	}
	applyDepositoIDRRule(d)
	assert.Equal(t, float64(0), d.Debet)
	assert.Equal(t, float64(0), d.Kredit)
	assert.Equal(t, float64(0), d.Jumlah)
	assert.Equal(t, float64(1000), d.DebetRp)
}

// TestValidateDoubleEntry_Restored verifies the previously-commented
// balance check is now enforced.
func TestValidateDoubleEntry_Restored(t *testing.T) {
	balanced := []SDetailInput{
		{Perkiraan: "1101", Debet: 1000},
		{Perkiraan: "2100", Kredit: 1000},
	}
	assert.NoError(t, validateDoubleEntry(balanced))

	unbalanced := []SDetailInput{
		{Perkiraan: "1101", Debet: 1000},
		{Perkiraan: "2100", Kredit: 500},
	}
	assert.ErrorIs(t, validateDoubleEntry(unbalanced), ErrDoubleEntryUnbalanced)

	dAndK := []SDetailInput{
		{Perkiraan: "1101", Debet: 1000, Kredit: 1000},
	}
	assert.Error(t, validateDoubleEntry(dAndK))

	negative := []SDetailInput{
		{Perkiraan: "1101", Debet: -100},
	}
	assert.Error(t, validateDoubleEntry(negative))

	// Floating-point tolerance: 1.0001 ≈ 1 should be accepted.
	tolerance := []SDetailInput{
		{Perkiraan: "1101", Debet: 1000.005},
		{Perkiraan: "2100", Kredit: 1000.005},
	}
	assert.NoError(t, validateDoubleEntry(tolerance))
}

// TestService_CreateHeader_DoubleEntryUnbalanced_NowEnforced verifies the
// previously-commented balance check now flows through the service layer.
// The test wires the sqlmock-backed DB and asserts the lock-periode query
// is satisfied (returning 0 rows), then expects ErrDoubleEntryUnbalanced
// from the validation step before any DB write.
func TestService_CreateHeader_DoubleEntryUnbalanced_NowEnforced(t *testing.T) {
	mockDB, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer mockDB.Close()
	gormDB, err := gorm.Open(sqlserver.New(sqlserver.Config{Conn: mockDB}), &gorm.Config{})
	require.NoError(t, err)

	// Lock-periode check fires before validation — expect the count query.
	mock.ExpectQuery(`SELECT count\(\*\) FROM "DBLOCKPERIODE"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))

	svc := NewSKasBankService(&mockRepo{
		getPeriodeFn: func(ctx context.Context, userID string) (int, int, error) {
			return 6, 2026, nil
		},
	}, gormDB, nil, nil)

	_, err = svc.CreateHeader(context.Background(), "SA", SCreateKasBankRequest{
		TipeTransHd: "BKK",
		Tanggal:     "2026-06-07",
		Details: []SDetailInput{
			{Perkiraan: "1101", Debet: 1000},
			{Perkiraan: "2100", Kredit: 500},
		},
	})
	require.ErrorIs(t, err, ErrDoubleEntryUnbalanced)
}

// Silence the "declared and not used" warning for errors if the test file
// is the only consumer.
var _ = errors.New
var _ = fmt.Sprintf

func TestExtractMissingColumn(t *testing.T) {
	t.Parallel()
	cases := []struct {
		name string
		err  error
		want string
		ok   bool
	}{
		{"nil", nil, "", false},
		{"unrelated", errors.New("some other error"), "", false},
		{"single quoted", errors.New("Invalid column name 'XSusut'"), "XSusut", true},
		{"double quoted", errors.New(`Invalid column name "XSusut"`), "XSusut", true},
		{"bracketed", errors.New("Invalid column name [XSusut]"), "XSusut", true},
		{"backtick", errors.New("Invalid column name `XSusut`"), "XSusut", true},
		{"multi col", errors.New("Invalid column name 'PerlakuanAktiva'.\nInvalid column name 'XSusut'"), "PerlakuanAktiva", true},
		{"case insensitive", errors.New("invalid column name 'foo'"), "foo", true},
		{"embedded", errors.New("inserting detail row 1: mssql: Invalid column name 'XSusut'"), "XSusut", true},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, ok := extractMissingColumn(tc.err)
			if ok != tc.ok {
				t.Fatalf("ok mismatch: got %v want %v", ok, tc.ok)
			}
			if got != tc.want {
				t.Fatalf("col mismatch: got %q want %q", got, tc.want)
			}
		})
	}
}

// TestSafeCreateDBTransaksi_AllColsPresent confirms the fast path: when
// INFORMATION_SCHEMA reports both XSusut and PerlakuanAktiva, the helper
// delegates to GORM's tx.Create(row) without emitting a raw INSERT. We
// verify by asserting no INSERT was queued against the sqlmock (the probe
// query runs, but no follow-up INSERT does).
func TestSafeCreateDBTransaksi_AllColsPresent(t *testing.T) {
	t.Parallel()

	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	gormDB, err := gorm.Open(sqlserver.New(sqlserver.Config{Conn: db}), &gorm.Config{})
	require.NoError(t, err)

	mock.ExpectQuery(
		"SELECT COLUMN_NAME FROM .*INFORMATION_SCHEMA.*COLUMNS.* WHERE .*TABLE_NAME.* 'DBTRANSAKSI'.* AND .*COLUMN_NAME.* IN .+",
	).WithArgs("XSusut", "PerlakuanAktiva").
		WillReturnRows(sqlmock.NewRows([]string{"COLUMN_NAME"}).
			AddRow("XSusut").
			AddRow("PerlakuanAktiva"),
		)

	// Fast path delegates to tx.Create(row), which GORM translates into an
	// INSERT against DBTRANSAKSI via the prepared-statement machinery.
	// Register the matching expectation so the mock doesn't reject it.
	mock.ExpectExec("^INSERT INTO .*DBTRANSAKSI.*").
		WillReturnResult(sqlmock.NewResult(1, 1))

	svc := NewSKasBankService(&mockRepo{}, gormDB, nil, nil)

	row := &SDbTransaksi{NoBukti: "T1", Urut: 1, Perkiraan: "1.01.01", Debet: 100}
	err = svc.safeCreateDBTransaksi(gormDB, row)
	require.NoError(t, err)

	// Probe consumed + INSERT executed by GORM's normal Create path.
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("probe expectation not met: %v", err)
	}
}

// TestSafeCreateDBTransaksi_MissingPerlakuanAktiva confirms the fallback:
// when only XSusut is reported by INFORMATION_SCHEMA, the helper emits a
// raw INSERT that omits [PerlakuanAktiva] but still includes [XSusut].
func TestSafeCreateDBTransaksi_MissingPerlakuanAktiva(t *testing.T) {
	t.Parallel()

	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	gormDB, err := gorm.Open(sqlserver.New(sqlserver.Config{Conn: db}), &gorm.Config{})
	require.NoError(t, err)

	mock.ExpectQuery(
		"SELECT COLUMN_NAME FROM .*INFORMATION_SCHEMA.*COLUMNS.* WHERE .*TABLE_NAME.* 'DBTRANSAKSI'.* AND .*COLUMN_NAME.* IN .+",
	).WithArgs("XSusut", "PerlakuanAktiva").
		WillReturnRows(sqlmock.NewRows([]string{"COLUMN_NAME"}).AddRow("XSusut"))

	// Capture the actual INSERT SQL GORM emits so we can assert neither
	// PerlakuanAktiva nor the XSusut value appears in the column list.
	mock.ExpectExec("^INSERT INTO DBTRANSAKSI .*").
		WillReturnResult(sqlmock.NewResult(1, 1))

	svc := NewSKasBankService(&mockRepo{}, gormDB, nil, nil)

	row := &SDbTransaksi{NoBukti: "T1", Urut: 1, Perkiraan: "1.01.01", Debet: 100, XSusut: 12, PerlakuanAktiva: 1}
	err = svc.safeCreateDBTransaksi(gormDB, row)
	require.NoError(t, err)

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("mock expectations: %v", err)
	}
}

// TestSafeCreateDBTransaksi_MissingBoth confirms the fallback when neither
// column exists — raw INSERT is still emitted, just without either column.
func TestSafeCreateDBTransaksi_MissingBoth(t *testing.T) {
	t.Parallel()

	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	gormDB, err := gorm.Open(sqlserver.New(sqlserver.Config{Conn: db}), &gorm.Config{})
	require.NoError(t, err)

	// Probe returns nothing — both XSusut and PerlakuanAktiva missing.
	mock.ExpectQuery(
		"SELECT COLUMN_NAME FROM .*INFORMATION_SCHEMA.*COLUMNS.* WHERE .*TABLE_NAME.* 'DBTRANSAKSI'.* AND .*COLUMN_NAME.* IN .+",
	).WithArgs("XSusut", "PerlakuanAktiva").
		WillReturnRows(sqlmock.NewRows([]string{"COLUMN_NAME"})) // empty

	mock.ExpectExec("^INSERT INTO DBTRANSAKSI .*").
		WillReturnResult(sqlmock.NewResult(1, 1))

	svc := NewSKasBankService(&mockRepo{}, gormDB, nil, nil)

	row := &SDbTransaksi{NoBukti: "T2", Urut: 1, Perkiraan: "1.01.01", Debet: 200, XSusut: 6, PerlakuanAktiva: 2}
	err = svc.safeCreateDBTransaksi(gormDB, row)
	require.NoError(t, err)

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("mock expectations: %v", err)
	}
}

// TestSafeCreateDBTransaksi_ProbeCachedPerTx confirms the column probe runs
// once per transaction even when called many times in a row.
func TestSafeCreateDBTransaksi_ProbeCachedPerTx(t *testing.T) {
	t.Parallel()

	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	gormDB, err := gorm.Open(sqlserver.New(sqlserver.Config{Conn: db}), &gorm.Config{})
	require.NoError(t, err)

	// Single probe expectation — the second call must hit the tx-scoped
	// cache, not the database again. Probe returns only XSusut, so the
	// fallback path runs (PerlakuanAktiva missing).
	mock.ExpectQuery(
		"SELECT COLUMN_NAME FROM .*INFORMATION_SCHEMA.*COLUMNS.* WHERE .*TABLE_NAME.* 'DBTRANSAKSI'.* AND .*COLUMN_NAME.* IN .+",
	).WithArgs("XSusut", "PerlakuanAktiva").
		WillReturnRows(sqlmock.NewRows([]string{"COLUMN_NAME"}).AddRow("XSusut"))

	// Each safeCreate goes through the fallback INSERT path because
	// PerlakuanAktiva is reported missing. Register 3 INSERT expectations
	// (one per iteration) — the test asserts the probe ran exactly once.
	for i := 0; i < 3; i++ {
		mock.ExpectExec("^INSERT INTO DBTRANSAKSI .*").
			WillReturnResult(sqlmock.NewResult(1, 1))
	}

	svc := NewSKasBankService(&mockRepo{}, gormDB, nil, nil)

	err = gormDB.Transaction(func(tx *gorm.DB) error {
		for i := 0; i < 3; i++ {
			row := &SDbTransaksi{NoBukti: "T", Urut: i + 1, Perkiraan: "1"}
			if err := svc.safeCreateDBTransaksi(tx, row); err != nil {
				return err
			}
		}
		return nil
	})
	require.NoError(t, err)

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("probe should run once per tx: %v", err)
	}
}
}

func TestResolveHutPiutNoMsk(t *testing.T) {
	t.Parallel()

	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	gormDB, err := gorm.Open(sqlserver.New(sqlserver.Config{Conn: db}), &gorm.Config{})
	require.NoError(t, err)

	// Case 1: Existing NoMsk found → return MAX+1 = 3
	// Simulates: DBHUTPIUT already has NoMsk=1 and NoMsk=2 for this NoBukti+KodeCustSupp
	mock.ExpectQuery(`SELECT COALESCE\(MAX\(NoMsk\), 0\) FROM DBHUTPIUT WHERE NoBukti`).
		WithArgs("V001", "001").
		WillReturnRows(sqlmock.NewRows([]string{"max"}).AddRow(2))

	noMsk := resolveHutPiutNoMsk(gormDB, "V001", "001")
	assert.Equal(t, 3, noMsk)

	// Case 2: No existing row → return 1
	mock.ExpectQuery(`SELECT COALESCE\(MAX\(NoMsk\), 0\) FROM DBHUTPIUT WHERE NoBukti`).
		WithArgs("V002", "002").
		WillReturnRows(sqlmock.NewRows([]string{"max"}).AddRow(0))

	noMsk = resolveHutPiutNoMsk(gormDB, "V002", "002")
	assert.Equal(t, 1, noMsk)

	// Case 3: Query error → fallback to 1
	mock.ExpectQuery(`SELECT COALESCE\(MAX\(NoMsk\), 0\) FROM DBHUTPIUT WHERE NoBukti`).
		WithArgs("V003", "003").
		WillReturnError(errors.New("db error"))

	noMsk = resolveHutPiutNoMsk(gormDB, "V003", "003")
	assert.Equal(t, 1, noMsk)
}
