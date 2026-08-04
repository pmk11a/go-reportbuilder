package models

import (
	"time"
)

// SDBTRANSAKSI represents the DBTRANSAKSI table
type SDBTRANSAKSI struct {
	NoBukti string `gorm:"column:NoBukti;primaryKey;size:30" json:"nobukti"`
	Tanggal *time.Time `gorm:"column:Tanggal" json:"tanggal"`
	Devisi string `gorm:"column:Devisi;size:15" json:"devisi"`
	Note string `gorm:"column:Note;size:500" json:"note"`
	Lampiran float64 `gorm:"column:Lampiran" json:"lampiran"`
	Perkiraan string `gorm:"column:Perkiraan;size:25" json:"perkiraan"`
	Lawan string `gorm:"column:Lawan;size:25" json:"lawan"`
	Keterangan string `gorm:"column:Keterangan;size:8000" json:"keterangan"`
	Keterangan2 string `gorm:"column:Keterangan2;size:8000" json:"keterangan2"`
	Debet float64 `gorm:"column:Debet" json:"debet"`
	Kredit float64 `gorm:"column:Kredit" json:"kredit"`
	Valas string `gorm:"column:Valas;size:15" json:"valas"`
	Kurs float64 `gorm:"column:Kurs" json:"kurs"`
	DebetRp float64 `gorm:"column:DebetRp" json:"debetrp"`
	KreditRp float64 `gorm:"column:KreditRp" json:"kreditrp"`
	TipeTrans string `gorm:"column:TipeTrans;size:3" json:"tipetrans"`
	TPHC string `gorm:"column:TPHC;size:1" json:"tphc"`
	CustSuppP string `gorm:"column:CustSuppP;size:15" json:"custsuppp"`
	CustSuppL string `gorm:"column:CustSuppL;size:15" json:"custsuppl"`
	Urut int `gorm:"column:Urut;primaryKey" json:"urut"`
	KodeP string `gorm:"column:KodeP;size:15" json:"kodep"`
	KodeL string `gorm:"column:KodeL;size:15" json:"kodel"`
	NoAktivaP string `gorm:"column:NoAktivaP;size:30" json:"noaktivap"`
	NoAktivaL string `gorm:"column:NoAktivaL;size:30" json:"noaktival"`
	StatusAktivaP string `gorm:"column:StatusAktivaP;size:5" json:"statusaktivap"`
	StatusAktivaL string `gorm:"column:StatusAktivaL;size:5" json:"statusaktival"`
	Nobon string `gorm:"column:Nobon;size:20" json:"nobon"`
	KodeBag string `gorm:"column:KodeBag;size:15" json:"kodebag"`
	StatusGiro string `gorm:"column:StatusGiro;size:2" json:"statusgiro"`
	// XSusut is the number of depreciation periods (months) for aktiva fixed-asset
	// depreciation. Mirrors Delphi's QuAktiva.xsusut and the @Xsusut parameter
	// of sp_TransaksiKasBank.
	// Using ->;<-:false means GORM will read this column but never write it,
	// which makes it safe to use on legacy DBs that may not have this column.
	XSusut int `gorm:"column:XSusut;->;<-:false" json:"xsusut"`
	// PerlakuanAktiva encodes what happens to the fixed asset:
	//   0 = normal (retain in buku besar)
	//   1 = Jual (sold/deactivated)
	//   2 = Keluar Aktiva (removed from asset register)
	// Mirrors Delphi's QuAktiva.PerlakuanAktiva and @PerlakuanAktiva param.
	PerlakuanAktiva int `gorm:"column:PerlakuanAktiva;->;<-:false" json:"perlakuanaktiva"`
	MyID *string `gorm:"column:MyID;->;<-:false" json:"-"`
	FlagSimbol string `gorm:"column:FlagSimbol;primaryKey;size:2" json:"flagsimbol"`
}

// TableName overrides the default table name for SDBTRANSAKSI
func (SDBTRANSAKSI) TableName() string {
	return "DBTRANSAKSI"
}
