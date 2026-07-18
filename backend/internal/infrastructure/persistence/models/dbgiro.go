package models

import (
	"time"
)

// SDBGIRO represents the DBGIRO table for managing Giro transactions
type SDBGIRO struct {
	NoGiro      string     `gorm:"column:NoGiro;primaryKey;size:50" json:"nogiro"`
	Bank        string     `gorm:"column:Bank;size:50" json:"bank"`
	Nominal     float64    `gorm:"column:Nominal" json:"nominal"`
	TglTerbit   *time.Time `gorm:"column:TglTerbit" json:"tglterbit"`
	TglJatuhTempo *time.Time `gorm:"column:TglJatuhTempo" json:"tgljatuhtempo"`
	StatusGiro  string     `gorm:"column:StatusGiro;size:5" json:"statusgiro"`
	Tipe        string     `gorm:"column:Tipe;size:5" json:"tipe"` // PT or HT
	Keterangan  string     `gorm:"column:Keterangan;size:500" json:"keterangan"`
	MyID        *string    `gorm:"column:MyID;->;<-:false" json:"-"`
}

// TableName overrides the default table name for SDBGIRO
func (SDBGIRO) TableName() string {
	return "DBGIRO"
}
