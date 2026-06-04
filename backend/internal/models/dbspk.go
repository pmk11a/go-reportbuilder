package models

import (
	"time"
)

// SDBSPK represents the DBSPK table
type SDBSPK struct {
	NOBUKTI string `gorm:"column:NOBUKTI;primaryKey;size:30" json:"nobukti"`
	NoUrut *string `gorm:"column:NoUrut;size:10" json:"nourut"`
	TANGGAL *time.Time `gorm:"column:TANGGAL" json:"tanggal"`
	KODEBRG *string `gorm:"column:KODEBRG;size:25" json:"kodebrg"`
	NoBatch *string `gorm:"column:NoBatch;size:30" json:"nobatch"`
	TglExpired *time.Time `gorm:"column:TglExpired" json:"tglexpired"`
	Qnt *float64 `gorm:"column:Qnt" json:"qnt"`
	IsCLose *bool `gorm:"column:IsCLose" json:"isclose"`
	Nosat *int `gorm:"column:Nosat" json:"nosat"`
	Satuan *string `gorm:"column:Satuan;size:5" json:"satuan"`
	Isi *float64 `gorm:"column:Isi" json:"isi"`
	KodeBOM *string `gorm:"column:KodeBOM;size:30" json:"kodebom"`
	CetakKe *int `gorm:"column:CetakKe" json:"cetakke"`
	IsOtorisasi1 bool `gorm:"column:IsOtorisasi1" json:"isotorisasi1"`
	OtoUser1 string `gorm:"column:OtoUser1;size:15" json:"otouser1"`
	TglOto1 *time.Time `gorm:"column:TglOto1" json:"tgloto1"`
	IsOtorisasi2 bool `gorm:"column:IsOtorisasi2" json:"isotorisasi2"`
	OtoUser2 string `gorm:"column:OtoUser2;size:15" json:"otouser2"`
	TglOto2 *time.Time `gorm:"column:TglOto2" json:"tgloto2"`
	IsOtorisasi3 bool `gorm:"column:IsOtorisasi3" json:"isotorisasi3"`
	OtoUser3 string `gorm:"column:OtoUser3;size:15" json:"otouser3"`
	TglOto3 *time.Time `gorm:"column:TglOto3" json:"tgloto3"`
	IsOtorisasi4 bool `gorm:"column:IsOtorisasi4" json:"isotorisasi4"`
	OtoUser4 string `gorm:"column:OtoUser4;size:15" json:"otouser4"`
	TglOto4 *time.Time `gorm:"column:TglOto4" json:"tgloto4"`
	IsOtorisasi5 bool `gorm:"column:IsOtorisasi5" json:"isotorisasi5"`
	OtoUser5 string `gorm:"column:OtoUser5;size:15" json:"otouser5"`
	TglOto5 *time.Time `gorm:"column:TglOto5" json:"tgloto5"`
	NoJurnal string `gorm:"column:NoJurnal;size:30" json:"nojurnal"`
	NoUrutJurnal string `gorm:"column:NoUrutJurnal;size:5" json:"nourutjurnal"`
	TglJurnal *time.Time `gorm:"column:TglJurnal" json:"tgljurnal"`
	MaxOL *int `gorm:"column:MaxOL" json:"maxol"`
}

// TableName overrides the default table name for SDBSPK
func (SDBSPK) TableName() string {
	return "DBSPK"
}
