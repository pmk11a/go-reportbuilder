package models

// SDbPostHutPiut maps the DBPOSTHUTPIUT lookup table.
// It is used by ResolveSubTransaction to determine whether an account triggers
// a sub-form (HutPiut, Aktiva, Giro) and whether the lookup should filter
// by IsLokalORexim (local vs exim trade).
//
// Mirrors the Delphi query in FrmKasBank.pas::CekLawanDiPosting:
//
//   SELECT * FROM dbPostHutPiut WHERE perkiraan=:0
//
// The IsLokalORexim field drives the vwHutPiut view filter: when true the
// view restricts results to locally-created invoices, when false it includes
// exim ones.  The TipeDK column stores the default DK side ('D' or 'K') that
// Delphi uses when inserting new DBHUTPIUT rows during a HutPiut settlement.
type SDbPostHutPiut struct {
	Perkiraan      string `gorm:"column:Perkiraan;primaryKey"`       // account code being looked up
	Kode           string `gorm:"column:Kode"`                        // DP | AKV | AKM | PT | HT | UPT | UHT — drives sub-form trigger
	IsLokalORexim  bool   `gorm:"column:IsLokalORExim"`               // true → filter open invoices by local/exim trade context
	TipeDK         string `gorm:"column:TipeDK;size:1"`               // 'D' or 'K' — default DK side for DBHUTPIUT inserts
}

func (SDbPostHutPiut) TableName() string {
	return "DBPOSTHUTPIUT"
}
