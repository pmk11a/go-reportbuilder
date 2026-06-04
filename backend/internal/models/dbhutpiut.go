package models

import (
	"time"
)

// SDBHUTPIUT represents the DBHUTPIUT table
type SDBHUTPIUT struct {
	NoFaktur string `gorm:"column:NoFaktur;primaryKey;size:30" json:"nofaktur"`
	NoRetur string `gorm:"column:NoRetur;primaryKey;size:30" json:"noretur"`
	TipeTrans string `gorm:"column:TipeTrans;primaryKey;size:3" json:"tipetrans"`
	KodeCustSupp string `gorm:"column:KodeCustSupp;primaryKey;size:15" json:"kodecustsupp"`
	NoBukti string `gorm:"column:NoBukti;primaryKey;size:30" json:"nobukti"`
	NoMsk int `gorm:"column:NoMsk;primaryKey" json:"nomsk"`
	Urut int `gorm:"column:Urut;primaryKey" json:"urut"`
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
	Tipe string `gorm:"column:Tipe;primaryKey;size:4" json:"tipe"`
	Perkiraan string `gorm:"column:Perkiraan;primaryKey;size:25" json:"perkiraan"`
	Catatan string `gorm:"column:Catatan;size:800" json:"catatan"`
	MyID *string `gorm:"column:MyID" json:"-"`
	NOINVOICE *string `gorm:"column:NOINVOICE;size:50" json:"noinvoice"`
	TGLINVOICE *time.Time `gorm:"column:TGLINVOICE" json:"tglinvoice"`
	NOPAJAK *string `gorm:"column:NOPAJAK;size:50" json:"nopajak"`
	TGLFPJ *time.Time `gorm:"column:TGLFPJ" json:"tglfpj"`
	KodeVls_ *string `gorm:"column:KodeVls_;size:20" json:"kodevls_"`
	Kurs_ *float64 `gorm:"column:Kurs_" json:"kurs_"`
	KursBayar *float64 `gorm:"column:KursBayar" json:"kursbayar"`
	FlagSimbol *string `gorm:"column:FlagSimbol;size:2" json:"flagsimbol"`
	Tipebayar *int `gorm:"column:Tipebayar" json:"tipebayar"`
	IsOtorisasi1 *bool `gorm:"column:IsOtorisasi1" json:"isotorisasi1"`
	OtoUser1 *string `gorm:"column:OtoUser1;size:15" json:"otouser1"`
	TglOto1 *time.Time `gorm:"column:TglOto1" json:"tgloto1"`
	IsOtorisasi2 *bool `gorm:"column:IsOtorisasi2" json:"isotorisasi2"`
	OtoUser2 *string `gorm:"column:OtoUser2;size:15" json:"otouser2"`
	TglOto2 *time.Time `gorm:"column:TglOto2" json:"tgloto2"`
	IsOtorisasi3 *bool `gorm:"column:IsOtorisasi3" json:"isotorisasi3"`
	OtoUser3 *string `gorm:"column:OtoUser3;size:15" json:"otouser3"`
	TglOto3 *time.Time `gorm:"column:TglOto3" json:"tgloto3"`
	IsOtorisasi4 *bool `gorm:"column:IsOtorisasi4" json:"isotorisasi4"`
	OtoUser4 *string `gorm:"column:OtoUser4;size:15" json:"otouser4"`
	TglOto4 *time.Time `gorm:"column:TglOto4" json:"tgloto4"`
	IsOtorisasi5 *bool `gorm:"column:IsOtorisasi5" json:"isotorisasi5"`
	OtoUser5 *string `gorm:"column:OtoUser5;size:15" json:"otouser5"`
	TglOto5 *time.Time `gorm:"column:TglOto5" json:"tgloto5"`
	IsClose *bool `gorm:"column:IsClose" json:"isclose"`
	NoJurnal *string `gorm:"column:NoJurnal;size:30" json:"nojurnal"`
	NoUrutJurnal *string `gorm:"column:NoUrutJurnal;size:5" json:"nourutjurnal"`
	TglJurnal *time.Time `gorm:"column:TglJurnal" json:"tgljurnal"`
	MaxOL *int `gorm:"column:MaxOL" json:"maxol"`
	Nourut *string `gorm:"column:Nourut;size:10" json:"nourut"`
	KBLB *string `gorm:"column:KBLB;size:3" json:"kblb"`
}

// TableName overrides the default table name for SDBHUTPIUT
func (SDBHUTPIUT) TableName() string {
	return "DBHUTPIUT"
}
