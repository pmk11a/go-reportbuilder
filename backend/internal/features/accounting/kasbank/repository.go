// Package kasbank — repository layer for Accounting > Kas Bank.
//
// All persistence is GORM-based; the service layer is the only caller.
// Every method is safe for concurrent use (GORM is by default), and every
// call is wrapped with r.db.WithContext(ctx) so that the request context
// (and the activity-log UserID injected by InjectUserContext) propagates
// to GORM hooks/callbacks.
package kasbank

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/masza1/dapen-backend/internal/features/settings"
	"github.com/masza1/dapen-backend/internal/infrastructure/persistence/models"

	"github.com/masza1/dapen-backend/internal/shared/pagination"
	"gorm.io/gorm"
)

// IKasBankRepository is the persistence contract for the kasbank domain.
// The service layer depends on this interface, never on the concrete
// struct, so unit tests can swap in a mock.
type IKasBankRepository interface {
	// List returns a page of journal headers matching the optional filters
	// in q, plus the total count after applying those filters (pre-pagination).
	List(ctx context.Context, q SListKasBankQuery) ([]SDbTrans, int64, error)
	// GetByNoBukti fetches a single header by primary key. Returns
	// (nil, nil) if not found so the service can produce a 404.
	GetByNoBukti(ctx context.Context, noBukti string) (*SDbTrans, error)
	// InsertHeader persists a new DBTRANS row. MyID is set by the GORM
	// callback (activity log).
	InsertHeader(ctx context.Context, h *SDbTrans) error
	// UpdateHeader overwrites the header (GORM Save) by primary key NoBukti.
	UpdateHeader(ctx context.Context, h *SDbTrans) error
	// DeleteHeader removes the header and cascades to every dependent row
	// in DBTRANSAKSI/DBGIRO/DBDEPOSITO/DBHUTPIUT/DBTempHUTPIUT that
	// references the voucher. The legacy schema has no FK, so we cascade
	// explicitly inside a single transaction:
	//
	//   - DBTRANSAKSI by NoBukti
	//   - DBGIRO by BuktiBuka=NoBukti (when not yet cair)
	//     and BuktiCair=NoBukti (cair only — clear, do not delete)
	//   - DBDEPOSITO by BuktiBuka/BuktiCair (same convention)
	//   - DBHUTPIUT by nobukti=NoBukti
	//   - DBTempHUTPIUT by IDUser+NoBukti staging rows
	//
	// Mirrors FrmKasBank.pas HapusBtnClick (lines 2270–2450).
	DeleteHeader(ctx context.Context, noBukti string) error
	// ListDetail returns all detail rows for a given NoBukti, ordered by Urut ASC.
	ListDetail(ctx context.Context, noBukti string) ([]SDbTransaksi, error)
	// GetDetail fetches a single detail row by composite PK (NoBukti, Urut).
	// Returns (nil, nil) if not found.
	GetDetail(ctx context.Context, noBukti string, urut int) (*SDbTransaksi, error)
	// InsertDetail appends a new detail row. Caller is responsible for
	// picking the Urut value (the service uses max(Urut)+1).
	InsertDetail(ctx context.Context, d *SDbTransaksi) error
	// UpdateDetail overwrites the detail row by composite PK.
	UpdateDetail(ctx context.Context, d *SDbTransaksi) error
	// DeleteDetail removes a single detail row by composite PK.
	DeleteDetail(ctx context.Context, noBukti string, urut int) error
	// SetOtorisasi sets the flag, user and timestamp for the given level.
	// level must be 1 to 5; anything else returns an error.
	SetOtorisasi(ctx context.Context, noBukti string, level int, userID string) error
	// CancelOtorisasi clears the flag, user and timestamp for the given level.
	CancelOtorisasi(ctx context.Context, noBukti string, level int) error
	// GenerateNoBukti atomically reads MAX(NoUrut) from dbTrans for the
	// given tipe group and period, increments it, and returns the formatted
	// voucher number plus the assigned NoUrut.
	//
	// bulan/tahun come from DBPERIODE (user's active period). devisi is the
	// unit code ("Simbol" in the legacy Delphi form).
	//
	// The algorithm matches Delphi's Check_NomorKasBank which queries
	// MAX(NoUrut) from dbTrans directly — NOT from DBNOMOR.NOBKK.
	//
	// Returns: (noBukti string, seq string, "", err error)
	GenerateNoBukti(ctx context.Context, tipe, devisi string, bulan, tahun int) (noBukti, seq, newCounter string, err error)

	// GenerateNoBuktiWithinTx is the transaction-aware variant used by
	// CreateHeader so the number generation and the DBTRANS INSERT
	// happen inside ONE atomic transaction.
	//
	// The caller MUST pass an open *gorm.DB transaction (e.g. `tx` from
	// db.Transaction(...)) — the implementation does NOT open its own
	// transaction. Doing so would cause:
	//
	//   - Counter consumption to leak if the outer transaction rolls back,
	//     producing skipped (loncat) voucher numbers on retry.
	//
	// Inside the passed tx, the implementation queries MAX(NoUrut) from
	// dbTrans (matching Delphi's Check_NomorKasBank), computes the next
	// NoBukti, and returns it — all before the caller inserts DBTRANS.
	// If the insert fails, the entire tx rolls back naturally.
	GenerateNoBuktiWithinTx(ctx context.Context, tx *gorm.DB, tipe, devisi string, bulan, tahun int) (noBukti, seq, newCounter string, err error)

	// GenerateNoBuktiPreview generates the next voucher number WITHOUT
	// committing the counter. Used by the preview endpoint so that merely
	// opening the form does not consume a sequence number.
	GenerateNoBuktiPreview(ctx context.Context, tipe string, bulan, tahun int) (noBukti, seq string, err error)
	// LookupPerkiraan returns DBPERKIRAAN rows whose Perkiraan or Keterangan
	// matches the query substring. When kelompokKas is true the result is
	// restricted to Kelompok in ("1", "2") — the cash/bank groups in the
	// legacy chart-of-accounts.
	LookupPerkiraan(ctx context.Context, query string, kelompokKas bool, limit int) ([]SDbPerkiraan, error)
	// GetPeriode returns the active (bulan, tahun) for the user. Returns
	// (0, 0, nil) when the user has no DBPERIODE row.
	GetPeriode(ctx context.Context, userID string) (bulan int, tahun int, err error)
	// RecalcTotals recomputes a header's TotalD and TotalK by aggregating
	// over its DBTRANSAKSI rows. The legacy schema does not store totals;
	// we recompute on the fly when the service needs them.
	RecalcTotals(ctx context.Context, noBukti string) (totalD, totalK float64, err error)
	// GetAggregateTotals computes totals for multiple NoBukti values in a
	// single query, avoiding N+1 when listing a page of kasbank headers.
	// The returned map only contains entries for NoBukti values that have
	// at least one DBTRANSAKSI row; callers must treat a missing key as
	GetAggregateTotals(ctx context.Context, noBuktis []string) (map[string]SAggregateTotals, error)

	InsertGiro(ctx context.Context, g *models.SDBGIRO) error
	UpdateGiro(ctx context.Context, g *models.SDBGIRO) error
	DeleteGiro(ctx context.Context, noGiro string) error
	InsertDeposito(ctx context.Context, d *models.SDBDEPOSITO) error
	UpdateDeposito(ctx context.Context, d *models.SDBDEPOSITO) error
	DeleteDeposito(ctx context.Context, noDeposito string) error

	// LookupBagian returns DBBAGIAN rows matching the substring query.
	// Used by the Aktiva sub-form's "Bagian (Kode)" lookup, mirroring
	// Delphi FrmSubAktiva.BagianExit (browse 1002).
	LookupBagian(ctx context.Context, query string) ([]models.SDBBAGIAN, error)

	// LookupAkumulasiAktiva returns DBPERKIRAAN rows whose Perkiraan is
	// referenced by DBPOSTHUTPIUT with Kode='AKM'. Used by the Aktiva
	// sub-form's "Akumulasi Penyusutan" lookup.
	LookupAkumulasiAktiva(ctx context.Context, query string) ([]models.SDbPerkiraan, error)

	// LookupBiayaAktiva returns DBPERKIRAAN rows where Tipe=1 (biaya).
	// Used by the Aktiva sub-form's three "Biaya Penyusutan" lookups.
	LookupBiayaAktiva(ctx context.Context, query string) ([]models.SDbPerkiraan, error)

	// GenerateNoUrutAktiva returns the next 5-digit sequence for the
	// Aktiva sub-form's No. Urut input. Mirrors Delphi UrutAktiva().
	GenerateNoUrutAktiva(ctx context.Context, perkiraan, devisi string) (string, error)

	// GenerateNoUrutAktiva2 returns the next 5-digit sub-sequence (for
	// Sub Aktiva). Mirrors Delphi UrutAktiva2().
	GenerateNoUrutAktiva2(ctx context.Context, prefix, devisi string) (string, error)
}

