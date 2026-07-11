// Package kasbank — voucher-number generation and per-user active period lookup.
//
// The legacy schema stores per-document-type counters in DBNOMOR: a single
// row that has many NOxxx string fields (NOBKM, NOBKK, NOBBM, NOBBK, ...).
// Each field holds the last-used sequence number for that document type.
//
// GenerateNoBukti takes a writer transaction and a tipe, locks the DBNOMOR row,
// reads + increments the relevant column, and returns a formatted voucher
// number like "BKK-202606-0001". The "0001" suffix is the per-month sequence
// reset — we always read+write the full YYYYMM+SEQ string instead of an int.
package kasbank

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/masza1/dapen-backend/internal/shared/pagination"
	"gorm.io/gorm"
)

// Field mapping from discriminator to DBNOMOR column name. Adding a new
// voucher type means adding a new column to DBNOMOR (and a new case here).
var nomorFieldByTipe = map[string]string{
	TipeBKM: "NOBKM",
	TipeBKK: "NOBKK",
	TipeBBM: "NOBBM",
	TipeBBK: "NOBBK",
}

// ErrUnknownTipe is returned by GenerateNoBukti when the discriminator is
// not one of the four accepted values. The caller is expected to translate
// this to a 400 Bad Request at the HTTP boundary.
var ErrUnknownTipe = errors.New("unknown tipe voucher")

// PemisahChar decodes the integer separator code from DBNOMOR.PEMISAH into
// its corresponding character.
//
// Pemisah codes match trade-exchange Laravel:
//
//	0 → ':' | 1 → '-' | 2 → '/' | 3 → ' ' (space)
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
	default:
		return "-"
	}
}

// DecodePemisah returns the separator character for a given *int pemisah value.
// If the pointer is nil (no DBNOMOR row yet), defaults to '-' (code 1).
func DecodePemisah(p *int) string {
	if p == nil {
		return "-"
	}
	return PemisahChar(*p)
}

// GenerateNoBukti reads the per-tipe counter from DBNOMOR, increments it, and
// returns a formatted voucher number such as "BKK/202606/0001".
//
// The separator between YYYYMM and SEQ is taken from DBNOMOR.PEMISAH
// (decoded to ':', '-', '/', ' '). The separator between TIPE and YYYYMM is
// always '-'. The increment runs inside the caller's transaction (tx) so the
// same counter can be reused for batch inserts.
//
// Caller is responsible for normalising tipe to uppercase before passing in.
func GenerateNoBukti(tx *gorm.DB, tipe string, pemisahCfg *int) (string, error) {
	col, ok := nomorFieldByTipe[tipe]
	if !ok {
		return "", fmt.Errorf("%w: %q", ErrUnknownTipe, tipe)
	}

	sep := DecodePemisah(pemisahCfg)

	// 1. Read current counter inside the transaction.
	current, err := readNomorField(tx, col)
	if err != nil {
		return "", fmt.Errorf("read current %s: %w", col, err)
	}

	// 2. Compute next SEQ. The DBNOMOR column stores YYYYMM<SEP>SEQ as one
	// string (e.g. "202606-0001" or "202606/0001"). Reset SEQ to 1 when the
	// month rolls over.
	now := time.Now()
	yearMonth := now.Format("200601")
	nextSeq := 1
	if current != nil && *current != "" {
		parts := strings.SplitN(*current, sep, 2)
		if len(parts) == 2 && parts[0] == yearMonth {
			if n, errConv := strconv.Atoi(parts[1]); errConv == nil {
				nextSeq = n + 1
			}
		}
	}

	newVal := fmt.Sprintf("%s%s%04d", yearMonth, sep, nextSeq)

	// 3. Write the incremented counter back.
	if err := writeNomorField(tx, col, newVal); err != nil {
		return "", fmt.Errorf("write %s = %q: %w", col, newVal, err)
	}

	// 4. Compose the formatted voucher number: "BKK/202606/0001"
	//    TIPE uses '-' as a fixed prefix separator for backward compat.
	return fmt.Sprintf("%s%s%s%s%04d", tipe, sep, yearMonth, sep, nextSeq), nil
}

// readNomorField returns the current string value of a DBNOMOR column.
// On an empty/nil column the pointer is nil and the caller treats it as 0.
func readNomorField(tx *gorm.DB, column string) (*string, error) {
	var val *string
	sql := fmt.Sprintf(
		"SELECT [%s] FROM DBNOMOR WITH (UPDLOCK, HOLDLOCK)",
		column,
	)
	if err := tx.Raw(sql).Scan(&val).Error; err != nil {
		return nil, err
	}
	return val, nil
}

// writeNomorField updates a single DBNOMOR column with a new string value.
// DBNOMOR is keyed implicitly (single-row configuration), so the UPDATE has
// no WHERE clause beyond "row exists".
func writeNomorField(tx *gorm.DB, column, value string) error {
	sql := fmt.Sprintf("UPDATE DBNOMOR SET [%s] = ?", column)
	return tx.Exec(sql, value).Error
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
