package kasbank

import (
	"context"
	"errors"
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

// TestService_List_Happy covers the passthrough.
func TestService_List_Happy(t *testing.T) {
	repo := &mockRepo{
		listFn: func(ctx context.Context, q SListKasBankQuery) ([]SDbTrans, int64, error) {
			return []SDbTrans{{NoBukti: "BKK-1"}}, 1, nil
		},
	}
	svc := newServiceWithRealDB(t, repo)
	out, err := svc.List(context.Background(), SListKasBankQuery{Page: 1, PerPage: 10})
	require.NoError(t, err)
	assert.Equal(t, int64(1), out.Total)
	assert.Len(t, out.Items, 1)
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

// TestService_GetByNoBukti_Found pre-computes totals and locks the record.
func TestService_GetByNoBukti_Found(t *testing.T) {
	now := time.Now()
	repo := &mockRepo{
		getByNoBuktiFn: func(ctx context.Context, noBukti string) (*SDbTrans, error) {
			return &SDbTrans{NoBukti: noBukti, Tanggal: &now, IsOtorisasi1: true}, nil
		},
		listDetailFn: func(ctx context.Context, noBukti string) ([]SDbTransaksi, error) {
			return []SDbTransaksi{{NoBukti: noBukti, Urut: 1, Debet: 1000}}, nil
		},
		recalcTotalsFn: func(ctx context.Context, noBukti string) (float64, float64, error) {
			return 1000, 1000, nil
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

// TestService_SetOtorisasi_InvalidLevel rejects levels other than 1 or 2.
func TestService_SetOtorisasi_InvalidLevel(t *testing.T) {
	repo := &mockRepo{
		getByNoBuktiFn: func(ctx context.Context, noBukti string) (*SDbTrans, error) {
			return &SDbTrans{NoBukti: noBukti}, nil
		},
	}
	svc := newServiceWithRealDB(t, repo)
	err := svc.SetOtorisasi(context.Background(), "BKK-1", 3, "SA")
	require.Error(t, err)
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
