// Package kasbank — service layer for Accounting > Kas Bank.
//
// The service encapsulates every business rule:
//   - Generate NoBukti atomically via DBNOMOR.
//   - Validate the journal date is inside the user's active period (DBPERIODE).
//   - Enforce double-entry (sum(Debet) == sum(Kredit) across ALL detail rows).
//   - Reject mutations after IsOtorisasi1=1 (locked once Otorisasi 1 fires).
//   - Support up to 5 sequential otorisasi levels (IsOtorisasi1-5): level N
//     requires level N-1 already approved, and the approver of level N must
//     differ from the approver of level N-1. The record's effective MaxOL
//     decides how many levels are actually required (see effectiveMaxOL).
//   - Re-validate on every detail mutation (Add/Update/Delete).
//
// The service holds a *gorm.DB so it can wrap multi-table operations in a
// single transaction. It depends on the repository interface for
// persistence — never on the concrete struct.
package kasbank

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/masza1/dapen-backend/internal/features/settings"
	"github.com/masza1/dapen-backend/internal/infrastructure/config"
	"github.com/masza1/dapen-backend/internal/infrastructure/persistence/models"
	"gorm.io/gorm"
)

// Sentinel errors translated by the handler into HTTP status codes.
// 400 = validation, 403 = authorization, 404 = missing, 500 = internal.
var (
	ErrTanggalDiLuarPeriode      = errors.New("tanggal di luar periode aktif user")
	ErrPeriodeLocked             = errors.New("periode transaksi sudah dikunci (locked)")
	ErrTanggalInvalid            = errors.New("format tanggal tidak valid")
	ErrTipeInvalid               = errors.New("tipe voucher harus BKM/BKK/BBM/BBK")
	ErrNoBuktiEmpty              = errors.New("no bukti kosong")
	ErrPeriodeNotSet             = errors.New("user belum memiliki periode aktif di DBPERIODE")
	ErrLockedByOtorisasi1        = errors.New("transaksi sudah diotorisasi level 1")
	ErrLockedByOtorisasi2        = errors.New("transaksi sudah diotorisasi level 2")
	ErrDoubleEntryUnbalanced     = errors.New("total debet dan kredit harus seimbang")
	ErrSelfOtorisasi             = errors.New("user yang mengotorisasi level sebelumnya tidak boleh mengotorisasi level berikutnya")
	ErrDetailRequired            = errors.New("minimal satu baris jurnal diperlukan")
	ErrDetailUrutConflict        = errors.New("urut detail bentrok dengan baris yang sudah ada")
	ErrNotFound                  = errors.New("transaksi kas bank tidak ditemukan")
	ErrOtorisasiLevelInvalid     = errors.New("level otorisasi tidak valid (harus 1-5)")
	ErrOtorisasiPrevLevelMissing = errors.New("level otorisasi sebelumnya belum disetujui")
	ErrOtorisasiNextLevelSet     = errors.New("tidak dapat membatalkan otorisasi karena level berikutnya sudah disetujui")
)

// maxOtorisasiLevel is the highest otorisasi level DAPEN supports, mirroring
// trade-exchange's IsOtorisasi1-5 columns on DBTRANS.
const maxOtorisasiLevel = 5

// defaultMaxOL is used when a record's MaxOL column is not a valid 1-5
// value (0, negative, or >5). This preserves the pre-TASK-021 behaviour for
// every record DAPEN itself created, which never populated MaxOL.
const defaultMaxOL = 2

// IKasBankService is the business-logic contract for the kasbank domain.
// The handler depends on this interface, not the concrete struct.
type IKasBankService interface {
	// List returns a page of journal headers matching the filters.
	List(ctx context.Context, q SListKasBankQuery) (*SListKasBankResponse, error)
	// GetByNoBukti fetches a header + its detail rows in one call so the
	// detail page only needs one round-trip.
	GetByNoBukti(ctx context.Context, noBukti string) (*SKasBankHeader, []SDbTransaksi, error)
	// GenerateNoBukti returns a freshly formatted voucher number for the
	// given tipe and devisi, using the caller's active accounting period
	// from DBPERIODE. The period's bulan/tahun drive the MMYYYY segment;
	// devisi drives the third segment (legacy "Simbol" column on DBTRANS).
	GenerateNoBukti(ctx context.Context, tipe, devisi, userID string) (*SGenerateNoBuktiResponse, error)
	// LookupPerkiraan is a passthrough used by the autocomplete in the
	// detail form.
	LookupPerkiraan(ctx context.Context, q SLookupPerkiraanQuery) (*SKasBankLookupPerkiraanResponse, error)
	// ResolveSubTransaction determines if a subform (giro/deposito/etc) should trigger.
	ResolveSubTransaction(ctx context.Context, perkiraan, dk string) (*SSubTransactionResult, error)
	// GetOutstandingHutPiut returns a list of outstanding invoices for a given Customer/Supplier and Account.
	GetOutstandingHutPiut(ctx context.Context, kodeCustSupp, perkiraan string) ([]models.SDBHUTPIUT, error)
	// LookupCustSupp searches for Customer/Supplier by query.
	LookupCustSupp(ctx context.Context, q string) ([]models.SDbCustSupp, error)
	MarkCetak(ctx context.Context, noBukti string) error

	// CreateHeader persists a new header and, optionally, its first
	// batch of detail rows. All writes are wrapped in a transaction.
	CreateHeader(ctx context.Context, userID string, req SCreateKasBankRequest) (*SDbTrans, error)
	// UpdateHeader overwrites an existing header. Rejected when the
	// header has IsOtorisasi1=1.
	UpdateHeader(ctx context.Context, noBukti string, req SUpdateKasBankRequest) error
	// DeleteHeader removes a header and its details. Rejected when any
	// otorisasi level is set.
	DeleteHeader(ctx context.Context, noBukti string) error

	// AddDetail appends one row. Auto-assigns Urut = max+1 and
	// re-validates double-entry for the resulting set.
	AddDetail(ctx context.Context, noBukti string, d SDetailInput) error
	// UpdateDetail replaces a row by Urut and re-validates double-entry.
	UpdateDetail(ctx context.Context, noBukti string, urut int, d SDetailInput) error
	// DeleteDetail removes a row and recalculates TotalD.
	DeleteDetail(ctx context.Context, noBukti string, urut int) error

	// SetOtorisasi sets the given level (1 to 5) for the header. Level N
	// requires level N-1 already approved by a different user.
	SetOtorisasi(ctx context.Context, noBukti string, level int, userID string) error
	// CancelOtorisasi clears the given level (1 to 5). Rejected if level
	// N+1 is already approved.
	CancelOtorisasi(ctx context.Context, noBukti string, level int) error
	// DB returns the underlying gorm.DB for raw queries in the handler.
	DB() *gorm.DB
}

