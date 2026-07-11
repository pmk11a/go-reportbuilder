package kasbank

import (
	"context"
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

// mockRepo is a hand-rolled mock of IKasBankRepository. testify/mock
// would be heavier; the small surface area here means a struct with
// function fields is enough to cover all the test cases.
type mockRepo struct {
	listFn           func(ctx context.Context, q SListKasBankQuery) ([]SDbTrans, int64, error)
	getByNoBuktiFn   func(ctx context.Context, noBukti string) (*SDbTrans, error)
	insertHeaderFn   func(ctx context.Context, h *SDbTrans) error
	updateHeaderFn   func(ctx context.Context, h *SDbTrans) error
	deleteHeaderFn   func(ctx context.Context, noBukti string) error
	listDetailFn     func(ctx context.Context, noBukti string) ([]SDbTransaksi, error)
	getDetailFn      func(ctx context.Context, noBukti string, urut int) (*SDbTransaksi, error)
	insertDetailFn   func(ctx context.Context, d *SDbTransaksi) error
	updateDetailFn   func(ctx context.Context, d *SDbTransaksi) error
	deleteDetailFn   func(ctx context.Context, noBukti string, urut int) error
	setOtorisasiFn   func(ctx context.Context, noBukti string, level int, userID string) error
	cancelOtorFn     func(ctx context.Context, noBukti string, level int) error
	genNoBuktiFn     func(ctx context.Context, tipe string) (string, error)
	lookupFn         func(ctx context.Context, query string, kelompokKas bool, limit int) ([]SDbPerkiraan, error)
	getPeriodeFn     func(ctx context.Context, userID string) (int, int, error)
	recalcTotalsFn   func(ctx context.Context, noBukti string) (float64, float64, error)
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
func (m *mockRepo) GenerateNoBukti(ctx context.Context, tipe string) (string, error) {
	if m.genNoBuktiFn != nil {
		return m.genNoBuktiFn(ctx, tipe)
	}
	return "", nil
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
func (m *mockRepo) GetAggregateTotals(ctx context.Context, noBuktis []string) (map[string]SAggregateTotals, error) {
	m.aggregateTotalsCalls++
	if m.getAggregateTotalsFn != nil {
		return m.getAggregateTotalsFn(ctx, noBuktis)
	}
	return map[string]SAggregateTotals{}, nil
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
	return NewSKasBankService(repo, gormDB)
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
	_, err := svc.GenerateNoBukti(context.Background(), "xyz", "SA")
	require.ErrorIs(t, err, ErrTipeInvalid)
}

// TestService_GenerateNoBukti_Ok lowercases to upper and returns the formatted voucher number.
func TestService_GenerateNoBukti_Ok(t *testing.T) {
	repo := &mockRepo{
		genNoBuktiFn: func(ctx context.Context, tipe string) (string, error) {
			return "BKK-202606-0001", nil
		},
	}
	svc := newServiceWithRealDB(t, repo)
	out, err := svc.GenerateNoBukti(context.Background(), "bkk", "SA")
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
	require.ErrorIs(t, err, ErrTanggalInvalid)
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
	require.ErrorIs(t, err, ErrDetailRequired)
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
func TestService_CreateHeader_DoubleEntryUnbalanced(t *testing.T) {
	svc := newServiceWithRealDB(t, &mockRepo{
		getPeriodeFn: func(ctx context.Context, userID string) (int, int, error) {
			return 6, 2026, nil
		},
	})
	_, err := svc.CreateHeader(context.Background(), "SA", SCreateKasBankRequest{
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
// negative-value and both-sides-set branches error out.
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

// Silence the "declared and not used" warning for errors if the test file
// is the only consumer.
var _ = errors.New