// SAggregateTotals holds per-NoBukti aggregated totals computed from
// DBTRANSAKSI in a single batch query (see GetAggregateTotals).
type SAggregateTotals struct {
	// TotalD is the sum of Debet across all detail lines.
	TotalD float64
	// TotalK is the sum of Kredit across all detail lines.
	TotalK float64
	// JumlahValas is the sum of (Debet+Kredit) for lines whose Valas is
	// not "IDR" — the foreign-currency total.
	JumlahValas float64
	// JumlahRupiah is the sum of (Debet+Kredit)*Kurs across all lines —
	// the Rupiah-converted total.
	JumlahRupiah float64
}

// SKasBankRepository is the GORM-backed implementation of IKasBankRepository.
// The struct name keeps the S-prefix convention from the architecture
// guide; the constructor is exposed as NewSKasBankRepository.
type SKasBankRepository struct {
	db          *gorm.DB
	settingsSvc *settings.Service
}

// NewSKasBankRepository constructs the concrete GORM repository. Caller
// passes the same *gorm.DB used by every other domain and a reference to
// the shared settings.Service (used for voucher-number generation — see
// GenerateNoBukti).
func NewSKasBankRepository(db *gorm.DB, settingsSvc *settings.Service) *SKasBankRepository {
	return &SKasBankRepository{db: db, settingsSvc: settingsSvc}
}