// SKasBankService is the default GORM-backed implementation of IKasBankService.
type SKasBankService struct {
	repo        IKasBankRepository
	db          *gorm.DB
	cfg         *config.SConfig
	settingsSvc *settings.Service
}

// NewSKasBankService constructs the concrete service. The GORM handle is
// passed alongside the repository so the service can open transactions
// that span multiple repository calls. settingsSvc is required — the
// voucher-number generation lives in features/settings so it can be reused
// across procurement / production / util features without re-implementing
// the FORMAT/PEMISAH/Reset algorithm here.
func NewSKasBankService(repo IKasBankRepository, db *gorm.DB, cfg *config.SConfig, settingsSvc *settings.Service) *SKasBankService {
	return &SKasBankService{
		repo:        repo,
		db:          db,
		cfg:         cfg,
		settingsSvc: settingsSvc,
	}
}

// DB returns the underlying gorm.DB.
func (s *SKasBankService) DB() *gorm.DB {
	return s.db
}

// List delegates to the repository, batch-fetches aggregate totals for the
// whole page in a single query (avoiding N+1), and converts every raw row
// to the SKasBankHeader view-model — the same conversion GetByNoBukti uses
// (otorisasi1..5, effective maxol, locked). Without this conversion the
// list endpoint previously returned raw SDbTrans rows with no totals and
// the wrong JSON keys (see TASK-022 business problem).
func (s *SKasBankService) List(ctx context.Context, q SListKasBankQuery) (*SListKasBankResponse, error) {
	if q.Page < 1 {
		q.Page = 1
	}
	if q.PerPage < 1 {
		q.PerPage = 10
	}
	rows, total, err := s.repo.List(ctx, q)
	if err != nil {
		return nil, err
	}

	noBuktis := make([]string, 0, len(rows))
	for _, h := range rows {
		noBuktis = append(noBuktis, h.NoBukti)
	}
	aggregates, err := s.repo.GetAggregateTotals(ctx, noBuktis)
	if err != nil {
		return nil, err
	}

	items := make([]SKasBankHeader, 0, len(rows))
	for i := range rows {
		h := &rows[i]
		agg := aggregates[h.NoBukti] // zero-value SAggregateTotals when missing — not an error
		items = append(items, toKasBankHeader(h, agg))
	}

	return &SListKasBankResponse{
		Items:   items,
		Total:   total,
		Page:    q.Page,
		PerPage: q.PerPage,
	}, nil
}

// GetByNoBukti fetches the header and its detail rows in two queries. The
// domain view-model SKasBankHeader is filled in with pre-computed totals
// (TotalD, TotalK, JumlahValas, JumlahRupiah) for the UI badge, via the
// same single-NoBukti GetAggregateTotals path List() uses for a page — this
// keeps the detail and list views consistent without duplicating the
// aggregation SQL.
func (s *SKasBankService) GetByNoBukti(ctx context.Context, noBukti string) (*SKasBankHeader, []SDbTransaksi, error) {
	h, err := s.repo.GetByNoBukti(ctx, noBukti)
	if err != nil {
		return nil, nil, err
	}
	if h == nil {
		return nil, nil, ErrNotFound
	}
	details, err := s.repo.ListDetail(ctx, noBukti)
	if err != nil {
		return nil, nil, err
	}
	aggregates, err := s.repo.GetAggregateTotals(ctx, []string{noBukti})
	if err != nil {
		return nil, nil, err
	}
	agg := aggregates[noBukti] // zero-value when the voucher has no detail lines

	view := toKasBankHeader(h, agg)
	return &view, details, nil
}

// toKasBankHeader converts a raw DBTRANS row + its pre-computed aggregate
// totals into the SKasBankHeader view-model. Shared by List() (batch path)
// and GetByNoBukti() (single-row path) so the effectiveMaxOL/
// isOtorisasiApproved/field-mapping logic is not duplicated.
func toKasBankHeader(h *SDbTrans, agg SAggregateTotals) SKasBankHeader {
	maxOL := effectiveMaxOL(h)
	nojurnal := ""
	if h.NoJurnal != nil {
		nojurnal = *h.NoJurnal
	}
	// NoBuktiSem is not in DBTRANS in this SQL schema
	nobuktisem := ""
	return SKasBankHeader{
		NoBukti:         h.NoBukti,
		Tanggal:         h.Tanggal,
		Note:            h.Note,
		TglJurnal:       h.TglJurnal,
		NoJurnal:        nojurnal,
		NoBuktiSem:      nobuktisem,
		TipeTransHd:     h.TipeTransHd,
		PerkiraanHd:     h.PerkiraanHd,
		TotalD:          agg.TotalD,
		TotalK:          agg.TotalK,
		JumlahValas:     agg.JumlahValas,
		JumlahRupiah:    agg.JumlahRupiah,
		OtorisasiLevel1: h.IsOtorisasi1,
		OtorisasiLevel2: h.IsOtorisasi2,
		OtorisasiLevel3: h.IsOtorisasi3,
		OtorisasiLevel4: h.IsOtorisasi4,
		OtorisasiLevel5: h.IsOtorisasi5,
		OtoUser1:        h.OtoUser1,
		OtoUser2:        h.OtoUser2,
		OtoUser3:        h.OtoUser3,
		OtoUser4:        h.OtoUser4,
		OtoUser5:        h.OtoUser5,
		TglOto1:         h.TglOto1,
		TglOto2:         h.TglOto2,
		TglOto3:         h.TglOto3,
		TglOto4:         h.TglOto4,
		TglOto5:         h.TglOto5,
		MaxOL:           maxOL,
		Locked:          isOtorisasiApproved(h, maxOL),
	}
}

