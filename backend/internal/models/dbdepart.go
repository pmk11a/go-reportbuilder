package models

// SDBDEPART represents the DBDEPART table
type SDBDEPART struct {
	KDDEP string `gorm:"column:KDDEP;primaryKey;size:20" json:"kddep"`
	NMDEP string `gorm:"column:NMDEP;size:40" json:"nmdep"`
	PerkBiaya *string `gorm:"column:PerkBiaya;size:25" json:"perkbiaya"`
}

// TableName overrides the default table name for SDBDEPART
func (SDBDEPART) TableName() string {
	return "DBDEPART"
}