// List applies the optional filters and returns a page of DBTRANS rows.
// Filters: tipe (exact match on TipeTransHd; when blank, restricted to the
// 4 kasbank discriminators BKM/BKK/BBM/BBK — DBTRANS is a legacy table
// shared across modules, so this restriction is always applied, mirroring
// trade-exchange's getAllBankOrKas() "TipeTransHd in (...)" clause), search
// (LIKE on NoBukti and Note), date range (Tanggal BETWEEN). When dateFrom/
// dateTo are both blank, the result defaults to the caller's active
// accounting period (DBPERIODE), resolved via q.UserID. Sort: Tanggal DESC,
// NoBukti DESC (stable across pages).
//
// Implementation note: this method uses raw SQL + ROW_NUMBER() pagination
// (via pagination.PaginatedFind) instead of GORM's chained builder. The
// SQL Server 2008 R2 driver that this project depends on does NOT support
// OFFSET ... FETCH NEXT (SQL Server 2012+), so any chain that includes
// .Limit()/.Offset()/.First()/.Preload() would crash with "Invalid usage
// of the option NEXT in the FETCH statement".
func (r *SKasBankRepository) List(ctx context.Context, q SListKasBankQuery) ([]SDbTrans, int64, error) {
	var items []SDbTrans

	// Build baseSQL + args. Args are passed positionally via Raw() and bound
	// by the sqlserver driver.
	var (
		baseSQL  string
		whereSQL string
		args     []any
	)

	if q.Tipe != "" {
		whereSQL += " AND TipeTransHd = ?"
		args = append(args, q.Tipe)
	} else {
		// No specific tipe requested: still restrict to the 4 kasbank
		// discriminators so this list never leaks unrelated DBTRANS rows
		// (e.g. other journal types stored in the same legacy table).
		whereSQL += " AND TipeTransHd IN (?, ?, ?, ?)"
		args = append(args, TipeBKM, TipeBKK, TipeBBM, TipeBBK)
	}
	if q.Search != "" {
		searchPattern := "%" + q.Search + "%"
		whereSQL += " AND (NoBukti LIKE ? OR Note LIKE ?)"
		args = append(args, searchPattern, searchPattern)
	}
	hasExplicitDate := false
	if q.DateFrom != "" {
		if from, err := parseDateFlexible(q.DateFrom); err == nil {
			whereSQL += " AND Tanggal >= ?"
			args = append(args, from)
			hasExplicitDate = true
		}
	}
	if q.DateTo != "" {
		if to, err := parseDateFlexible(q.DateTo); err == nil {
			whereSQL += " AND Tanggal <= ?"
			args = append(args, to)
			hasExplicitDate = true
		}
	}

	// Default period restriction: when the caller did not pass an explicit
	// date range, mirror trade-exchange's behaviour and scope the list to
	// the user's active accounting period (DBPERIODE).
	// NOTE: We use Tanggal >= startOfMonth AND Tanggal < startOfNextMonth
	// instead of YEAR()/MONTH() functions because function calls on columns
	// prevent SQL Server from using the index (indexed on Tanggal, not on expressions).
	if !hasExplicitDate && q.UserID != "" {
		bulan, tahun, err := r.GetPeriode(ctx, q.UserID)
		if err != nil {
			return nil, 0, fmt.Errorf("resolving active period for user %q: %w", q.UserID, err)
		}
		if bulan != 0 && tahun != 0 {
			// Compute first day of next month for the upper bound
			startOfMonth := time.Date(tahun, time.Month(bulan), 1, 0, 0, 0, 0, time.UTC)
			startOfNextMonth := startOfMonth.AddDate(0, 1, 0)
			whereSQL += " AND Tanggal >= ? AND Tanggal < ?"
			args = append(args, startOfMonth, startOfNextMonth)
		}
	}

	baseSQL = "SELECT * FROM DBTRANS WITH (NOLOCK)"
	if whereSQL != "" {
		baseSQL += " WHERE " + whereSQL[5:]
	}

	page := q.Page
	if page < 1 {
		page = 1
	}
	perPage := q.PerPage
	if perPage < 1 {
		perPage = 10
	}

	orderBy := buildOrderBy(q.SortBy, q.SortDir)
	total, err := pagination.PaginatedFind(r.db.WithContext(ctx), &items, baseSQL, orderBy, page, perPage, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("listing kasbank headers: %w", err)
	}
	return items, total, nil
}