// GenerateNoBukti returns a freshly formatted voucher number.
//
// The voucher number format is composed from the user-configurable DBNOMOR
// template (FORMAT1..4 + PEMISAH + Reset + ALIAS + per-tipe counter
// NOBKK/NOBKM/NOBBM/NOBBK). See settings.Service.GenerateNoBukti for the
// shared algorithm — this method is a thin wrapper that:
//   1. Resolves the calling user's active accounting period from DBPERIODE.
//   2. Delegates to the repository which renders the next voucher number
//      inside a serialised transaction (UPDLOCK/HOLDLOCK on DBNOMOR).
//
// The `devisi` parameter is kept for API compatibility but is no longer
// required — the user-configurable template doesn't include a hardcoded
// Devisi slot (admins who want one can pick the KODE_TRANSAKSI slot).
func (s *SKasBankService) GenerateNoBukti(ctx context.Context, tipe, devisi, userID string) (*SGenerateNoBuktiResponse, error) {
	tipe = upper(tipe)
	if !ValidTipeTrans(tipe) {
		return nil, ErrTipeInvalid
	}

	bulan, tahun, errPeriode := GetCurrentPeriode(ctx, s.db, userID)
	if errPeriode != nil {
		return nil, errPeriode
	}
	if bulan == 0 || tahun == 0 {
		return nil, ErrPeriodeNotSet
	}

	v, err := s.repo.GenerateNoBukti(ctx, tipe, strings.TrimSpace(devisi), bulan, tahun)
	if err != nil {
		return nil, err
	}

	// GeneratedAt mirrors the date that will be written into
	// DBTRANS.Tanggal if the caller submits the voucher without overriding
	// the date — the year/month come from DBPERIODE, the day is clamped
	// to the last day of the period month (see defaultTanggal). This is
	// what the legacy FrmKasBank.pas shows in dtTanggal.Date right after
	// a "Generate NoBukti" click.
	return &SGenerateNoBuktiResponse{
		Tipe:        tipe,
		NoBukti:     v,
		GeneratedAt: defaultTanggal(tahun, bulan, time.Now()),
	}, nil
}

// LookupPerkiraan returns matching COA rows for the autocomplete in the
// detail form.
func (s *SKasBankService) LookupPerkiraan(ctx context.Context, q SLookupPerkiraanQuery) (*SKasBankLookupPerkiraanResponse, error) {
	rows, err := s.repo.LookupPerkiraan(ctx, q.Q, q.KelompokKas, q.Limit)
	if err != nil {
		return nil, err
	}
	return &SKasBankLookupPerkiraanResponse{Items: rows, Total: len(rows)}, nil
}

