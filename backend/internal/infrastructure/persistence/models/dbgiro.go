package models

import (
	"time"
)

// SDBGIRO represents the DBGIRO table for managing Giro transactions.
//
// Field shape mirrors the legacy Delphi form FrmKasBankGiro.pas:
//   - NoGiro, Bank, TglGiro, KodeVls, Kurs are the giro's identity
//   - Debet / Kredit / DebetRp / KreditRp / Jumlah / JumlahRp are the
//     accounting amounts driven by StatusGiro (P+/P-/H+/H-)
//   - BuktiBuka / urutBuktiBuka / TglBuka link the giro's opening
//     transaction in DBTRANS
//   - BuktiCair / urutBuktiCair / TglCair / KeteranganCair link the
//     giro's settlement (pencairan) transaction — NULL until cair.
//   - Tipe is the giro's sub-ledger code: 'PT' (Piutang Giro) or 'HT'
//     (Hutang Giro).
//
// IDR RULE: when KodeVls='IDR', the Debet, Kredit, Jumlah columns MUST
// be 0 — only the rupiah-equivalent columns (DebetRp / KreditRp /
// JumlahRp) carry the value. This rule mirrors FrmKasBankGiro.pas
// btnOKClick (lines 1339–1348) and FrmKasBank.pas SimpanDataGiro.
type SDBGIRO struct {
	NoGiro          string     `gorm:"column:NoGiro;primaryKey;size:50" json:"nogiro"`
	Bank            string     `gorm:"column:Bank;size:50" json:"bank"`
	Nominal         float64    `gorm:"column:Nominal" json:"nominal"`
	TglTerbit       *time.Time `gorm:"column:TglTerbit" json:"tglterbit"`
	TglJatuhTempo   *time.Time `gorm:"column:TglJatuhTempo" json:"tgljatuhtempo"`
	TglGiro         *time.Time `gorm:"column:TglGiro" json:"tglgiro"`
	StatusGiro      string     `gorm:"column:StatusGiro;size:5" json:"statusgiro"`
	Tipe            string     `gorm:"column:Tipe;size:5" json:"tipe"` // PT or HT
	Keterangan      string     `gorm:"column:Keterangan;size:500" json:"keterangan"`
	KeteranganCair  string     `gorm:"column:KeteranganCair;size:500" json:"keterangancair"`
	KodeVls         string     `gorm:"column:KodeVls;size:10" json:"kodevls"`
	Kurs            float64    `gorm:"column:Kurs" json:"kurs"`
	Debet           float64    `gorm:"column:Debet" json:"debet"`
	Kredit          float64    `gorm:"column:Kredit" json:"kredit"`
	DebetRp         float64    `gorm:"column:DebetRp" json:"debetrp"`
	KreditRp        float64    `gorm:"column:KreditRp" json:"kreditrp"`
	Jumlah          float64    `gorm:"column:Jumlah" json:"jumlah"`
	JumlahRp        float64    `gorm:"column:JumlahRp" json:"jumlahrp"`
	BuktiBuka       string     `gorm:"column:BuktiBuka;size:30" json:"buktibuka"`
	UrutBuktiBuka   int        `gorm:"column:urutBuktiBuka" json:"urutbuktibuka"`
	TglBuka         *time.Time `gorm:"column:TglBuka" json:"tglbuka"`
	BuktiCair       string     `gorm:"column:BuktiCair;size:30" json:"bukticair"`
	UrutBuktiCair   int        `gorm:"column:urutBuktiCair" json:"urutbukticair"`
	TglCair         *time.Time `gorm:"column:TglCair" json:"tglcair"`
	KAS             string     `gorm:"column:KAS;size:25" json:"kas"`
	MyID            *string    `gorm:"column:MyID;->;<-:false" json:"-"`
}

// TableName overrides the default table name for SDBGIRO
func (SDBGIRO) TableName() string {
	return "DBGIRO"
}
