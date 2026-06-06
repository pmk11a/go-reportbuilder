package models

import (
	"time"
)

// SDBJUAL represents the DBJUAL table
type SDBJUAL struct {
	NOBUKTI string `gorm:"column:NOBUKTI;primaryKey;size:20" json:"nobukti"`
	NOURUT *string `gorm:"column:NOURUT;size:10" json:"nourut"`
	TANGGAL *time.Time `gorm:"column:TANGGAL" json:"tanggal"`
	TGLJATUHTEMPO *time.Time `gorm:"column:TGLJATUHTEMPO" json:"tgljatuhtempo"`
	KODECUST *string `gorm:"column:KODECUST;size:15" json:"kodecust"`
	KODESLS *int `gorm:"column:KODESLS" json:"kodesls"`
	KODEGDG *string `gorm:"column:KODEGDG;size:15" json:"kodegdg"`
	HANDLING *float64 `gorm:"column:HANDLING" json:"handling"`
	KETERANGAN *string `gorm:"column:KETERANGAN;size:200" json:"keterangan"`
	KODEVLS *string `gorm:"column:KODEVLS;size:15" json:"kodevls"`
	KURS *float64 `gorm:"column:KURS" json:"kurs"`
	PPN *int `gorm:"column:PPN" json:"ppn"`
	TIPEBAYAR *int `gorm:"column:TIPEBAYAR" json:"tipebayar"`
	HARI *int `gorm:"column:HARI" json:"hari"`
	CATATAN *string `gorm:"column:CATATAN;size:2000" json:"catatan"`
	TIPEDISC *int `gorm:"column:TIPEDISC" json:"tipedisc"`
	DISC *float64 `gorm:"column:DISC" json:"disc"`
	DISCRP *float64 `gorm:"column:DISCRP" json:"discrp"`
	NILAIPOT *float64 `gorm:"column:NILAIPOT" json:"nilaipot"`
	NILAIDPP *float64 `gorm:"column:NILAIDPP" json:"nilaidpp"`
	NILAIPPN *float64 `gorm:"column:NILAIPPN" json:"nilaippn"`
	NILAINET *float64 `gorm:"column:NILAINET" json:"nilainet"`
	ISCETAK *int `gorm:"column:ISCETAK" json:"iscetak"`
	ISBATAL *bool `gorm:"column:ISBATAL" json:"isbatal"`
	USERBATAL *string `gorm:"column:USERBATAL;size:15" json:"userbatal"`
	NOPAJAK *string `gorm:"column:NOPAJAK;size:30" json:"nopajak"`
	KodeExp *string `gorm:"column:KodeExp;size:20" json:"kodeexp"`
	INSGdg *string `gorm:"column:INSGdg;size:3" json:"insgdg"`
	INSBrg *string `gorm:"column:INSBrg;size:3" json:"insbrg"`
	TGLFPJ *time.Time `gorm:"column:TGLFPJ" json:"tglfpj"`
	NobuktiUM string `gorm:"column:NobuktiUM;size:20" json:"nobuktium"`
	NewNo string `gorm:"column:NewNo;size:20" json:"newno"`
	Term string `gorm:"column:Term;size:200" json:"term"`
	FlagTipe string `gorm:"column:FlagTipe;size:1" json:"flagtipe"`

	// Relationships
	Details []SDBJUALDET `gorm:"foreignKey:NoFaktur;references:NoFaktur" json:"details,omitempty"`
}

// TableName overrides the default table name for SDBJUAL
func (SDBJUAL) TableName() string {
	return "DBJUAL"
}