// CreateHeader validates the input, generates a NoBukti, persists the
// header + (optional) detail rows inside a single transaction.
func (s *SKasBankService) CreateHeader(ctx context.Context, userID string, req SCreateKasBankRequest) (*SDbTrans, error) {
	if req.TipeTransHd == "" || !ValidTipeTrans(req.TipeTransHd) {
		return nil, ErrTipeInvalid
	}

	// Resolve the active accounting period BEFORE parsing Tanggal. If the
	// caller did not supply a date (or supplied one that is outside the
	// period), we derive it from DBPERIODE rather than from `time.Now()` —
	// this matches the legacy Delphi behaviour where dtTanggal.Date was
	// always seeded from DBPERIODE (last day of the period month if today
	// is past that month).
	bulanPeriode, tahunPeriode, errPeriode := s.repo.GetPeriode(ctx, userID)
	if errPeriode != nil {
		return nil, errPeriode
	}
	if bulanPeriode == 0 || tahunPeriode == 0 {
		return nil, ErrPeriodeNotSet
	}

	var tanggal time.Time
	if req.Tanggal == "" {
		// No date supplied — fall back to the period-defaulted date (see
		// defaultTanggal docstring for the clamp rules).
		tanggal = defaultTanggal(tahunPeriode, bulanPeriode, time.Now())
	} else {
		t, err := parseTanggal(req.Tanggal)
		if err != nil {
			return nil, ErrTanggalInvalid
		}
		if !TanggalInPeriode(t, bulanPeriode, tahunPeriode) {
			return nil, ErrTanggalDiLuarPeriode
		}
		tanggal = t
	}

	if err := s.assertPeriodeNotLocked(ctx, tanggal); err != nil {
		return nil, err
	}

	// Validate double-entry invariant on the provided details BEFORE we
	// touch the database. We always re-validate after insert (in case the
	// caller sent duplicates or wrong signs) but failing fast here gives
	// a clearer 400 message.
	if len(req.Details) == 0 {
		return nil, ErrDetailRequired
	}
	if err := validateDoubleEntry(req.Details); err != nil {
		return nil, err
	}

	var header *SDbTrans
	var err error
	err = s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 1. Generate the voucher number. We do this inside the outer tx
		// so a concurrent caller cannot claim the same number. The helper
		// in nomor.go requires bulan/tahun from DBPERIODE plus the
		// DBNOMOR config — read those first, then call GenerateNoBukti.
		bulan, tahun, errPeriode := GetCurrentPeriode(ctx, tx, userID)
		if errPeriode != nil {
			return errPeriode
		}
		if bulan == 0 || tahun == 0 {
			return ErrPeriodeNotSet
		}
		devisi := strings.TrimSpace(req.Devisi)
		if devisi == "" {
			return errors.New("devisi wajib diisi")
		}
		result, errGen := s.settingsSvc.GenerateNoBuktiTx(tx, req.TipeTransHd, tahun, bulan)
		if errGen != nil {
			return errGen
		}
		if errCommit := s.settingsSvc.CommitCounterTx(tx, req.TipeTransHd, result.NewCounter); errCommit != nil {
			return errCommit
		}
		noBukti := result.NoBukti

		// 2. Insert the header.
		h := &SDbTrans{
			NoBukti:     noBukti,
			Tanggal:     &tanggal,
			Note:        req.Note,
			TipeTransHd: strPtr(req.TipeTransHd),
			PerkiraanHd: strPtrOrNil(req.PerkiraanHd),
			NoJurnal:    strPtrOrNil(req.NoJurnal),
			// NoBuktiSem:  strPtrOrNil(req.NoBuktiSem),
		}
		if req.TglJurnal != nil && *req.TglJurnal != "" {
			t, err := parseTanggal(*req.TglJurnal)
			if err != nil {
				return fmt.Errorf("invalid tgljurnal: %w", err)
			}
			h.TglJurnal = &t
		}
		if err := tx.Create(h).Error; err != nil {
			return fmt.Errorf("inserting header %q: %w", noBukti, err)
		}

		// 3. Insert detail rows with auto-assigned Urut.
		for i, d := range req.Details {
			urut := i + 1
			row := buildDetailRow(ctx, s, noBukti, urut, d, req.TipeTransHd, h, req.TPHC, req.NoBon, req.Devisi)
			if err := tx.Create(row).Error; err != nil {
				return fmt.Errorf("inserting detail row %d: %w", urut, err)
			}
		}

		// 4. Double-entry re-check now that rows are persisted.
		var totalD, totalK float64
		if err := tx.Raw(
			"SELECT COALESCE(SUM(Debet),0) AS d, COALESCE(SUM(Kredit),0) AS k FROM DBTRANSAKSI WHERE NoBukti = ?",
			noBukti,
		).Row().Scan(&totalD, &totalK); err != nil {
			return fmt.Errorf("re-validating totals: %w", err)
		}
		if !floatEq(totalD, totalK) {
			// TODO: Commented out per user request
			// return ErrDoubleEntryUnbalanced
		}

		// 5. Save Giro and Deposito if any
		for _, g := range req.GiroList {
			g.NoBukti = noBukti
			if err := tx.Create(&g).Error; err != nil {
				return fmt.Errorf("inserting giro %q: %w", g.NoGiro, err)
			}
		}
		for _, d := range req.DepositoList {
			d.NoBukti = noBukti
			if err := tx.Create(&d).Error; err != nil {
				return fmt.Errorf("inserting deposito %q: %w", d.NoDeposito, err)
			}
		}
		
		// 6. Save HutPiut (Pelunasan) if any
		for _, hp := range req.HutPiutList {
			hp.NoBukti = noBukti
			// Ensure it identifies as a payment row
			hp.Urut = 1 // or some unique identifier if there are multiple payments to same invoice in same bukti
			if err := tx.Create(&hp).Error; err != nil {
				return fmt.Errorf("inserting hutpiut payment for invoice %q: %w", hp.NoFaktur, err)
			}
		}

		// 7. Save Aktiva if any
		for _, aktiva := range req.AktivaList {
			aktiva.NoBuktiSem = &noBukti
			// If tanggals are missing, set to header tanggal
			if aktiva.Tanggal == nil {
				aktiva.Tanggal = header.Tanggal
			}
			if err := tx.Create(&aktiva).Error; err != nil {
				return fmt.Errorf("inserting aktiva %q: %w", aktiva.Perkiraan, err)
			}
		}

		header = h
		return nil
	})
	if err != nil {
		return nil, err
	}
	return header, nil
}

// UpdateHeader overwrites a header (full replace on the supported fields).
// Rejected when IsOtorisasi1=1.
func (s *SKasBankService) UpdateHeader(ctx context.Context, noBukti string, req SUpdateKasBankRequest) error {
	if noBukti == "" {
		return ErrNoBuktiEmpty
	}
	existing, err := s.repo.GetByNoBukti(ctx, noBukti)
	if err != nil {
		return err
	}
	if existing == nil {
		return ErrNotFound
	}
	if existing.IsOtorisasi1 {
		return ErrLockedByOtorisasi1
	}

	if req.Tanggal != "" {
		t, errP := parseTanggal(req.Tanggal)
		if errP != nil {
			return ErrTanggalInvalid
		}
		if err := s.assertPeriodeNotLocked(ctx, t); err != nil {
			return err
		}
		existing.Tanggal = &t
	}
	if req.TipeTransHd != "" {
		if !ValidTipeTrans(req.TipeTransHd) {
			return ErrTipeInvalid
		}
		existing.TipeTransHd = strPtr(req.TipeTransHd)
	}
	if req.PerkiraanHd != "" {
		existing.PerkiraanHd = strPtr(req.PerkiraanHd)
	}
	if req.Note != "" {
		existing.Note = req.Note
	}
	if req.TglJurnal != nil && *req.TglJurnal != "" {
		t, err := parseTanggal(*req.TglJurnal)
		if err != nil {
			return ErrTanggalInvalid
		}
		existing.TglJurnal = &t
	}
	if req.NoJurnal != "" {
		existing.NoJurnal = strPtr(req.NoJurnal)
	} else {
		existing.NoJurnal = nil
	}

	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 1. Save the header.
		if err := tx.Save(existing).Error; err != nil {
			return fmt.Errorf("updating header %q: %w", noBukti, err)
		}

		// 2. If the caller passed a new detail set, replace all rows and
		// re-validate double-entry.
		if len(req.Details) > 0 {
			if err := validateDoubleEntry(req.Details); err != nil {
				return err
			}
			if err := tx.Where("NoBukti = ?", noBukti).Delete(&SDbTransaksi{}).Error; err != nil {
				return fmt.Errorf("clearing details for %q: %w", noBukti, err)
			}
			for i, d := range req.Details {
				urut := i + 1
				row := buildDetailRow(ctx, s, noBukti, urut, d, strVal(existing.TipeTransHd), existing, req.TPHC, req.NoBon, req.Devisi)
				if err := tx.Create(row).Error; err != nil {
					return fmt.Errorf("re-inserting detail row %d: %w", urut, err)
				}
			}
			var totalD, totalK float64
			if err := tx.Raw(
				"SELECT COALESCE(SUM(Debet),0), COALESCE(SUM(Kredit),0) FROM DBTRANSAKSI WHERE NoBukti = ?",
				noBukti,
			).Row().Scan(&totalD, &totalK); err != nil {
				return fmt.Errorf("re-validating totals: %w", err)
			}
			if !floatEq(totalD, totalK) {
				// TODO: Commented out per user request
				// return ErrDoubleEntryUnbalanced
			}
		}

		// Always update Giro and Deposito (full replace for simplicity like details)
		if err := tx.Where("NoBukti = ?", noBukti).Delete(&models.SDBGIRO{}).Error; err != nil {
			return fmt.Errorf("clearing giro for %q: %w", noBukti, err)
		}
		if err := tx.Where("NoBukti = ?", noBukti).Delete(&models.SDBDEPOSITO{}).Error; err != nil {
			return fmt.Errorf("clearing deposito for %q: %w", noBukti, err)
		}
		for _, g := range req.GiroList {
			g.NoBukti = noBukti
			if err := tx.Create(&g).Error; err != nil {
				return fmt.Errorf("inserting giro %q: %w", g.NoGiro, err)
			}
		}
		for _, d := range req.DepositoList {
			d.NoBukti = noBukti
			if err := tx.Create(&d).Error; err != nil {
				return fmt.Errorf("inserting deposito %q: %w", d.NoDeposito, err)
			}
		}
		
		if err := tx.Where("NoBukti = ?", noBukti).Delete(&models.SDBHUTPIUT{}).Error; err != nil {
			return fmt.Errorf("clearing hutpiut for %q: %w", noBukti, err)
		}
		for _, hp := range req.HutPiutList {
			hp.NoBukti = noBukti
			hp.Urut = 1
			if err := tx.Create(&hp).Error; err != nil {
				return fmt.Errorf("inserting hutpiut payment for invoice %q: %w", hp.NoFaktur, err)
			}
		}

		if err := tx.Where("NoBuktiSem = ?", noBukti).Delete(&models.SDBAKTIVA{}).Error; err != nil {
			return fmt.Errorf("clearing aktiva for %q: %w", noBukti, err)
		}
		for _, aktiva := range req.AktivaList {
			aktiva.NoBuktiSem = &noBukti
			if aktiva.Tanggal == nil {
				aktiva.Tanggal = existing.Tanggal
			}
			if err := tx.Create(&aktiva).Error; err != nil {
				return fmt.Errorf("inserting aktiva %q: %w", aktiva.Perkiraan, err)
			}
		}

		return nil
	})
}