// GetByNoBukti fetches a single header. Returns (nil, nil) when missing so
// the service can map that to a 404 without leaking GORM's error type.
func (r *SKasBankRepository) GetByNoBukti(ctx context.Context, noBukti string) (*SDbTrans, error) {
	var h SDbTrans
	err := pagination.First2008(r.db.WithContext(ctx), &h, "[NoBukti]", func(q *gorm.DB) *gorm.DB {
		return q.Where("NoBukti = ?", noBukti)
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("fetching kasbank header %q: %w", noBukti, err)
	}
	return &h, nil
}

// InsertHeader creates a new DBTRANS row. MyID is set by the GORM
// BeforeCreate hook from the request context's userID.
func (r *SKasBankRepository) InsertHeader(ctx context.Context, h *SDbTrans) error {
	if err := r.db.WithContext(ctx).Create(h).Error; err != nil {
		return fmt.Errorf("inserting kasbank header %q: %w", h.NoBukti, err)
	}
	return nil
}

// UpdateHeader overwrites the header using GORM Save (all columns by PK).
func (r *SKasBankRepository) UpdateHeader(ctx context.Context, h *SDbTrans) error {
	if err := r.db.WithContext(ctx).Save(h).Error; err != nil {
		return fmt.Errorf("updating kasbank header %q: %w", h.NoBukti, err)
	}
	return nil
}

// DeleteHeader removes the header and every dependent row in
// DBTRANSAKSI/DBGIRO/DBDEPOSITO/DBHUTPIUT/DBTempHUTPIUT that references
// the voucher. The legacy schema has no FK, so we cascade explicitly
// inside a single transaction.
//
// Cascade order (legacy Delphi FrmKasBank.pas HapusBtnClick 2270–2450):
//  1. DBTRANSAKSI: DELETE WHERE NoBukti=?
//  2. DBGIRO:     DELETE WHERE BuktiBuka=? AND TglCair IS NULL
//                 AND UPDATE BuktiCair rows — clear cair fields (we keep
//                 the historical giro record)
//  3. DBDEPOSITO: same pattern as GIRO
//  4. DBHUTPIUT:  DELETE WHERE nobukti=?
//  5. DBTempHUTPIUT: DELETE WHERE NoBukti=? (staging per-user rows)
//  6. DBTRANS:    DELETE WHERE NoBukti=? (last — header is the parent)
//
// The SQL Server schema uses BuktiBuka / BuktiCair / urutBuktiBuka /
// urutBuktiCair columns on DBGIRO and DBDEPOSITO. We can't use raw GORM
// joins for the "open giro only" rule because of the legacy column
// shape, so we run explicit SQL inside the same transaction.
func (r *SKasBankRepository) DeleteHeader(ctx context.Context, noBukti string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 1. DBTRANSAKSI cascade — header's detail rows.
		if err := tx.Where("NoBukti = ?", noBukti).Delete(&SDbTransaksi{}).Error; err != nil {
			return fmt.Errorf("cascading delete of details for %q: %w", noBukti, err)
		}

		// 2. DBGIRO. Two distinct cases:
		//    - BuktiBuka = this voucher AND giro is still OPEN
		//      (TglCair IS NULL) → safe to delete.
		//    - BuktiCair = this voucher → giro belongs to an earlier
		//      voucher; clearing the cair fields keeps the buku besar
		//      consistent (mirrors FrmKasBank.pas HapusBtnClick line 2358).
		if err := tx.Exec(
			`DELETE FROM DBGIRO WHERE BuktiBuka = ? AND TglCair IS NULL`,
			noBukti,
		).Error; err != nil {
			return fmt.Errorf("cascading delete of open giro for %q: %w", noBukti, err)
		}
		if err := tx.Exec(
			`UPDATE DBGIRO
				SET BuktiCair = '', urutBuktiCair = 0, TglCair = NULL,
				    Kredit = 0, KreditRp = 0, KeteranganCair = ''
				WHERE BuktiCair = ?`,
			noBukti,
		).Error; err != nil {
			return fmt.Errorf("clearing giro cair link for %q: %w", noBukti, err)
		}

		// 3. DBDEPOSITO — same convention as DBGIRO.
		if err := tx.Exec(
			`DELETE FROM DBDEPOSITO WHERE BuktiBuka = ? AND TglCair IS NULL`,
			noBukti,
		).Error; err != nil {
			return fmt.Errorf("cascading delete of open deposito for %q: %w", noBukti, err)
		}
		if err := tx.Exec(
			`UPDATE DBDEPOSITO
				SET BuktiCair = '', urutBuktiCair = 0, TglCair = NULL,
				    Kredit = 0, KreditRp = 0, KeteranganCair = ''
				WHERE BuktiCair = ?`,
			noBukti,
		).Error; err != nil {
			return fmt.Errorf("clearing deposito cair link for %q: %w", noBukti, err)
		}

		// 4. DBHUTPIUT — staging of sub-ledger settlements.
		// Use LTRIM/RTRIM to handle trailing/leading whitespace that may exist
		// in legacy data where NoBukti was stored with padding (e.g. '00003/BKK/PWT/012023 ').
		if err := tx.Exec(
			`DELETE FROM DBHUTPIUT WHERE LTRIM(RTRIM(nobukti)) = ?`,
			noBukti,
		).Error; err != nil {
			return fmt.Errorf("cascading delete of hutpiut for %q: %w", noBukti, err)
		}

		// 5. DBTempHUTPIUT — per-user staging.
		if err := tx.Exec(
			`DELETE FROM DBTempHUTPIUT WHERE LTRIM(RTRIM(NoBukti)) = ?`,
			noBukti,
		).Error; err != nil {
			return fmt.Errorf("cascading delete of temp hutpiut for %q: %w", noBukti, err)
		}

		// 6. Finally, the header row.
		if err := tx.Where("NoBukti = ?", noBukti).Delete(&SDbTrans{}).Error; err != nil {
			return fmt.Errorf("deleting kasbank header %q: %w", noBukti, err)
		}
		return nil
	})
}

// ListDetail returns all detail rows for a NoBukti, ordered by Urut ASC
// so the UI can render them without re-sorting.
func (r *SKasBankRepository) ListDetail(ctx context.Context, noBukti string) ([]SDbTransaksi, error) {
	var items []SDbTransaksi
	if err := r.db.WithContext(ctx).Where("NoBukti = ?", noBukti).Order("Urut ASC").Find(&items).Error; err != nil {
		return nil, fmt.Errorf("listing kasbank details for %q: %w", noBukti, err)
	}
	return items, nil
}

// GetDetail fetches a single detail row by composite PK.
func (r *SKasBankRepository) GetDetail(ctx context.Context, noBukti string, urut int) (*SDbTransaksi, error) {
	var d SDbTransaksi
	err := pagination.First2008(r.db.WithContext(ctx), &d, "[NoBukti] ASC, [Urut] ASC", func(q *gorm.DB) *gorm.DB {
		return q.Where("NoBukti = ? AND Urut = ?", noBukti, urut)
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("fetching kasbank detail (%q, %d): %w", noBukti, urut, err)
	}
	return &d, nil
}

// InsertDetail appends a new detail row.
//
// Routes through safeCreateByReflection instead of a plain GORM Create, so
// any DBTRANSAKSI columns that exist on the Go model but are missing on a
// legacy DB (currently XSusut, PerlakuanAktiva on the dev environment) are
// transparently omitted from the INSERT. On production (all columns
// present) the call collapses to a normal GORM Create with zero overhead.
//
// This mirrors the protection applied in service.go at line ~481 (full
// voucher Create) and line ~637 (full voucher UpdateHeader): without it,
// a single-row AddDetail that includes Aktiva sub-form fields would fail
// with "Invalid column name 'XSusut'" on the dev DB.
func (r *SKasBankRepository) InsertDetail(ctx context.Context, d *SDbTransaksi) error {
	tx := r.db.WithContext(ctx)
	// Use GORM Create with Omit to exclude columns that may not exist in some database schemas
	// (XSusut and PerlakuanAktiva are optional in legacy DBs; Omit prevents "invalid column name" errors)
	if err := tx.Model(&SDbTransaksi{}).Omit("XSusut", "PerlakuanAktiva").Create(d).Error; err != nil {
		return fmt.Errorf("inserting kasbank detail (%q, %d): %w", d.NoBukti, d.Urut, err)
	}
	return nil
}

// UpdateDetail overwrites a single detail row by composite PK.
// FlagSimbol is always omitted because it is not stored in DBTRANSAKSI.
func (r *SKasBankRepository) UpdateDetail(ctx context.Context, d *SDbTransaksi) error {
	// Omit FlagSimbol, XSusut, and PerlakuanAktiva as these may not exist in all DB schemas
	if err := r.db.WithContext(ctx).Omit("FlagSimbol", "XSusut", "PerlakuanAktiva").Save(d).Error; err != nil {
		return fmt.Errorf("updating kasbank detail (%q, %d): %w", d.NoBukti, d.Urut, err)
	}
	return nil
}

// DeleteDetail removes a single detail row and cascades to DBHUTPIUT
// rows tied to that detail (NoBukti + NoMsk = Urut). Mirrors Delphi
// FrmKasBank.pas HapusBtnClick which deletes the matching hutpiut rows
// before the detail row.
func (r *SKasBankRepository) DeleteDetail(ctx context.Context, noBukti string, urut int) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 1. DBHUTPIUT — sub-ledger entries tied to this detail row.
		// Use LTRIM/RTRIM to handle trailing/leading whitespace that may exist
		// in legacy data (mirrors DeleteHeader cascade).
		if err := tx.Exec(
			`DELETE FROM DBHUTPIUT WHERE LTRIM(RTRIM(nobukti)) = ? AND nomsk = ?`,
			noBukti, urut,
		).Error; err != nil {
			return fmt.Errorf("cascading delete of hutpiut for %q urut=%d: %w", noBukti, urut, err)
		}

		// 2. DBTRANSAKSI — the detail row itself.
		if err := tx.Where("NoBukti = ? AND Urut = ?", noBukti, urut).Delete(&SDbTransaksi{}).Error; err != nil {
			return fmt.Errorf("deleting kasbank detail (%q, %d): %w", noBukti, urut, err)
		}
		return nil
	})
}

