package models

// SDBSUBGROUPJNSTAMBAH represents the DBSUBGROUPJNSTAMBAH table
type SDBSUBGROUPJNSTAMBAH struct {
	KodeGrp string `gorm:"column:KodeGrp;primaryKey;size:20" json:"kodegrp"`
	KodeSubGrp string `gorm:"column:KodeSubGrp;primaryKey;size:10" json:"kodesubgrp"`
	Urut int `gorm:"column:Urut;primaryKey" json:"urut"`
	Keterangan string `gorm:"column:Keterangan;size:50" json:"keterangan"`
}

// TableName overrides the default table name for SDBSUBGROUPJNSTAMBAH
func (SDBSUBGROUPJNSTAMBAH) TableName() string {
	return "DBSUBGROUPJNSTAMBAH"
}
