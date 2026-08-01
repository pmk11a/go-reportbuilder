package models

import (
	"time"
)

// SDBTempHUTPIUT represents the DBTempHUTPIUT table
type SDBTempHUTPIUT struct {
	NoFaktur string `gorm:"column:NoFaktur;size:30" json:"nofaktur"`
	NoRetur string `gorm:"column:NoRetur;size:30" json:"noretur"`
	TipeTrans string `gorm:"column:TipeTrans;size:3" json:"tipetrans"`
	KodeCustSupp string `gorm:"column:KodeCustSupp;size:15" json:"kodecustsupp"`
	NoBukti string `gorm:"column:NoBukti;size:30" json:"nobukti"`
	NoMsk int `gorm:"column:NoMsk" json:"nomsk"`
	Urut int `gorm:"column:Urut" json:"urut"`
	Tanggal *time.Time `gorm:"column:Tanggal" json:"tanggal"`
	JatuhTempo *time.Time `gorm:"column:JatuhTempo" json:"jatuhtempo"`
	Debet float64 `gorm:"column:Debet" json:"debet"`
	Kredit float64 `gorm:"column:Kredit" json:"kredit"`
	Saldo *float64 `gorm:"column:Saldo" json:"saldo"`
	Valas string `gorm:"column:Valas;size:15" json:"valas"`
	Kurs float64 `gorm:"column:Kurs" json:"kurs"`
	DebetD float64 `gorm:"column:DebetD" json:"debetd"`
	KreditD float64 `gorm:"column:KreditD" json:"kreditd"`
	SaldoD *float64 `gorm:"column:SaldoD" json:"saldod"`
	KodeSales string `gorm:"column:KodeSales;size:15" json:"kodesales"`
	Tipe string `gorm:"column:Tipe;size:4" json:"tipe"`
	Perkiraan string `gorm:"column:Perkiraan;size:25" json:"perkiraan"`
	Catatan string `gorm:"column:Catatan;size:800" json:"catatan"`
	MyID *string `gorm:"column:MyID;->;<-:false" json:"-"`
	IDUser *string `gorm:"column:IDUser;size:30" json:"iduser"`
	StatusUID *string `gorm:"column:StatusUID;size:1" json:"statusuid"`
	JumlahSaldo *float64 `gorm:"column:JumlahSaldo" json:"jumlahsaldo"`
	JumlahSaldoD *float64 `gorm:"column:JumlahSaldoD" json:"jumlahsaldod"`
	TipeDK *string `gorm:"column:TipeDK;size;1;->;<-:false" json:"tipedk"` // Optional legacy column; skipped on inserts if column missing
	NoInvoice *string `gorm:"column:NoInvoice;size:25" json:"noinvoice"`
	Valas_ *string `gorm:"column:Valas_;size:15" json:"valas_"`
	Kurs_ *float64 `gorm:"column:Kurs_" json:"kurs_"`
	KursBayar *float64 `gorm:"column:KursBayar" json:"kursbayar"`
	FlagSimbol *string `gorm:"column:FlagSimbol;size:2" json:"flagsimbol"`
}

// TableName overrides the default table name for SDBTempHUTPIUT
func (SDBTempHUTPIUT) TableName() string {
	return "DBTempHUTPIUT"
}