// SetOtorisasi sets the IsOtorisasiN flag to 1, OtoUserN to the caller,
// and TglOtoN to now(). We use raw SQL because the column names contain
// the level suffix, which GORM's struct mapping cannot express in a loop.
func (r *SKasBankRepository) SetOtorisasi(ctx context.Context, noBukti string, level int, userID string) error {
	if level < 1 || level > 5 {
		return fmt.Errorf("set otorisasi: invalid level %d (expected 1 to 5)", level)
	}
	col := fmt.Sprintf("IsOtorisasi%d", level)
	userCol := fmt.Sprintf("OtoUser%d", level)
	tglCol := fmt.Sprintf("TglOto%d", level)
	sql := fmt.Sprintf(
		"UPDATE DBTRANS SET %s = 1, %s = ?, %s = ? WHERE NoBukti = ?",
		col, userCol, tglCol,
	)
	if err := r.db.WithContext(ctx).Exec(sql, userID, time.Now(), noBukti).Error; err != nil {
		return fmt.Errorf("setting otorisasi level %d for %q: %w", level, noBukti, err)
	}
	return nil
}

// CancelOtorisasi clears the flag, user and timestamp for the given level.
func (r *SKasBankRepository) CancelOtorisasi(ctx context.Context, noBukti string, level int) error {
	if level < 1 || level > 5 {
		return fmt.Errorf("cancel otorisasi: invalid level %d (expected 1 to 5)", level)
	}
	col := fmt.Sprintf("IsOtorisasi%d", level)
	userCol := fmt.Sprintf("OtoUser%d", level)
	tglCol := fmt.Sprintf("TglOto%d", level)
	sql := fmt.Sprintf(
		"UPDATE DBTRANS SET %s = 0, %s = '', %s = NULL WHERE NoBukti = ?",
		col, userCol, tglCol,
	)
	if err := r.db.WithContext(ctx).Exec(sql, noBukti).Error; err != nil {
		return fmt.Errorf("cancelling otorisasi level %d for %q: %w", level, noBukti, err)
	}
	return nil
}

// GenerateNoBukti delegates to settings.NumberingService.
//
// The DBNOMOR counter read+write is wrapped in a single short transaction
// so concurrent voucher generations cannot claim the same NoBukti or race
// on the counter increment. The new counter is committed to
// DBNOMOR.NOB{jns} (NOBKK/NOBKM/NOBBM/NOBBK depending on `tipe`) inside
// the same transaction — if the commit fails the generated NoBukti is
// discarded by the transaction rollback.
//
// IMPORTANT: This method ONLY handles the counter reservation. It does NOT
// insert into DBTRANS. For the atomic "generate + insert" flow used by
// CreateHeader, use GenerateNoBuktiWithinTx so both ops land in the same
// transaction. This standalone variant remains for endpoints that just
// preview / reserve a number without yet persisting the voucher (the
// `GET /generate-no-bukti` endpoint relies on it).
//
// `devisi` is accepted for backward-compat with the previous signature
// (the legacy FrmKasBank.pas treated "Simbol" / devisi as one of the
// configurable slots). It is not part of the DBNOMOR FORMAT template, so
// the algorithm does not consult it — callers can still log it.
func (r *SKasBankRepository) GenerateNoBukti(ctx context.Context, tipe, devisi string, bulan, tahun int) (noBukti, seq, newCounter string, err error) {
	err = r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		result, errGen := r.settingsSvc.GenerateNoBuktiTx(tx, tipe, tahun, bulan)
		if errGen != nil {
			return errGen
		}
		// CommitCounterTx is now a no-op (counter derived from dbTrans.NoUrut)
		r.settingsSvc.CommitCounterTx(tx, tipe, "")
		noBukti = result.NoBukti
		seq = result.Seq
		return nil
	})
	return noBukti, seq, "", err
}

