package models

import (
	"time"
)

// SDBTRANS represents the DBTRANS table
type SDBTRANS struct {
	NoBukti string `gorm:"column:NoBukti;primaryKey;size:30" json:"nobukti"`
	NOURUT  string `gorm:"column:NOURUT;primaryKey;size:10" json:"nourut"`
	Tanggal *time.Time `gorm:"column:Tanggal" json:"tanggal"`
	Note    string `gorm:"column:Note;size:500" json:"note"`
	Lampiran string `gorm:"column:Lampiran;size:50" json:"lampiran"`
	MyID    *string `gorm:"column:MyID;->;<-:false" json:"-"`
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
	Simbol *string `gorm:"column:Simbol;size:10" json:"simbol"`
	TipeTransHd *string `gorm:"column:TipeTransHd;size:10" json:"tipetranshd"`
	PerkiraanHd *string `gorm:"column:PerkiraanHd;size:20" json:"perkiraanhd"`
	FlagSimbol *string `gorm:"column:FlagSimbol;size:2" json:"flagsimbol"`
	MaxOL int `gorm:"column:MaxOL" json:"maxol"`
	NoJurnal *string `gorm:"column:NoJurnal;size:30" json:"nojurnal"`
	NoUrutJurnal *string `gorm:"column:NoUrutJurnal;size:5" json:"nourutjurnal"`
	TglJurnal *time.Time `gorm:"column:TglJurnal" json:"tgljurnal"`
	Flagtipe int `gorm:"column:Flagtipe" json:"flagtipe"`
	// Additional fields from Delphi FrmKasBank.pas
	// These columns exist in DBTRANS but are excluded from GORM's AutoMigrate/scan.
	// They are written via raw SQL UPDATE in the service layer (CreateHeader/UpdateHeader).
	NoBuktiSem *string `gorm:"column:NoBuktiSem;size:30;->;<-:false" json:"-"`
	Nobon      *string `gorm:"column:Nobon;size:20;->;<-:false" json:"-"`
}

// TableName overrides the default table name for SDBTRANS
func (SDBTRANS) TableName() string {
	return "DBTRANS"
}
