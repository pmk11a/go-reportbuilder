// Package kasbank — service layer for Accounting > Kas Bank.
//
// The service encapsulates every business rule:
//   - Generate NoBukti atomically via DBNOMOR.
//   - Validate the journal date is inside the user's active period (DBPERIODE).
//   - Enforce double-entry (sum(Debet) == sum(Kredit) across ALL detail rows).
//   - Reject mutations after IsOtorisasi1=1 (locked once Otorisasi 1 fires).
//   - Reject Otorisasi 2 by the same user that did Otorisasi 1.
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
	"time"

	"gorm.io/gorm"
)

// Sentinel errors translated by the handler into HTTP status codes.
// 400 = validation, 403 = authorization, 404 = missing, 500 = internal.
var (
	ErrTanggalDiLuarPeriode = errors.New("tanggal di luar periode aktif user")
	ErrTanggalInvalid       = errors.New("format tanggal tidak valid")
	ErrTipeInvalid          = errors.New("tipe voucher harus BKM/BKK/BBM/BBK")
	ErrNoBuktiEmpty         = errors.New("no bukti kosong")
	ErrPeriodeNotSet        = errors.New("user belum memiliki periode aktif di DBPERIODE")
	ErrLockedByOtorisasi1   = errors.New("transaksi sudah diotorisasi level 1")
	ErrLockedByOtorisasi2   = errors.New("transaksi sudah diotorisasi level 2")
	ErrDoubleEntryUnbalanced = errors.New("total debet dan kredit harus seimbang")
	ErrSelfOtorisasi        = errors.New("user yang mengotorisasi level 1 tidak boleh mengotorisasi level 2")
	ErrDetailRequired       = errors.New("minimal satu baris jurnal diperlukan")
	ErrDetailUrutConflict   = errors.New("urut detail bentrok dengan baris yang sudah ada")
	ErrNotFound             = errors.New("transaksi kas bank tidak ditemukan")
)

// IKasBankService is the business-logic contract for the kasbank domain.
// The handler depends on this interface, not the concrete struct.
type IKasBankService interface {
	// List returns a page of journal headers matching the filters.
	List(ctx context.Context, q SListKasBankQuery) (*SListKasBankResponse, error)
	// GetByNoBukti fetches a header + its detail rows in one call so the
	// detail page only needs one round-trip.
	GetByNoBukti(ctx context.Context, noBukti string) (*SKasBankHeader, []SDbTransaksi, error)
	// GenerateNoBukti returns a freshly formatted voucher number for the
	// given tipe. The service decides whether the caller has access.
	GenerateNoBukti(ctx context.Context, tipe, userID string) (*SGenerateNoBuktiResponse, error)
	// LookupPerkiraan is a passthrough used by the autocomplete in the
	// detail form.
	LookupPerkiraan(ctx context.Context, q SLookupPerkiraanQuery) (*SKasBankLookupPerkiraanResponse, error)

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

	// SetOtorisasi sets the given level (1 or 2) for the header.
	SetOtorisasi(ctx context.Context, noBukti string, level int, userID string) error
	// CancelOtorisasi clears the given level (1 or 2).
	CancelOtorisasi(ctx context.Context, noBukti string, level int) error
}

// SKasBankService is the default GORM-backed implementation of IKasBankService.
type SKasBankService struct {
	repo IKasBankRepository
	db   *gorm.DB
}

// NewSKasBankService constructs the concrete service. The GORM handle is
// passed alongside the repository so the service can open transactions
// that span multiple repository calls.
func NewSKasBankService(repo IKasBankRepository, db *gorm.DB) *SKasBankService {
	return &SKasBankService{repo: repo, db: db}
}

