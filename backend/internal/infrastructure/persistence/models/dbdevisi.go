package models

// SDBDEVISI represents the DBDEVISI table
type SDBDEVISI struct {
	Devisi string `gorm:"column:Devisi;primaryKey;size:15" json:"devisi"`
	NamaDevisi string `gorm:"column:NamaDevisi;size:30" json:"namadevisi"`
	MyID *string `gorm:"column:MyID;->;<-:false" json:"-"`
}

// TableName overrides the default table name for SDBDEVISI
func (SDBDEVISI) TableName() string {
	return "DBDEVISI"
}