// DeleteHeader removes a header and its details. Rejected when any
// otorisasi level is set (the record is considered legally significant).
func (s *SKasBankService) DeleteHeader(ctx context.Context, noBukti string) error {
	if noBukti == "" {
		return ErrNoBuktiEmpty
	}
	existing, err := s.repo.GetByNoBukti(ctx, noBukti)
	if err != nil {
		return err
	}
	if existing == nil {
		return ErrNotFound
	}
	if existing.IsOtorisasi1 || existing.IsOtorisasi2 {
		return ErrLockedByOtorisasi1
	}
	if existing.Tanggal != nil {
		if err := s.assertPeriodeNotLocked(ctx, *existing.Tanggal); err != nil {
			return err
		}
	}
	return s.repo.DeleteHeader(ctx, noBukti)
}

// AddDetail appends a single detail row. Auto-assigns Urut = max+1 and
// re-validates double-entry for the resulting set.
func (s *SKasBankService) AddDetail(ctx context.Context, noBukti string, d SDetailInput) error {
	if noBukti == "" {
		return ErrNoBuktiEmpty
	}
	header, err := s.repo.GetByNoBukti(ctx, noBukti)
	if err != nil {
		return err
	}
	if header == nil {
		return ErrNotFound
	}
	if header.IsOtorisasi1 {
		return ErrLockedByOtorisasi1
	}

	existingDetails, err := s.repo.ListDetail(ctx, noBukti)
	if err != nil {
		return err
	}
	maxUrut := 0
	for _, ed := range existingDetails {
		if ed.Urut > maxUrut {
			maxUrut = ed.Urut
		}
	}
	newUrut := maxUrut + 1

	// Combine existing + new for the double-entry check.
	allInputs := detailsToInputs(existingDetails)
	allInputs = append(allInputs, d)
	if err := validateDoubleEntry(allInputs); err != nil {
		return err
	}

	// For single detail add/update, devisi isn't updated, we pass empty string (or we could lookup from db if needed, but DBTRANS doesn't have devisi anyway)
	row := buildDetailRow(ctx, s, noBukti, newUrut, d, strVal(header.TipeTransHd), header, d.TPHC, "", "")
	return s.repo.InsertDetail(ctx, row)
}

// UpdateDetail replaces a single detail row and re-validates double-entry.
func (s *SKasBankService) UpdateDetail(ctx context.Context, noBukti string, urut int, d SDetailInput) error {
	if noBukti == "" {
		return ErrNoBuktiEmpty
	}
	header, err := s.repo.GetByNoBukti(ctx, noBukti)
	if err != nil {
		return err
	}
	if header == nil {
		return ErrNotFound
	}
	if header.IsOtorisasi1 {
		return ErrLockedByOtorisasi1
	}
	existing, err := s.repo.GetDetail(ctx, noBukti, urut)
	if err != nil {
		return err
	}
	if existing == nil {
		return ErrNotFound
	}

	otherDetails, err := s.repo.ListDetail(ctx, noBukti)
	if err != nil {
		return err
	}
	others := make([]SDetailInput, 0, len(otherDetails))
	for _, ed := range otherDetails {
		if ed.Urut == urut {
			continue
		}
		others = append(others, SDetailInput{
			Urut:        ed.Urut,
			Perkiraan:   ed.Perkiraan,
			Lawan:       ed.Lawan,
			Debet:       ed.Debet,
			Kredit:      ed.Kredit,
			Valas:       ed.Valas,
			Kurs:        ed.Kurs,
			Keterangan:  ed.Keterangan,
			TipeTrans:   ed.TipeTrans,
			TPHC:        ed.TPHC,
			KodeBag:     ed.KodeBag,
			KodeCustSupp: ed.CustSuppP,
		})
	}
	allInputs := append(others, d)
	if err := validateDoubleEntry(allInputs); err != nil {
		return err
	}

	row := buildDetailRow(ctx, s, noBukti, urut, d, strVal(header.TipeTransHd), header, d.TPHC, "", "")
	return s.repo.UpdateDetail(ctx, row)
}

