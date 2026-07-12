// Package kasbank — voucher-number generation and per-user active period lookup.
//
// The voucher number is delegated to settings.NumberingService so the
// algorithm (FORMAT1..4 / PEMISAH / Reset / ALIAS / counter increment) is
// shared with any other feature that needs auto-numbered documents
// (procurement, production, util, etc.) — see SGenerateNoBukti at the
// bottom of this file for the kasbank-specific transaction wrapper.
//
// Numbering model (shared, lives in internal/features/settings):
//
//   - 4-slot template (FORMAT1..4) with codes
//     {ALIAS, KODE_TRANSAKSI, MMYY, MMYYYY, NOMOR_URUT, YYMM, YYYYMM}.
//   - Separator between slots (PEMISAH): ':' / '-' / '/' / ' ' / '.'.
//   - Counter: DBNOMOR.NOB{jns} per transaction type (NOBKK, NOBKM,
//     NOBBM, NOBBK, …) stored as "<YYYYMM><sep><NNNN>".
//   - Reset (Reset column): 0 = monthly, 1 = yearly, anything else = never.
//
// bulan/tahun come from DBPERIODE (the user's active accounting period),
// NOT time.Now() — the user may post journals dated in their active period
// even on a different calendar day.
package kasbank

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/masza1/dapen-backend/internal/infrastructure/persistence/models"
	"github.com/masza1/dapen-backend/internal/shared/pagination"
	"gorm.io/gorm"
)

// ErrUnknownTipe is returned by SGenerateNoBukti when the discriminator is
// not one of the four accepted values. The caller is expected to translate
// this to a 400 Bad Request at the HTTP boundary.
var ErrUnknownTipe = errors.New("unknown tipe voucher")

// SDBNomorConfig is the subset of DBNOMOR used by the voucher-number generator.
//
// Deprecated: prefer settings.NumberingService / SGenerateNoBukti for new
// code. Kept for backward-compat with callers that only need the
// non-counter settings (PEMISAH/Reset/DigitNomor).
type SDBNomorConfig struct {
	Pemisah    *int
	DigitNomor *string
	Reset      *int
}

// ReadDBNomorConfig loads the (single-row) DBNOMOR settings table. Returns
// a value with all-nil fields when the table has no row, leaving the
// caller to apply defaults (separator='/', digit="00000", reset=monthly).
//
// Deprecated: prefer settings.NumberingService.ReadNomorFull for new code.
func ReadDBNomorConfig(tx *gorm.DB) (SDBNomorConfig, error) {
	var cfg SDBNomorConfig
	querySQL := `SELECT [PEMISAH], [DigitNomor], [Reset] FROM DBNOMOR WITH (UPDLOCK, HOLDLOCK)`
	row := tx.Raw(querySQL).Row()
	if row == nil {
		return cfg, nil
	}
	var digitNomor *string
	if err := row.Scan(&cfg.Pemisah, &digitNomor, &cfg.Reset); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) || strings.Contains(err.Error(), "no rows") {
			return SDBNomorConfig{}, nil
		}
		return cfg, err
	}
	cfg.DigitNomor = digitNomor
	return cfg, nil
}

// ReadDBNomorFull loads the entire DBNOMOR row with a UPDLOCK/HOLDLOCK so
// concurrent callers cannot read a stale counter / format layout. Returns
// (nil, nil) when DBNOMOR has no row — callers must apply defaults.
//
// Deprecated: prefer settings.NumberingService.ReadNomorFull for new code.
func ReadDBNomorFull(tx *gorm.DB) (*models.SDBNOMOR, error) {
	var n models.SDBNOMOR
	err := tx.Raw(`SELECT * FROM DBNOMOR WITH (UPDLOCK, HOLDLOCK)`).Scan(&n).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) || strings.Contains(err.Error(), "no rows") {
			return nil, nil
		}
		return nil, err
	}
	return &n, nil
}

// ResetMonthly reports whether the sequence should reset every month.
// Defaults to true (Reset=0) when the column is nil.
func (c SDBNomorConfig) ResetMonthly() bool {
	if c.Reset == nil {
		return true
	}
	return *c.Reset == 0
}

// DigitNomorStr returns the DigitNomor string with a "00000" fallback.
func (c SDBNomorConfig) DigitNomorStr() string {
	if c.DigitNomor == nil || strings.TrimSpace(*c.DigitNomor) == "" {
		return "00000"
	}
	return *c.DigitNomor
}

// PemisahChar decodes the integer separator code from DBNOMOR.PEMISAH into
// its corresponding character.
//
// Pemisah codes match trade-exchange Laravel + the DAPEN extension:
//
//	0 → ':' | 1 → '-' | 2 → '/' | 3 → ' ' | 4 → '.' (DAPEN extension)
//
// Deprecated: prefer settings.NumberingService.PemisahChar for new code.
func PemisahChar(code int) string {
	switch code {
	case 0:
		return ":"
	case 1:
		return "-"
	case 2:
		return "/"
	case 3:
		return " "
	case 4:
		return "."
	default:
		return "/"
	}
}