// GenerateNoBuktiWithinTx runs GenerateNoBuktiTx + CommitCounterTx inside
// the caller's transaction. The caller MUST pass an open *gorm.DB
// transaction (the `tx` yielded by s.db.WithContext(ctx).Transaction(...)).
//
// This is the variant used by CreateHeader — counter increment and DBTRANS
// INSERT share one transaction, so:
//   - If the outer transaction commits, BOTH the new counter and the
//     DBTRANS row become durable.
//   - If it rolls back (e.g. duplicate PK, FK violation), BOTH are
//     discarded — no skipped numbers, no phantom counters.
//   - Concurrent callers contend on UPDLOCK, HOLDLOCK held for the life of
//     the transaction (ROWLOCK would release too early).
//
// `devisi` is accepted for backward-compat — see GenerateNoBukti for the
// rationale on why it is not yet part of the counter computation (Tahap 4).
func (r *SKasBankRepository) GenerateNoBuktiWithinTx(ctx context.Context, tx *gorm.DB, tipe, devisi string, bulan, tahun int) (noBukti, seq, newCounter string, err error) {
	if tx == nil {
		return "", "", "", fmt.Errorf("GenerateNoBuktiWithinTx: tx must not be nil")
	}
	result, errGen := r.settingsSvc.GenerateNoBuktiTx(tx, tipe, tahun, bulan)
	if errGen != nil {
		return "", "", "", fmt.Errorf("generating no-bukti for %s/%d/%d: %w", tipe, tahun, bulan, errGen)
	}
	// CommitCounterTx is now a no-op (counter derived from dbTrans.NoUrut)
	r.settingsSvc.CommitCounterTx(tx, tipe, "")
	return result.NoBukti, result.Seq, "", nil
}

// GenerateNoBuktiPreview generates the next voucher number WITHOUT
// committing the counter. Used by the preview endpoint so that merely
// opening the form does not consume a sequence number.
func (r *SKasBankRepository) GenerateNoBuktiPreview(ctx context.Context, tipe string, bulan, tahun int) (noBukti, seq string, err error) {
	err = r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		result, errGen := r.settingsSvc.GenerateNoBuktiTx(tx, tipe, tahun, bulan)
		if errGen != nil {
			return errGen
		}
		noBukti = result.NoBukti
		seq = result.Seq
		// NOTE: deliberately do NOT call CommitCounterTx here.
		return nil
	})
	return noBukti, seq, err
}

// LookupPerkiraan returns DBPERKIRAAN rows matching the substring search.
// When kelompokKas is true the result is restricted to Kelompok in ("1", "2")
// — the cash/bank groups in the legacy chart-of-accounts. limit caps the
// result count; 0 means "no cap" (we use 50 as a sane default).
//
// Implementation note: SQL Server 2008-compatible TOP-N via raw SQL.
// .Limit() on GORM's chained builder emits OFFSET ... FETCH NEXT (SQL Server
// 2012+), which the project database rejects.
func (r *SKasBankRepository) LookupPerkiraan(ctx context.Context, query string, kelompokKas bool, limit int) ([]SDbPerkiraan, error) {
	if limit <= 0 {
		limit = 50
	}

	var (
		whereSQL string
		args     []any
	)
	if query != "" {
		pattern := "%" + query + "%"
		whereSQL += " AND (Perkiraan LIKE ? OR Keterangan LIKE ?)"
		args = append(args, pattern, pattern)
	}
	if kelompokKas {
		whereSQL += " AND Kelompok IN (?, ?)"
		args = append(args, "1", "2")
	}

	// Explicit column list (instead of SELECT *) so that the int-typed legacy
	// columns FlagCashFlow / IsPPN never reach GORM's scanner as a raw string.
	// SQL Server stores empty-string ('') values in some rows; COALESCE maps
	// them to 0 which scans cleanly into Go int fields.
	//
	// The "WHERE 1=1" anchor lets whereSQL keep its leading " AND ..." tokens
	// without producing invalid SQL like "FROM DBPERKIRAAN AND (...)".
	sql := `SELECT TOP (?) [Perkiraan], [Kelompok], [Tipe], [DK], [Valas], [KodeAK], [KodeSAK],
		[Keterangan], [Simbol],
		CAST(COALESCE(NULLIF(CAST([FlagCashFlow] AS VARCHAR(50)), ''), '0') AS INT) AS FlagCashFlow,
		[Neraca],
		CAST(COALESCE(NULLIF(CAST([IsPPN] AS VARCHAR(50)), ''), '0') AS INT) AS IsPPN,
		[GroupPerkiraan], [Lokasi], [MyID] FROM DBPERKIRAAN WHERE 1=1` + whereSQL + " ORDER BY Perkiraan ASC"
	args = append(args, limit)

	var rows []SDbPerkiraan
	if err := r.db.WithContext(ctx).Raw(sql, args...).Scan(&rows).Error; err != nil {
		return nil, fmt.Errorf("looking up perkiraan (query=%q, kelompokKas=%v): %w", query, kelompokKas, err)
	}
	return rows, nil
}

// GetPeriode returns the active accounting period for the user. The
// service layer is the only consumer.
func (r *SKasBankRepository) GetPeriode(ctx context.Context, userID string) (int, int, error) {
	return GetCurrentPeriode(ctx, r.db, userID)
}

// RecalcTotals aggregates Debet and Kredit across DBTRANSAKSI for the
// given NoBukti. The legacy schema does not store totals; we recompute
// on the fly when the service needs them (after detail mutations).
func (r *SKasBankRepository) RecalcTotals(ctx context.Context, noBukti string) (float64, float64, error) {
	type totals struct {
		TotalD float64
		TotalK float64
	}
	var t totals
	err := r.db.WithContext(ctx).Raw(
		"SELECT COALESCE(SUM(Debet), 0) AS TotalD, COALESCE(SUM(Kredit), 0) AS TotalK FROM DBTRANSAKSI WHERE NoBukti = ?",
		noBukti,
	).Scan(&t).Error
	if err != nil {
		return 0, 0, fmt.Errorf("recalculating totals for %q: %w", noBukti, err)
	}
	return t.TotalD, t.TotalK, nil
}