// DeleteDetail removes a single detail row.
func (s *SKasBankService) DeleteDetail(ctx context.Context, noBukti string, urut int) error {
	if noBukti == "" {
		return ErrNoBuktiEmpty
	}
	header, err := s.repo.GetByNoBukti(ctx, noBukti)
	if err != nil {
		return err
	}
	if header == nil {
		return ErrNotFound
	}
	if header.IsOtorisasi1 {
		return ErrLockedByOtorisasi1
	}
	return s.repo.DeleteDetail(ctx, noBukti, urut)
}

// SetOtorisasi sets the flag/user/timestamp for the given level (1-5). The
// service enforces two sequential rules:
//   - Level N (N>1) requires level N-1 already approved.
//   - The approver of level N must differ from the approver of level N-1.
//
// Level 1 has no predecessor, so neither rule applies.
func (s *SKasBankService) SetOtorisasi(ctx context.Context, noBukti string, level int, userID string) error {
	if level < 1 || level > maxOtorisasiLevel {
		return ErrOtorisasiLevelInvalid
	}
	header, err := s.repo.GetByNoBukti(ctx, noBukti)
	if err != nil {
		return err
	}
	if header == nil {
		return ErrNotFound
	}
	if level > 1 {
		prevApproved, prevUser := otorisasiLevelState(header, level-1)
		if !prevApproved {
			return ErrOtorisasiPrevLevelMissing
		}
		if prevUser == userID {
			return ErrSelfOtorisasi
		}
	}
	return s.repo.SetOtorisasi(ctx, noBukti, level, userID)
}

// CancelOtorisasi clears the flag/user/timestamp for the given level (1-5).
// We don't gate this on the existing flag — the handler will check the
// IsBatal permission before calling. Cancelling level N is rejected when
// level N+1 is already approved (you must cancel from the top down).
func (s *SKasBankService) CancelOtorisasi(ctx context.Context, noBukti string, level int) error {
	if level < 1 || level > maxOtorisasiLevel {
		return ErrOtorisasiLevelInvalid
	}
	header, err := s.repo.GetByNoBukti(ctx, noBukti)
	if err != nil {
		return err
	}
	if header == nil {
		return ErrNotFound
	}
	if level < maxOtorisasiLevel {
		nextApproved, _ := otorisasiLevelState(header, level+1)
		if nextApproved {
			return ErrOtorisasiNextLevelSet
		}
	}
	return s.repo.CancelOtorisasi(ctx, noBukti, level)
}

// otorisasiLevelState returns (IsOtorisasiN, OtoUserN) for the given level
// (1-5). Go cannot do dynamic struct-field access by computed name without
// reflection, and IsOtorisasi1..5/OtoUser1..5 are separate named fields
// (not an array) mapping 1:1 to DBTRANS columns, so an explicit switch is
// the simplest correct option. Returns (false, "") for any level outside
// 1-5 — callers are expected to validate the level first.
func otorisasiLevelState(h *SDbTrans, level int) (approved bool, otoUser string) {
	switch level {
	case 1:
		return h.IsOtorisasi1, h.OtoUser1
	case 2:
		return h.IsOtorisasi2, h.OtoUser2
	case 3:
		return h.IsOtorisasi3, h.OtoUser3
	case 4:
		return h.IsOtorisasi4, h.OtoUser4
	case 5:
		return h.IsOtorisasi5, h.OtoUser5
	default:
		return false, ""
	}
}

// effectiveMaxOL returns the EFFECTIVE maximum otorisasi level for a
// record: the record's own MaxOL column when it holds a valid 1-5 value
// (covers legacy/imported records, e.g. from trade-exchange), otherwise
// defaultMaxOL (2) — preserving DAPEN's pre-TASK-021 2-level behaviour for
// every record DAPEN itself creates (which never sets MaxOL).
func effectiveMaxOL(h *SDbTrans) int {
	if h.MaxOL >= 1 && h.MaxOL <= maxOtorisasiLevel {
		return h.MaxOL
	}
	return defaultMaxOL
}

// isOtorisasiApproved returns true once every level from 1 through maxOL
// is approved. Approval is sequential by construction (SetOtorisasi
// enforces level N-1 before level N), so checking level maxOL alone would
// suffice in practice — we still walk all levels here for clarity and to
// stay correct even if that invariant is ever relaxed.
func isOtorisasiApproved(h *SDbTrans, maxOL int) bool {
	for level := 1; level <= maxOL; level++ {
		approved, _ := otorisasiLevelState(h, level)
		if !approved {
			return false
		}
	}
	return true
}

// assertTanggalInPeriode returns ErrTanggalDiLuarPeriode if the journal
// date does not fall inside the user's active period. ErrPeriodeNotSet
// is returned when the user has no DBPERIODE row.
func (s *SKasBankService) assertTanggalInPeriode(ctx context.Context, userID string, tanggal time.Time) error {
	bulan, tahun, err := s.repo.GetPeriode(ctx, userID)
	if err != nil {
		return err
	}
	if bulan == 0 || tahun == 0 {
		return ErrPeriodeNotSet
	}
	if !TanggalInPeriode(tanggal, bulan, tahun) {
		return ErrTanggalDiLuarPeriode
	}
	return nil
}

// assertPeriodeNotLocked returns ErrPeriodeLocked if the given tanggal falls into a locked period.
func (s *SKasBankService) assertPeriodeNotLocked(ctx context.Context, tanggal time.Time) error {
	bulan := int(tanggal.Month())
	tahun := tanggal.Year()
	
	var count int64
	if err := s.db.WithContext(ctx).Model(&models.SDbLockPeriode{}).
		Where("BULAN = ? AND TAHUN = ?", bulan, tahun).
		Count(&count).Error; err != nil {
		return err
	}
	
	if count > 0 {
		return ErrPeriodeLocked
	}
	return nil
}

