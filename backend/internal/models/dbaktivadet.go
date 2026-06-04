package models

// SDBAKTIVADET represents the DBAKTIVADET table
type SDBAKTIVADET struct {
	Perkiraan string `gorm:"column:Perkiraan;primaryKey;size:30" json:"perkiraan"`
	Bulan int `gorm:"column:Bulan;primaryKey" json:"bulan"`
	Tahun int `gorm:"column:Tahun;primaryKey" json:"tahun"`
	Devisi string `gorm:"column:Devisi;primaryKey;size:15" json:"devisi"`
	Valas string `gorm:"column:Valas;size:15" json:"valas"`
	Kurs float64 `gorm:"column:Kurs" json:"kurs"`
	Awal float64 `gorm:"column:Awal" json:"awal"`
	AwalSusut float64 `gorm:"column:AwalSusut" json:"awalsusut"`
	AwalD float64 `gorm:"column:AwalD" json:"awald"`
	AwalSusutD float64 `gorm:"column:AwalSusutD" json:"awalsusutd"`
	MD float64 `gorm:"column:MD" json:"md"`
	DMD float64 `gorm:"column:DMD" json:"dmd"`
	MK float64 `gorm:"column:MK" json:"mk"`
	DMK float64 `gorm:"column:DMK" json:"dmk"`
	SD float64 `gorm:"column:SD" json:"sd"`
	DSD float64 `gorm:"column:DSD" json:"dsd"`
	SK float64 `gorm:"column:SK" json:"sk"`
	DSK float64 `gorm:"column:DSK" json:"dsk"`
	Akhir *float64 `gorm:"column:Akhir" json:"akhir"`
	AkhirD *float64 `gorm:"column:AkhirD" json:"akhird"`
	AkhirSusutD *float64 `gorm:"column:AkhirSusutD" json:"akhirsusutd"`
	MyID *string `gorm:"column:MyID" json:"-"`
	AkhirSusut *float64 `gorm:"column:AkhirSusut" json:"akhirsusut"`
}

// TableName overrides the default table name for SDBAKTIVADET
func (SDBAKTIVADET) TableName() string {
	return "DBAKTIVADET"
}
