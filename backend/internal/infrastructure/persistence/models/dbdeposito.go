package models

import (
	"time"
)

// SDBDEPOSITO represents the DBDEPOSITO table for managing Deposito
// (time-deposit) transactions.
//
// Field shape mirrors the legacy Delphi form FrmKasBankDeposito.pas
// btnOKClick:
//   - NoDeposito, Bank, TglBuka, TglJatuhTempo, KodeVls, Kurs are the
//     deposito's identity
//   - Debet / Kredit / DebetRp / KreditRp / Jumlah / JumlahRp are the
//     accounting amounts driven by StatusDeposito (DP+/DP-)
//   - BuktiBuka / urutBuktiBuka link the opening transaction in DBTRANS
//   - BuktiCair / urutBuktiCair / TglCair / KeteranganCair link the
//     settlement transaction — NULL until cair.
//
// IDR RULE: when KodeVls='IDR', Debet, Kredit, Jumlah columns MUST be
// 0 — same convention as DBGIRO. See FrmKasBankDeposito.pas btnOKClick.
type SDBDEPOSITO struct {
	NoDeposito      string     `gorm:"column:NoDeposito;primaryKey;size:50" json:"nodeposito"`
	Bank            string     `gorm:"column:Bank;size:50" json:"bank"`
	Nominal         float64    `gorm:"column:Nominal" json:"nominal"`
	Bunga           float64    `gorm:"column:Bunga" json:"bunga"`
	TglBuka         *time.Time `gorm:"column:TglBuka" json:"tglbuka"`
	TglJatuhTempo   *time.Time `gorm:"column:TglJatuhTempo" json:"tgljatuhtempo"`
	TglCair         *time.Time `gorm:"column:TglCair" json:"tglcair"`
	StatusDeposito  string     `gorm:"column:StatusDeposito;size:5" json:"statusdeposito"`
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
	BuktiCair       string     `gorm:"column:BuktiCair;size:30" json:"bukticair"`
	UrutBuktiCair   int        `gorm:"column:urutBuktiCair" json:"urutbukticair"`
	MyID            *string    `gorm:"column:MyID;->;<-:false" json:"-"`
}

// TableName overrides the default table name for SDBDEPOSITO
func (SDBDEPOSITO) TableName() string {
	return "DBDEPOSITO"
}