// GetAggregateTotals computes TotalD/TotalK/JumlahValas/JumlahRupiah for
// multiple NoBukti values in a single GROUP BY query, so listing a page of
// N kasbank headers issues exactly one aggregate query instead of N.
// Returns an empty map (not an error) when noBuktis is empty — we never
// issue a query with an empty IN (...) clause.
func (r *SKasBankRepository) GetAggregateTotals(ctx context.Context, noBuktis []string) (map[string]SAggregateTotals, error) {
	result := make(map[string]SAggregateTotals, len(noBuktis))
	if len(noBuktis) == 0 {
		return result, nil
	}

	type row struct {
		NoBukti      string
		TotalD       float64
		TotalK       float64
		JumlahValas  float64
		JumlahRupiah float64
	}
	var rows []row
	err := r.db.WithContext(ctx).Raw(
		`SELECT NoBukti,
			COALESCE(SUM(Debet), 0) AS TotalD,
			COALESCE(SUM(Kredit), 0) AS TotalK,
			COALESCE(SUM(CASE WHEN Valas <> 'IDR' THEN Debet + Kredit ELSE 0 END), 0) AS JumlahValas,
			COALESCE(SUM((Debet + Kredit) * Kurs), 0) AS JumlahRupiah
		FROM DBTRANSAKSI
		WHERE NoBukti IN (?)
		GROUP BY NoBukti`,
		noBuktis,
	).Scan(&rows).Error
	if err != nil {
		return nil, fmt.Errorf("aggregating totals for %d voucher(s): %w", len(noBuktis), err)
	}

	for _, rw := range rows {
		result[rw.NoBukti] = SAggregateTotals{
			TotalD:       rw.TotalD,
			TotalK:       rw.TotalK,
			JumlahValas:  rw.JumlahValas,
			JumlahRupiah: rw.JumlahRupiah,
		}
	}
	return result, nil
}

// parseDateFlexible accepts either RFC3339 ("2026-06-07T00:00:00Z") or
// the YYYY-MM-DD form the frontend prefers. Returns time.UTC midnight.
func parseDateFlexible(s string) (time.Time, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return time.Time{}, fmt.Errorf("empty date")
	}
	if t, err := time.Parse(time.RFC3339, s); err == nil {
		return t, nil
	}
	if t, err := time.Parse("2006-01-02", s); err == nil {
		return t, nil
	}
	return time.Time{}, fmt.Errorf("unrecognised date format: %q", s)
}

// buildOrderBy returns a safe ORDER BY clause built from a whitelist of
// sortable columns. Anything outside the whitelist falls back to the
// default "Tanggal DESC, NoBukti DESC" so a malicious query string cannot
// inject SQL.
func buildOrderBy(sortBy, sortDir string) string {
	allowed := map[string]bool{
		"Tanggal":     true,
		"NoBukti":     true,
		"TipeTransHd": true,
		"Note":        true,
	}
	col := "Tanggal"
	if allowed[sortBy] {
		col = sortBy
	}
	dir := "DESC"
	if strings.EqualFold(sortDir, "asc") {
		dir = "ASC"
	}
	return fmt.Sprintf("%s %s, NoBukti DESC", col, dir)
}

func (r *SKasBankRepository) InsertGiro(ctx context.Context, g *models.SDBGIRO) error {
	return r.db.WithContext(ctx).Create(g).Error
}

func (r *SKasBankRepository) UpdateGiro(ctx context.Context, g *models.SDBGIRO) error {
	return r.db.WithContext(ctx).Save(g).Error
}

func (r *SKasBankRepository) DeleteGiro(ctx context.Context, noGiro string) error {
	return r.db.WithContext(ctx).Where("NoGiro = ?", noGiro).Delete(&models.SDBGIRO{}).Error
}

func (r *SKasBankRepository) InsertDeposito(ctx context.Context, d *models.SDBDEPOSITO) error {
	return r.db.WithContext(ctx).Create(d).Error
}

func (r *SKasBankRepository) UpdateDeposito(ctx context.Context, d *models.SDBDEPOSITO) error {
	return r.db.WithContext(ctx).Save(d).Error
}

func (r *SKasBankRepository) DeleteDeposito(ctx context.Context, noDeposito string) error {
	return r.db.WithContext(ctx).Where("NoDeposito = ?", noDeposito).Delete(&models.SDBDEPOSITO{}).Error
}

// LookupBagian returns DBBAGIAN rows whose KodeBag or NamaBag contains the
// query substring. Used by the Aktiva sub-form's "Bagian (Kode)" field —
// mirrors Delphi FrmSubAktiva.BagianExit which opens browse 1002.
//
// SQL Server 2008 R2: uses TOP-N via a parameter rather than OFFSET/FETCH
// (which the legacy DB does not understand).
func (r *SKasBankRepository) LookupBagian(ctx context.Context, query string) ([]models.SDBBAGIAN, error) {
	var (
		whereSQL string
		args     []any
	)
	if query != "" {
		whereSQL = " AND ([KodeBag] LIKE ? OR [NamaBag] LIKE ?)"
		pattern := "%" + query + "%"
		args = append(args, pattern, pattern)
	}
	sql := `SELECT TOP 50 [KodeBag], [NamaBag], [Perkiraan], [Biaya], [BiayaJasaKom], [BiayaJasaAlat]
	        FROM DBBAGIAN WHERE 1=1` + whereSQL + ` ORDER BY [KodeBag] ASC`
	var rows []models.SDBBAGIAN
	if err := r.db.WithContext(ctx).Raw(sql, args...).Scan(&rows).Error; err != nil {
		return nil, fmt.Errorf("looking up bagian (query=%q): %w", query, err)
	}
	return rows, nil
}

