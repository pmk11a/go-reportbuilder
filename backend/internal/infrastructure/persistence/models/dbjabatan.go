package models

// SDBJABATAN represents the DBJABATAN table
type SDBJABATAN struct {
	KODEJAB string `gorm:"column:KODEJAB;primaryKey;size:15" json:"kodejab"`
	NamaJab string `gorm:"column:NamaJab;size:50" json:"namajab"`
	MyID *string `gorm:"column:MyID;->;<-:false" json:"-"`
}

// TableName overrides the default table name for SDBJABATAN
func (SDBJABATAN) TableName() string {
	return "DBJABATAN"
}
