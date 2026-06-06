package models

// SDBMENUREPORT represents the DBMENUREPORT table
type SDBMENUREPORT struct {
	KODEMENU string `gorm:"column:KODEMENU;primaryKey;size:25" json:"kodemenu"`
	Keterangan string `gorm:"column:Keterangan;size:500" json:"keterangan"`
	L0 int `gorm:"column:L0" json:"l0"`
	ACCESS int `gorm:"column:ACCESS" json:"access"`
	OL int `gorm:"column:OL" json:"ol"`
}

// TableName overrides the default table name for SDBMENUREPORT
func (SDBMENUREPORT) TableName() string {
	return "DBMENUREPORT"
}
