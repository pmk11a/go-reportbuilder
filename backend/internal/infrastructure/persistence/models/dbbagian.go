package models

// SDBBAGIAN represents the DBBAGIAN table
type SDBBAGIAN struct {
	KodeBag string `gorm:"column:KodeBag;primaryKey;size:15" json:"kodebag"`
	NamaBag string `gorm:"column:NamaBag;size:100" json:"namabag"`
	Perkiraan string `gorm:"column:Perkiraan;size:25" json:"perkiraan"`
	Biaya string `gorm:"column:Biaya;size:25" json:"biaya"`
	BiayaJasaKom string `gorm:"column:BiayaJasaKom;size:25" json:"biayajasakom"`
	BiayaJasaAlat string `gorm:"column:BiayaJasaAlat;size:25" json:"biayajasaalat"`
	MyID *string `gorm:"column:MyID;->;<-:false" json:"-"`
}

// TableName overrides the default table name for SDBBAGIAN
func (SDBBAGIAN) TableName() string {
	return "DBBAGIAN"
}
