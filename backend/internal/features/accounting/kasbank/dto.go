// Package kasbank — DTO definitions for HTTP request/response payloads.
// All HTTP-bound shapes live here so the handler does not import database
// models directly (per the Domain-Based + DDD-Lite "Data Isolation" rule).
package kasbank

import (
	"time"

	"github.com/masza1/dapen-backend/internal/infrastructure/persistence/models"
)

// SListKasBankQuery is the query-string for GET /api/accounting/kasbank.
// Tipe is optional; when empty the repository still restricts the result to
// the 4 kasbank types (BKM/BKK/BBM/BBK) — it never returns unrestricted
// DBTRANS rows. Date range is inclusive. Search matches NoBukti or Note
// (case-insensitive substring).
type SListKasBankQuery struct {
	// Tipe is the journal discriminator filter (BKM/BKK/BBM/BBK). Empty means
	// "all 4 kasbank types" — the repository always applies an IN(...) filter
	// over those 4 values, it is never left unrestricted.
	Tipe string `form:"tipe" json:"tipe"`
	// Search matches NoBukti or Note with LIKE %search%.
	Search string `form:"search" json:"search"`
	// DateFrom is the inclusive lower bound of Tanggal (RFC3339 or YYYY-MM-DD).
	DateFrom string `form:"dateFrom" json:"dateFrom"`
	// DateTo is the inclusive upper bound of Tanggal.
	DateTo string `form:"dateTo" json:"dateTo"`
	// Page is 1-based; defaults to 1 in the handler when <= 0.
	Page int `form:"page" json:"page"`
	// PerPage defaults to 10 in the handler when <= 0.
	PerPage int `form:"perPage" json:"perPage"`
	// SortBy is the column name to sort by (Tanggal, NoBukti, TipeTransHd).
	// Defaults to "Tanggal DESC" in the handler when empty.
	SortBy string `form:"sortBy" json:"sortBy"`
	// SortDir is "asc" or "desc". Defaults to "desc" when empty.
	SortDir string `form:"sortDir" json:"sortDir"`
	// UserID is the authenticated caller, injected by the handler (never
	// bound from the request itself). Used by the repository to resolve
	// the default period restriction when DateFrom/DateTo are blank.
	UserID string `form:"-" json:"-"`
}

// SCreateKasBankRequest is the JSON body for POST /api/accounting/kasbank.
// The frontend may pass Tanggal as RFC3339 or "2006-01-02"; the service
// normalises both shapes.
type SCreateKasBankRequest struct {
	// Tanggal is the journal date; must fall inside the user's active
	// accounting period (DBPERIODE) per the business rule.
	Tanggal string `json:"tanggal" binding:"required"`
	// TipeTransHd is the discriminator: BKM, BKK, BBM, or BBK.
	TipeTransHd string `json:"tipeTransHd" binding:"required"`
	// PerkiraanHd is the cash/bank account code on the header.
	PerkiraanHd string `json:"perkiraanHd"`
	// Note is the free-text header description.
	Note string `json:"note"`
	// TglJurnal is the due date / "Batas Waktu".
	TglJurnal *string `json:"tgljurnal"`
	// NoJurnal is the order number / "No. Order".
	NoJurnal string `json:"noJurnal"`
	// NoBuktiSem is the invoice/reference number / "No. Invoice".
	NoBuktiSem string `json:"noBuktiSem"`
	// Devisi is the unit business.
	Devisi string `json:"devisi"`
	// NoBon is the external reference number.
	NoBon string `json:"nobon"`
	// TPHC is the header-level payment method (C/T/H/P) that propagates to details.
	TPHC string `json:"tphc"`
	// Details is the list of journal lines; the service validates that
	// sum(Debet) == sum(Kredit) across the whole slice.
	Details []SDetailInput `json:"details"`
	// GiroList contains optional giro data triggered during this transaction.
	GiroList []models.SDBGIRO `json:"giroList,omitempty"`
	// DepositoList contains optional deposito data triggered during this transaction.
	DepositoList []models.SDBDEPOSITO `json:"depositoList,omitempty"`
	// HutPiutList contains optional Hutang/Piutang payments triggered during this transaction.
	HutPiutList []models.SDBHUTPIUT `json:"hutPiutList,omitempty"`
	// AktivaList contains optional Aktiva data triggered during this transaction.
	AktivaList []models.SDBAKTIVA `json:"aktivaList,omitempty"`
}

// SUpdateKasBankRequest is the JSON body for PUT /api/accounting/kasbank/:noBukti.
// Fields are treated as full-replace: any blank/zero value overwrites the column.
// The handler/service enforces "no edit after IsOtorisasi1=1".
type SUpdateKasBankRequest struct {
	Tanggal      string        `json:"tanggal"`
	TipeTransHd  string        `json:"tipeTransHd"`
	PerkiraanHd  string        `json:"perkiraanHd"`
	Note         string        `json:"note"`
	Jenis        *int          `json:"jenis"`
	TglJurnal    *string       `json:"tgljurnal"`
	NoJurnal     string        `json:"noJurnal"`
	NoBuktiSem   string        `json:"noBuktiSem"`
	Devisi       string        `json:"devisi"`
	NoBon        string        `json:"nobon"`
	TPHC         string        `json:"tphc"`
	Details      []SDetailInput `json:"details,omitempty"`
	GiroList     []models.SDBGIRO     `json:"giroList,omitempty"`
	DepositoList []models.SDBDEPOSITO `json:"depositoList,omitempty"`
	HutPiutList  []models.SDBHUTPIUT  `json:"hutPiutList,omitempty"`
	AktivaList   []models.SDBAKTIVA   `json:"aktivaList,omitempty"`
}

