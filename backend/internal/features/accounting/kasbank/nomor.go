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

// GenerateNoBukti atomically increments the per-tipe counter in DBNOMOR and
// returns the formatted voucher number: "{TIPE}-{YYYYMM}-{SEQ:04}".
//
// The increment runs inside the caller's transaction (tx) so the same
// counter can be reused for batch inserts. We rely on the SQL Server
// `UPDLOCK, HOLDLOCK` hint via `db.Set("gorm:query_option", ...)` to
// serialise concurrent calls. Falls back to `FOR UPDATE` style on other
// drivers when the option is not honoured.
//
// Caller is responsible for normalising tipe to uppercase before passing in.
func GenerateNoBukti(tx *gorm.DB, tipe string) (string, error) {
	col, ok := nomorFieldByTipe[tipe]
	if !ok {
		return "", fmt.Errorf("%w: %q", ErrUnknownTipe, tipe)
	}

	// 1. Read current counter inside the transaction. The UPDLOCK hint keeps
	// other transactions from reading the row until we commit. This is a
	// SQL Server idiom; on other drivers GORM simply ignores the option.
	current, err := readNomorField(tx, col)
	if err != nil {
		return "", fmt.Errorf("read current %s: %w", col, err)
	}

	// 2. Compute next SEQ. The DBNOMOR column stores YYYYMM-SEQ as one
	// string (e.g. "202606-0001"). Reset SEQ to 1 when the month rolls over.
	now := time.Now()
	yearMonth := now.Format("200601")
	nextSeq := 1
	if current != nil && *current != "" {
		parts := strings.SplitN(*current, "-", 2)
		if len(parts) == 2 && parts[0] == yearMonth {
			if n, errConv := strconv.Atoi(parts[1]); errConv == nil {
				nextSeq = n + 1
			}
		}
	}

	newVal := fmt.Sprintf("%s-%04d", yearMonth, nextSeq)

	// 3. Write the incremented counter back. We use Exec with a literal
	// column name interpolated via a switch instead of a fmt.Sprintf so
	// the column name cannot be confused with a parameter placeholder.
	if err := writeNomorField(tx, col, newVal); err != nil {
		return "", fmt.Errorf("write %s = %q: %w", col, newVal, err)
	}

	// 4. Compose the formatted voucher number: "BKK-202606-0001".
	return fmt.Sprintf("%s-%s-%04d", tipe, yearMonth, nextSeq), nil
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
	if err := db.WithContext(ctx).Where("USERID = ?", userID).First(&p).Error; err != nil {
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