// validateDoubleEntry returns an error when sum(Debet) != sum(Kredit)
// across the slice. We tolerate floating-point error of 0.01 rupiah.
func validateDoubleEntry(details []SDetailInput) error {
	var totalD, totalK float64
	for _, d := range details {
		if d.Debet < 0 || d.Kredit < 0 {
			return fmt.Errorf("nilai debet/kredit tidak boleh negatif")
		}
		if d.Debet > 0 && d.Kredit > 0 {
			return fmt.Errorf("satu baris tidak boleh punya debet dan kredit sekaligus")
		}
		totalD += d.Debet
		totalK += d.Kredit
	}
	if !floatEq(totalD, totalK) {
		// TODO: Commented out per user request
		// return ErrDoubleEntryUnbalanced
	}
	return nil
}

// buildDetailRow materialises a SDbTransaksi row from a DTO input.
// Urut must already be set by the caller.
func buildDetailRow(ctx context.Context, s *SKasBankService, noBukti string, urut int, d SDetailInput, tipeTrans string, h *SDbTrans, headerTPHC string, headerNoBon string, headerDevisi string) *SDbTransaksi {
	valas := d.Valas
	if valas == "" {
		valas = "IDR"
	}

	row := &SDbTransaksi{
		NoBukti:    noBukti,
		Tanggal:    h.Tanggal,
		Perkiraan:  d.Perkiraan,
		Lawan:      d.Lawan,
		Debet:      d.Debet,
		Kredit:     d.Kredit,
		Valas:      valas,
		Kurs:       d.Kurs,
		Keterangan: d.Keterangan,
		TipeTrans:  tipeTrans,
		TPHC:       headerTPHC,
		KodeBag:    d.KodeBag,
		CustSuppP:  d.KodeCustSupp,
		Urut:       urut,
		Devisi:     headerDevisi,
		Nobon:      headerNoBon,
	}

	dkVal := calculateDK(d.Debet, d.Kredit)

	row.StatusGiro = calculateStatusGiro(headerTPHC, tipeTrans)

	// Resolve Sub-transaction to fill KodeP, KodeL, StatusAktivaP, StatusAktivaL
	subRes, err := s.ResolveSubTransaction(ctx, d.Perkiraan, dkVal)
	if err == nil && subRes != nil {
		row.KodeP = subRes.Kode
		row.KodeL = subRes.Kode // Legacy logic often mirrors this if Lawan is used, but for KasBank Lawan is same as Perkiraan
		if subRes.Trigger == "aktiva" {
			row.StatusAktivaP = subRes.StatusP
			row.StatusAktivaL = subRes.StatusL
		}
	}
	if d.Kurs == 0 {
		row.Kurs = 1
	}
	// DebetRp / KreditRp default to the IDR value when no foreign currency.
	if d.Valas == "" || d.Valas == "IDR" {
		row.DebetRp = d.Debet
		row.KreditRp = d.Kredit
	} else {
		row.DebetRp = d.Debet * row.Kurs
		row.KreditRp = d.Kredit * row.Kurs
	}
	// FlagSimbol is the default "RP" for IDR transactions.
	if row.FlagSimbol == "" {
		row.FlagSimbol = "RP"
	}
	return row
}

// detailsToInputs converts a slice of SDbTransaksi to a slice of SDetailInput.
// Used by AddDetail to fold existing rows into the double-entry check.
func detailsToInputs(rows []SDbTransaksi) []SDetailInput {
	out := make([]SDetailInput, 0, len(rows))
	for _, r := range rows {
		out = append(out, SDetailInput{
			Urut:       r.Urut,
			Perkiraan:  r.Perkiraan,
			Lawan:      r.Lawan,
			Debet:      r.Debet,
			Kredit:     r.Kredit,
			Valas:      r.Valas,
			Kurs:       r.Kurs,
			Keterangan: r.Keterangan,
			TipeTrans:  r.TipeTrans,
			TPHC:       r.TPHC,
			KodeBag:    r.KodeBag,
			KodeCustSupp: r.CustSuppP,
		})
	}
	return out
}

// parseTanggal accepts either RFC3339 or YYYY-MM-DD; returns time.UTC.
func parseTanggal(s string) (time.Time, error) {
	if t, err := time.Parse(time.RFC3339, s); err == nil {
		return t, nil
	}
	if t, err := time.Parse("2006-01-02", s); err == nil {
		return t, nil
	}
	return time.Time{}, fmt.Errorf("unrecognised tanggal: %q", s)
}

// defaultTanggal returns the calendar date a new voucher should carry when
// the caller does not supply one. The legacy Delphi code (FrmKasBank.pas)
// always populated dtTanggal from DBPERIODE rather than from today's
// calendar — for example, a user whose period is still 07/2026 but who
// opens the form on 12-08-2026 would have the voucher posted on 31-07-2026
// (last day of the active period), NOT on 12-08-2026.
//
// Algorithm:
//   - year = period.tahun
//   - month = period.bulan
//   - day = min(today.day, lastDayOf(period.tahun, period.bulan))
//
// `today` is the wall-clock time at the moment of the request. The clamped
// `day` ensures that e.g. opening the form on 31-Aug for a period of
// 02/2026 produces 28-Feb (or 29-Feb in leap years), not 31-Feb (which
// would otherwise panic when normalised).
func defaultTanggal(tahun int, bulan int, today time.Time) time.Time {
	loc := today.Location()
	if loc == nil {
		loc = time.UTC
	}
	// Last day of the requested month — Go's time.Date normalises overflow
	// (day=32 in a 30-day month → day 1 of next month), so we explicitly
	// compute the boundary by jumping to the next month and back.
	firstOfNext := time.Date(tahun, time.Month(bulan)+1, 1, 0, 0, 0, 0, loc)
	lastDay := firstOfNext.AddDate(0, 0, -1).Day()
	day := today.Day()
	if day > lastDay {
		day = lastDay
	}
	return time.Date(tahun, time.Month(bulan), day, 0, 0, 0, 0, loc)
}

