package models

// SDBSUBGROUP represents the DBSUBGROUP table
type SDBSUBGROUP struct {
	KodeGrp string `gorm:"column:KodeGrp;primaryKey;size:20" json:"kodegrp"`
	KodeSubGrp string `gorm:"column:KodeSubGrp;primaryKey;size:10" json:"kodesubgrp"`
	NamaSubGrp *string `gorm:"column:NamaSubGrp;size:50" json:"namasubgrp"`
	KodeHDGrp *string `gorm:"column:KodeHDGrp;size:15" json:"kodehdgrp"`
	PerkPers *string `gorm:"column:PerkPers;size:25" json:"perkpers"`
	PerkH *string `gorm:"column:PerkH;size:25" json:"perkh"`
	PerkPPN *string `gorm:"column:PerkPPN;size:25" json:"perkppn"`
}

// TableName overrides the default table name for SDBSUBGROUP
func (SDBSUBGROUP) TableName() string {
	return "DBSUBGROUP"
}