// LookupAkumulasiAktiva returns DBPERKIRAAN rows referenced from
// DBPOSTHUTPIUT WHERE Kode='AKM'. Mirrors FrmSubAktiva.AkSusutExit which
// fires the SQL:
//
//   SELECT a.*, b.Keterangan
//   FROM dbposthutpiut a, dbperkiraan b
//   WHERE a.perkiraan = b.perkiraan AND a.perkiraan = :0 AND a.Kode = 'AKM'
func (r *SKasBankRepository) LookupAkumulasiAktiva(ctx context.Context, query string) ([]models.SDbPerkiraan, error) {
	var (
		whereSQL string
		args     []any
	)
	if query != "" {
		whereSQL = " AND (b.[Perkiraan] LIKE ? OR b.[Keterangan] LIKE ?)"
		pattern := "%" + query + "%"
		args = append(args, pattern, pattern)
	}
	sql := `SELECT TOP 50 b.[Perkiraan], b.[Kelompok], b.[Tipe], b.[DK], b.[Valas],
	        b.[KodeAK], b.[KodeSAK], b.[Keterangan], b.[Simbol],
	        CAST(COALESCE(NULLIF(CAST(b.[FlagCashFlow] AS VARCHAR(50)), ''), '0') AS INT) AS FlagCashFlow,
	        b.[Neraca],
	        CAST(COALESCE(NULLIF(CAST(b.[IsPPN] AS VARCHAR(50)), ''), '0') AS INT) AS IsPPN,
	        b.[GroupPerkiraan], b.[Lokasi], b.[MyID]
	        FROM DBPOSTHUTPIUT a
	        INNER JOIN DBPERKIRAAN b ON b.[Perkiraan] = a.[Perkiraan]
	        WHERE a.[Kode] = 'AKM'` + whereSQL + ` ORDER BY b.[Perkiraan] ASC`
	var rows []models.SDbPerkiraan
	if err := r.db.WithContext(ctx).Raw(sql, args...).Scan(&rows).Error; err != nil {
		return nil, fmt.Errorf("looking up akumulasi aktiva (query=%q): %w", query, err)
	}
	return rows, nil
}

// LookupBiayaAktiva returns DBPERKIRAAN rows where Tipe='1' (biaya/expense
// accounts). Mirrors FrmSubAktiva.BiayaSusutExit / BiayaSusut2Exit /
// BiayaSusut3Exit, all of which open browse 1005 with the same constraint:
//
//   SELECT * FROM dbperkiraan WHERE perkiraan = :0 AND tipe = 1
func (r *SKasBankRepository) LookupBiayaAktiva(ctx context.Context, query string) ([]models.SDbPerkiraan, error) {
	var (
		whereSQL string
		args     []any
	)
	if query != "" {
		whereSQL = " AND ([Perkiraan] LIKE ? OR [Keterangan] LIKE ?)"
		pattern := "%" + query + "%"
		args = append(args, pattern, pattern)
	}
	// Tipe column is int in the DBPERKIRAAN model; bind the value as int so
	// SQL Server gets the right type and indexes (if any) are used.
	args = append(args, 1)
	sql := `SELECT TOP 50 [Perkiraan], [Kelompok], [Tipe], [DK], [Valas], [KodeAK], [KodeSAK],
	        [Keterangan], [Simbol],
	        CAST(COALESCE(NULLIF(CAST([FlagCashFlow] AS VARCHAR(50)), ''), '0') AS INT) AS FlagCashFlow,
	        [Neraca],
	        CAST(COALESCE(NULLIF(CAST([IsPPN] AS VARCHAR(50)), ''), '0') AS INT) AS IsPPN,
	        [GroupPerkiraan], [Lokasi], [MyID] FROM DBPERKIRAAN WHERE 1=1` + whereSQL + ` AND [Tipe] = ? ORDER BY [Perkiraan] ASC`
	var rows []models.SDbPerkiraan
	if err := r.db.WithContext(ctx).Raw(sql, args...).Scan(&rows).Error; err != nil {
		return nil, fmt.Errorf("looking up biaya aktiva (query=%q): %w", query, err)
	}
	return rows, nil
}

// GenerateNoUrutAktiva returns the next 5-digit counter for a (perkiraan,
// devisi) pair. It counts existing rows in DBAKTIVA whose Perkiraan (prefix)
// matches the supplied account code, then returns count+1 zero-padded to 5.
//
// Mirrors Delphi `UrutAktiva(perkiraan, devisi, 5)` in MyProcedure.pas.
// We do NOT persist a counter row here — the DBAKTIVA.NoBelakang is the
// sequence of last write, just like the legacy form reads it.
func (r *SKasBankRepository) GenerateNoUrutAktiva(ctx context.Context, perkiraan, devisi string) (string, error) {
	if perkiraan == "" {
		return "", fmt.Errorf("perkiraan is required to generate NoUrut")
	}
	var count int64
	if err := r.db.WithContext(ctx).
		Raw(`SELECT COUNT(*) FROM DBAKTIVA WHERE [Perkiraan] = ? AND [Devisi] = ?`,
			perkiraan, devisi).
		Scan(&count).Error; err != nil {
		return "", fmt.Errorf("counting aktiva for NoUrut (perkiraan=%q, devisi=%q): %w", perkiraan, devisi, err)
	}
	next := count + 1
	// 5-digit zero-pad, e.g. "00001", "00042"
	return fmt.Sprintf("%05d", next), nil
}

// GenerateNoUrutAktiva2 returns the next 5-digit counter for a sub-aktiva.
// `prefix` is the parent KodeAktiva (e.g. "1111.1.00001"). The function
// matches DBAKTIVA rows by prefix-on-[NoAktivaHd].
//
// Mirrors Delphi `UrutAktiva2(perkiraan+'.'+nourut, devisi, 5)`.
func (r *SKasBankRepository) GenerateNoUrutAktiva2(ctx context.Context, prefix, devisi string) (string, error) {
	if prefix == "" {
		return "", fmt.Errorf("prefix is required to generate NoUrut2")
	}
	pattern := prefix + "%"
	var count int64
	if err := r.db.WithContext(ctx).
		Raw(`SELECT COUNT(*) FROM DBAKTIVA WHERE [NoAktivaHd] LIKE ? AND [Devisi] = ?`,
			pattern, devisi).
		Scan(&count).Error; err != nil {
		return "", fmt.Errorf("counting sub-aktiva for NoUrut2 (prefix=%q, devisi=%q): %w", prefix, devisi, err)
	}
	next := count + 1
	return fmt.Sprintf("%05d", next), nil
}