// List delegates to the repository and wraps the result in a paginated DTO.
func (s *SKasBankService) List(ctx context.Context, q SListKasBankQuery) (*SListKasBankResponse, error) {
	if q.Page < 1 {
		q.Page = 1
	}
	if q.PerPage < 1 {
		q.PerPage = 10
	}
	items, total, err := s.repo.List(ctx, q)
	if err != nil {
		return nil, err
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
// (TotalD, TotalK) for the UI badge.
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
	totalD, totalK, err := s.repo.RecalcTotals(ctx, noBukti)
	if err != nil {
		return nil, nil, err
	}
	view := &SKasBankHeader{
		NoBukti:         h.NoBukti,
		Tanggal:         h.Tanggal,
		Note:            h.Note,
		TipeTransHd:     h.TipeTransHd,
		PerkiraanHd:     h.PerkiraanHd,
		TotalD:          totalD,
		TotalK:          totalK,
		OtorisasiLevel1: h.IsOtorisasi1,
		OtorisasiLevel2: h.IsOtorisasi2,
		Locked:          h.IsOtorisasi1 || h.IsOtorisasi2,
	}
	return view, details, nil
}

// GenerateNoBukti returns a freshly formatted voucher number.
func (s *SKasBankService) GenerateNoBukti(ctx context.Context, tipe, userID string) (*SGenerateNoBuktiResponse, error) {
	tipe = upper(tipe)
	if !ValidTipeTrans(tipe) {
		return nil, ErrTipeInvalid
	}
	v, err := s.repo.GenerateNoBukti(ctx, tipe)
	if err != nil {
		return nil, err
	}
	return &SGenerateNoBuktiResponse{
		Tipe:        tipe,
		NoBukti:     v,
		GeneratedAt: time.Now(),
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
	tanggal, err := parseTanggal(req.Tanggal)
	if err != nil {
		return nil, ErrTanggalInvalid
	}
	if err := s.assertTanggalInPeriode(ctx, userID, tanggal); err != nil {
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
	err = s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 1. Generate the voucher number. We do this inside the outer tx
		// so a concurrent caller cannot claim the same number.
		noBukti, errGen := GenerateNoBukti(tx, req.TipeTransHd)
		if errGen != nil {
			return errGen
		}

		// 2. Insert the header.
		h := &SDbTrans{
			NoBukti:     noBukti,
			Tanggal:     &tanggal,
			Note:        req.Note,
			TipeTransHd: strPtr(req.TipeTransHd),
			PerkiraanHd: strPtrOrNil(req.PerkiraanHd),
		}
		if err := tx.Create(h).Error; err != nil {
			return fmt.Errorf("inserting header %q: %w", noBukti, err)
		}

		// 3. Insert detail rows with auto-assigned Urut.
		for i, d := range req.Details {
			urut := i + 1
			row := buildDetailRow(noBukti, urut, d, req.TipeTransHd, h)
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
			return ErrDoubleEntryUnbalanced
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
				row := buildDetailRow(noBukti, urut, d, strVal(existing.TipeTransHd), existing)
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
				return ErrDoubleEntryUnbalanced
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

	row := buildDetailRow(noBukti, newUrut, d, strVal(header.TipeTransHd), header)
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
		})
	}
	allInputs := append(others, d)
	if err := validateDoubleEntry(allInputs); err != nil {
		return err
	}

	row := buildDetailRow(noBukti, urut, d, strVal(header.TipeTransHd), header)
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

// SetOtorisasi sets the flag/user/timestamp for the given level. The
// service enforces "different user between level 1 and level 2".
func (s *SKasBankService) SetOtorisasi(ctx context.Context, noBukti string, level int, userID string) error {
	if level != 1 && level != 2 {
		return fmt.Errorf("invalid level %d", level)
	}
	header, err := s.repo.GetByNoBukti(ctx, noBukti)
	if err != nil {
		return err
	}
	if header == nil {
		return ErrNotFound
	}
	if level == 2 && header.OtoUser1 == userID && header.IsOtorisasi1 {
		return ErrSelfOtorisasi
	}
	return s.repo.SetOtorisasi(ctx, noBukti, level, userID)
}

// CancelOtorisasi clears the flag/user/timestamp for the given level.
// We don't gate this on the existing flag — the handler will check the
// IsBatal permission before calling.
func (s *SKasBankService) CancelOtorisasi(ctx context.Context, noBukti string, level int) error {
	if level != 1 && level != 2 {
		return fmt.Errorf("invalid level %d", level)
	}
	header, err := s.repo.GetByNoBukti(ctx, noBukti)
	if err != nil {
		return err
	}
	if header == nil {
		return ErrNotFound
	}
	return s.repo.CancelOtorisasi(ctx, noBukti, level)
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
		return ErrDoubleEntryUnbalanced
	}
	return nil
}

// buildDetailRow materialises a SDbTransaksi row from a DTO input.
// Urut must already be set by the caller.
func buildDetailRow(noBukti string, urut int, d SDetailInput, tipeTrans string, h *SDbTrans) *SDbTransaksi {
	row := &SDbTransaksi{
		NoBukti:  noBukti,
		Tanggal:  h.Tanggal,
		Perkiraan: d.Perkiraan,
		Lawan:    d.Lawan,
		Debet:    d.Debet,
		Kredit:   d.Kredit,
		Valas:    d.Valas,
		Kurs:     d.Kurs,
		Keterangan: d.Keterangan,
		TipeTrans: tipeTrans,
		TPHC:     d.TPHC,
		Urut:     urut,
		Devisi:   h.Devisi,
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