// DecodePemisah returns the separator character for a given *int pemisah value.
// If the pointer is nil (no DBNOMOR row yet), defaults to '/' (code 2 —
// the legacy KasBank default).
func DecodePemisah(p *int) string {
	if p == nil {
		return "/"
	}
	return PemisahChar(*p)
}

// tipeKasGroup returns the SQL fragment matching the Kas vs Bank group:
// BKM/BKK → ('BKK','BKM'), BBM/BBK → ('BBK','BBM').
//
// Deprecated: kept only for the test mock expectations on DBTRANS-style
// sequencing, which the new algorithm no longer uses.
func tipeKasGroup(tipe string) (string, error) {
	switch tipe {
	case TipeBKM, TipeBKK:
		return "TipeTransHd IN ('BKK','BKM')", nil
	case TipeBBM, TipeBBK:
		return "TipeTransHd IN ('BBK','BBM')", nil
	default:
		return "", fmt.Errorf("%w: %q", ErrUnknownTipe, tipe)
	}
}

// counterColumnForTipe returns the DBNOMOR column name that stores the
// running counter for the given transaction type. The columns are
// NOBKK, NOBKM, NOBBM, NOBBK (one per tipe).
func counterColumnForTipe(tipe string) (string, error) {
	switch tipe {
	case TipeBKK:
		return "NOBKK", nil
	case TipeBKM:
		return "NOBKM", nil
	case TipeBBM:
		return "NOBBM", nil
	case TipeBBK:
		return "NOBBK", nil
	default:
		return "", fmt.Errorf("%w: %q", ErrUnknownTipe, tipe)
	}
}

// PersistCounter writes the new counter back to DBNOMOR.NOB{jns}. The
// caller MUST hold the transaction's UPDLOCK on DBNOMOR (acquired via
// ReadDBNomorFull) so concurrent calls serialise correctly.
//
// The UPDATE is whitelisted on the column name to prevent SQL injection —
// counterColumnForTipe returns one of {"NOBKK","NOBKM","NOBBM","NOBBK"}.
//
// Deprecated: prefer settings.NumberingService.PersistCounter for new code.
func PersistCounter(tx *gorm.DB, tipe string, newCounter string) error {
	col, errCol := counterColumnForTipe(tipe)
	if errCol != nil {
		return errCol
	}
	sql := fmt.Sprintf("UPDATE DBNOMOR SET [%s] = ?", col)
	if err := tx.Exec(sql, newCounter).Error; err != nil {
		return fmt.Errorf("persisting counter to DBNOMOR.%s: %w", col, err)
	}
	return nil
}

// ReadCounterColumn returns the current value of DBNOMOR.NOB{jns} as a
// string. Returns "" when the column is NULL or DBNOMOR is empty.
//
// Deprecated: prefer settings.NumberingService.ReadCounter for new code.
func ReadCounterColumn(tx *gorm.DB, tipe string) (string, error) {
	col, errCol := counterColumnForTipe(tipe)
	if errCol != nil {
		return "", errCol
	}
	sql := fmt.Sprintf("SELECT [%s] FROM DBNOMOR", col)
	var val *string
	row := tx.Raw(sql).Row()
	if row == nil {
		return "", nil
	}
	if err := row.Scan(&val); err != nil {
		return "", fmt.Errorf("reading DBNOMOR.%s: %w", col, err)
	}
	if val == nil {
		return "", nil
	}
	return *val, nil
}

// GetCurrentPeriode returns the active accounting period (BULAN, TAHUN) for
// the given user, read from DBPERIODE. Returns (0, 0, nil) if the user has
// no row in DBPERIODE; the service layer decides how to treat that (today:
// "no period set" → reject all journal postings).
func GetCurrentPeriode(ctx context.Context, db *gorm.DB, userID string) (bulan int, tahun int, err error) {
	var p SDbPeriode
	if err := pagination.First2008(db.WithContext(ctx), &p, "[USERID]", func(q *gorm.DB) *gorm.DB {
		return q.Where("USERID = ?", userID)
	}); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return 0, 0, nil
		}
		return 0, 0, fmt.Errorf("fetching active period for user %q: %w", userID, err)
	}
	bulan, _ = strconv.Atoi(strings.TrimSpace(p.BULAN))
	tahun, _ = strconv.Atoi(strings.TrimSpace(p.TAHUN))
	return bulan, tahun, nil
}

// TanggalInPeriode returns true when the given tanggal falls inside the
// (bulan, tahun) period. A zero period (no row in DBPERIODE) rejects all
// dates — the service layer translates that to a 400 Bad Request.
func TanggalInPeriode(tanggal time.Time, bulan, tahun int) bool {
	if bulan == 0 || tahun == 0 {
		return false
	}
	return int(tanggal.Month()) == bulan && tanggal.Year() == tahun
}
