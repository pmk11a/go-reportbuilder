// Package kasbank owns the Accounting > Kas Bank sub-domain: BKM/BKK/BBM/BBK
// journal voucher recording with two-level authorization workflow.
//
// All legacy table models are re-exported here so the kasbank code is fully
// isolated from `infrastructure/persistence/models/`. Per the Domain-Based +
// DDD-Lite rule, the owning domain exposes the entities it needs rather than
// reaching into a global models package.
package kasbank

import (
	"time"

	"github.com/masza1/dapen-backend/internal/infrastructure/persistence/models"
)

// Re-exports of legacy table models. Type aliases are intentional: handlers
// and services refer to these by name without re-implementing GORM tags.
type (
	// SDbTrans is a row in the DBTRANS table (journal header).
	SDbTrans = models.SDBTRANS
	// SDbTransaksi is a row in the DBTRANSAKSI table (journal detail line).
	SDbTransaksi = models.SDBTRANSAKSI
	// SDbPerkiraan is a row in the DBPERKIRAAN table (chart-of-accounts master).
	SDbPerkiraan = models.SDbPerkiraan
	// SDbNomor is a row in the DBNOMOR table (per-document-type number generator).
	SDbNomor = models.SDBNOMOR
	// SDbPeriode is a row in the DBPERIODE table (per-user active accounting period).
	SDbPeriode = models.DBPeriode
)

// SKasBankHeader is a domain view-model for a journal header enriched with
// pre-computed summary fields (TotalD = total debit, TotalK = total credit).
// The repository layer can populate this when joining DBTRANS with an aggregate
// query on DBTRANSAKSI; the service layer assembles it from raw rows otherwise.
type SKasBankHeader struct {
	// NoBukti is the primary key of DBTRANS.
	NoBukti string `json:"nobukti"`
	// Tanggal is the journal voucher date.
	Tanggal *time.Time `json:"tanggal"`
	// Note is the free-text header note (max 500 chars).
	Note string `json:"note"`
	// TipeTransHd is the discriminator: BKM, BKK, BBM, BBK.
	TipeTransHd *string `json:"tipetranshd"`
	// PerkiraanHd is the header-level account code (cash/bank account).
	PerkiraanHd *string `json:"perkiraanhd"`
	// TotalD is the sum of Debet across all detail lines (pre-computed).
	TotalD float64 `json:"totald"`
	// TotalK is the sum of Kredit across all detail lines (pre-computed).
	TotalK float64 `json:"totalk"`
	// OtorisasiLevel1 is true when IsOtorisasi1=1.
	OtorisasiLevel1 bool `json:"otorisasi1"`
	// OtorisasiLevel2 is true when IsOtorisasi2=1.
	OtorisasiLevel2 bool `json:"otorisasi2"`
	// Locked is true when both authorization levels are set; edits are rejected.
	Locked bool `json:"locked"`
}

// SKasBankDetail is a domain view-model for a single journal line, exposing
// only the fields the frontend KasBank detail table needs.
type SKasBankDetail struct {
	// Urut is the per-Urut sequence within a NoBukti (1-based).
	Urut int `json:"urut"`
	// Perkiraan is the account code for this line (debit/credit side).
	Perkiraan string `json:"perkiraan"`
	// Lawan is the contra-account code.
	Lawan string `json:"lawan"`
	// Debet is the debit amount.
	Debet float64 `json:"debet"`
	// Kredit is the credit amount.
	Kredit float64 `json:"kredit"`
	// Keterangan is the free-text line description.
	Keterangan string `json:"keterangan"`
	// TipeTrans echoes the header TipeTransHd for downstream filtering.
	TipeTrans string `json:"tipetrans"`
	// TPHC is the D/C marker: "D" for debit, "C" for credit.
	TPHC string `json:"tphc"`
	// Valas is the foreign-currency code, blank for IDR.
	Valas string `json:"valas"`
	// Kurs is the exchange rate, 1.0 for IDR.
	Kurs float64 `json:"kurs"`
}

// TipeTrans values accepted as the journal header discriminator.
const (
	TipeBKM = "BKM" // Bukti Kas Masuk (Cash In)
	TipeBKK = "BKK" // Bukti Kas Keluar (Cash Out)
	TipeBBM = "BBM" // Bukti Bank Masuk (Bank In)
	TipeBBK = "BBK" // Bukti Bank Keluar (Bank Out)
)

// ValidTipeTrans returns true if tipe is one of the four accepted values.
func ValidTipeTrans(tipe string) bool {
	switch tipe {
	case TipeBKM, TipeBKK, TipeBBM, TipeBBK:
		return true
	}
	return false
}
