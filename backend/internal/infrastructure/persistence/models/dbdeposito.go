package models

import (
	"time"
)

// SDBDEPOSITO represents the DBDEPOSITO table for managing Deposito transactions
type SDBDEPOSITO struct {
	NoDeposito   string `gorm:"column:NoDeposito;primaryKey;size:50" json:"nodeposito"`
	Bank         string `gorm:"column:Bank;size:50" json:"bank"`
	Nominal      float64 `gorm:"column:Nominal" json:"nominal"`
	Bunga        float64 `gorm:"column:Bunga" json:"bunga"`
	TglBuka      *time.Time `gorm:"column:TglBuka" json:"tglbuka"`
	TglJatuhTempo *time.Time `gorm:"column:TglJatuhTempo" json:"tgljatuhtempo"`
	StatusDeposito string `gorm:"column:StatusDeposito;size:5" json:"statusdeposito"`
	Keterangan   string `gorm:"column:Keterangan;size:500" json:"keterangan"`
	MyID         *string `gorm:"column:MyID;->;<-:false" json:"-"`
}

// TableName overrides the default table name for SDBDEPOSITO
func (SDBDEPOSITO) TableName() string {
	return "DBDEPOSITO"
}
