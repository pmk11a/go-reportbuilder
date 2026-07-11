package models

type SDbLockPeriode struct {
	Bulan   int `gorm:"column:BULAN;type:tinyint"`
	Tahun   int `gorm:"column:TAHUN;type:int"`
	NKBulan *int `gorm:"column:NKBULAN;type:tinyint"`
	NKTahun *int `gorm:"column:NKTAHUN;type:int"`
}

func (SDbLockPeriode) TableName() string {
	return "DBLOCKPERIODE"
}