// SDetailInput is a single journal line as posted by the frontend. The service
// layer auto-assigns Urut (1-based, max+1) on POST and re-validates the
// double-entry invariant on every PUT.
type SDetailInput struct {
	// Urut is the existing line number; 0 means "append a new line".
	Urut int `json:"urut"`
	// Perkiraan is the account code for this line.
	Perkiraan string `json:"perkiraan" binding:"required"`
	// Lawan is the contra-account code.
	Lawan string `json:"lawan"`
	// Debet is the debit amount; must be 0 when Kredit > 0.
	Debet float64 `json:"debet"`
	// Kredit is the credit amount; must be 0 when Debet > 0.
	Kredit float64 `json:"kredit"`
	// Valas is the foreign-currency code; "" means IDR.
	Valas string `json:"valas"`
	// Kurs is the exchange rate; 0 is treated as 1.0.
	Kurs float64 `json:"kurs"`
	// Keterangan is the free-text line description.
	Keterangan string `json:"keterangan"`
	// TipeTrans echoes the header discriminator.
	TipeTrans string `json:"tipeTrans"`
	// TPHC is "D" or "C" — the debit/credit marker the legacy schema requires.
	TPHC string `json:"tphc"`
	// KodeBag is the SPK/project reference ("KodeBag" column in DBTRANSAKSI).
	KodeBag string `json:"kodebag"`
	// KodeCustSupp stores the customer/supplier code when this line is a
	// pelunasan (Hutang/Piutang settlement).
	KodeCustSupp string `json:"kode_cust_supp"`
}

// SOtorisasiRequest is the JSON body for POST /:noBukti/otorisasi and
// /:noBukti/batal-otorisasi. Level=1..5; Action is "set" or "cancel"
// (the cancel endpoint is mounted separately but accepts the same shape).
type SOtorisasiRequest struct {
	// Level is the authorization level to set/cancel (1 to 5).
	Level int `json:"level" binding:"required,min=1,max=5"`
	// Action is "set" or "cancel" — kept in the same DTO so a single
	// handler can switch on it for the merged endpoint if needed.
	Action string `json:"action" binding:"required,oneof=set cancel"`
}

// SListKasBankResponse is the paginated JSON shape for the list endpoint.
type SListKasBankResponse struct {
	// Items is the current page, converted to the SKasBankHeader view-model
	// (same field semantics as GetByNoBukti: otorisasi1..5, effective
	// maxol, locked, jumlahvalas/jumlahrupiah) — never raw SDbTrans rows.
	Items []SKasBankHeader `json:"items"`
	// Total is the count after applying filters (pre-pagination).
	Total int64 `json:"total"`
	// Page echoes the requested page number.
	Page int `json:"page"`
	// PerPage echoes the requested per-page size.
	PerPage int `json:"perPage"`
}

// SGenerateNoBuktiResponse is the JSON body returned by GET /generate-no-bukti.
type SGenerateNoBuktiResponse struct {
	// Tipe echoes the requested discriminator.
	Tipe string `json:"tipe"`
	// NoBukti is the freshly generated, formatted voucher number.
	NoBukti string `json:"nobukti"`
	// GeneratedAt is the timestamp used in the YYYYMM component.
	GeneratedAt time.Time `json:"generatedAt"`
}

// SLookupPerkiraanQuery is the query string for GET /lookup-perkiraan.
type SLookupPerkiraanQuery struct {
	// Q is the substring to search in Perkiraan or Keterangan.
	Q string `form:"q" json:"q"`
	// KelompokKas, when true, narrows the lookup to cash/bank-style accounts
	// (Kelompok = "1" or "2" in the legacy schema).
	KelompokKas bool `form:"kelompokKas" json:"kelompokKas"`
	// Limit defaults to 50 in the handler when <= 0.
	Limit int `form:"limit" json:"limit"`
}

// SKasBankLookupPerkiraanResponse is the JSON body returned by GET /lookup-perkiraan.
type SKasBankLookupPerkiraanResponse struct {
	// Items is the matched DBPERKIRAAN rows.
	Items []SDbPerkiraan `json:"items"`
	// Total is the count returned (post-limit, useful for "showing N of M" UIs).
	Total int `json:"total"`
}

// SSubTransactionResult indicates if a sub-form should be triggered.
type SSubTransactionResult struct {
	Trigger string `json:"trigger"` // "giro", "deposito", "hutpiut", "aktiva", or null/empty
	Kode    string `json:"kode"`
	StatusP string `json:"statusP"`
	StatusL string `json:"statusL"`
}
