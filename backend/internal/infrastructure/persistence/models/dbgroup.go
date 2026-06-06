package models

// SDBGROUP represents the DBGROUP table
type SDBGROUP struct {
	KODEGRP string `gorm:"column:KODEGRP;primaryKey;size:15" json:"kodegrp"`
	NAMA string `gorm:"column:NAMA;size:40" json:"nama"`
}

// TableName overrides the default table name for SDBGROUP
func (SDBGROUP) TableName() string {
	return "DBGROUP"
}
