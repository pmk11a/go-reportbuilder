package models

type DBPeriode struct {
	USERID string `gorm:"column:USERID;primaryKey;size:10" json:"USERID"`
	BULAN  string `gorm:"column:BULAN;size:2" json:"BULAN"`
	TAHUN  string `gorm:"column:TAHUN;size:4" json:"TAHUN"`
}

func (DBPeriode) TableName() string {
	return "DBPERIODE"
}