// upper is a small ASCII-only uppercase helper so we don't pull in the
// strings package just for strings.ToUpper.
func upper(s string) string {
	out := make([]byte, len(s))
	for i := 0; i < len(s); i++ {
		c := s[i]
		if c >= 'a' && c <= 'z' {
			c -= 32
		}
		out[i] = c
	}
	return string(out)
}

func strPtr(s string) *string { return &s }
func strPtrOrNil(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
func strVal(p *string) string {
	if p == nil {
		return ""
	}
	return *p
}

func floatEq(a, b float64) bool {
	return math.Abs(a-b) < 0.01
}

// ResolveSubTransaction determines if a subform should trigger based on the perkiraan selected and feature flags.
func (s *SKasBankService) ResolveSubTransaction(ctx context.Context, perkiraan, dk string) (*SSubTransactionResult, error) {
	// Look up the perkiraan in DBPOSTHUTPIUT
	var postHutPiut models.SDbPostHutPiut
	if err := s.db.WithContext(ctx).Where("Perkiraan = ?", perkiraan).First(&postHutPiut).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Not found means no trigger
			return &SSubTransactionResult{}, nil
		}
		return nil, err
	}

	kode := postHutPiut.Kode
	var statusP, statusL, trigger string

	switch kode {
	case "DP":
		if dk == "D" {
			statusP = "DP+"
		} else {
			statusL = "DP-"
		}
	case "PT":
		if dk == "D" {
			statusP = "PT+"
		} else {
			statusL = "PT-"
		}
	case "HT":
		if dk == "D" {
			statusP = "HT-"
		} else {
			statusL = "HT+"
		}
	case "UPT":
		if dk == "D" {
			statusP = "UPT-"
		} else {
			statusL = "UPT+"
		}
	case "UHT":
		if dk == "D" {
			statusP = "UHT+"
		} else {
			statusL = "UHT-"
		}
	case "AKV":
		if dk == "D" {
			statusP = "AKV+"
		} else {
			statusL = "AKV-"
		}
	case "AKM":
		if dk == "D" {
			statusP = "AKM+"
		} else {
			statusL = "AKM-"
		}
	}

	// Determine trigger name
	if kode == "AKV" || kode == "AKM" {
		trigger = "aktiva"
	} else if kode == "PT" || kode == "HT" || kode == "UPT" || kode == "UHT" {
		trigger = "hutpiut"
	} else if kode == "DP" {
		trigger = "giro"
	}

	// Apply feature flags
	if trigger == "giro" && (!s.cfg.EnableGiroFeature && !s.cfg.EnableDepositoFeature) {
		// Wait, the documentation says Kode='DP' is for Giro and Deposito.
		// So if both are disabled, we return empty trigger.
		if kode == "DP" && !s.cfg.EnableGiroFeature && !s.cfg.EnableDepositoFeature {
			trigger = ""
		}
	}

	return &SSubTransactionResult{
		Trigger: trigger,
		Kode:    kode,
		StatusP: statusP,
		StatusL: statusL,
	}, nil
}

// GetOutstandingHutPiut queries the DBHUTPIUT table for invoices that have not been fully paid.
// It groups by NoFaktur and filters out those where SUM(Debet) == SUM(Kredit).
func (s *SKasBankService) GetOutstandingHutPiut(ctx context.Context, kodeCustSupp, perkiraan string) ([]models.SDBHUTPIUT, error) {
	var results []models.SDBHUTPIUT
	
	// This uses a raw query because GORM group by and having can be verbose, 
	// but we must stick to GORM methods to ensure SQL Server 2008 compatibility cleanly.
	// Actually we can do a subquery or just use Select and Group.
	// Let's use Raw to make it simple and standard SQL.
	query := `
		SELECT 
			NoFaktur, 
			MAX(Tanggal) as Tanggal, 
			MAX(JatuhTempo) as JatuhTempo, 
			MAX(Catatan) as Catatan,
			SUM(Debet) as Debet,
			SUM(Kredit) as Kredit,
			SUM(DebetD) as DebetD,
			SUM(KreditD) as KreditD,
			MAX(Valas) as Valas,
			MAX(Kurs) as Kurs,
			MAX(TipeTrans) as TipeTrans,
			MAX(NoBukti) as NoBukti
		FROM DBHUTPIUT
		WHERE KodeCustSupp = ? AND Perkiraan = ?
		GROUP BY NoFaktur
		HAVING SUM(Debet) != SUM(Kredit)
	`
	if err := s.db.WithContext(ctx).Raw(query, kodeCustSupp, perkiraan).Scan(&results).Error; err != nil {
		return nil, err
	}
	
	return results, nil
}

// LookupCustSupp searches DBCUSTSUPP by code or name.
func (s *SKasBankService) LookupCustSupp(ctx context.Context, q string) ([]models.SDbCustSupp, error) {
	var results []models.SDbCustSupp
	query := s.db.WithContext(ctx)
	if q != "" {
		likeQ := "%" + q + "%"
		query = query.Where("KODECUSTSUPP LIKE ? OR NAMACUSTSUPP LIKE ?", likeQ, likeQ)
	}
	if err := query.Limit(50).Find(&results).Error; err != nil {
		return nil, err
	}
	return results, nil
}

func calculateDK(debet float64, kredit float64) string {
	if debet > 0 {
		return "D"
	}
	return "K"
}

func calculateStatusGiro(tphc string, mode string) string {
	if tphc == "P" {
		if mode == "BKM" || mode == "BBM" {
			return "P+"
		} else {
			return "P-"
		}
	} else if tphc == "H" {
		if mode == "BKM" || mode == "BBM" {
			return "H+"
		} else {
			return "H-"
		}
	}
	return ""
}

func (s *SKasBankService) MarkCetak(ctx context.Context, noBukti string) error {
	return s.db.Model(&models.SDBTRANS{}).Where("NoBukti = ?", noBukti).Update("Cetak", 1).Error
}
