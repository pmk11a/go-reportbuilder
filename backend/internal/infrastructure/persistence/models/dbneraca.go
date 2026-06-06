package models

// SDBNERACA represents the DBNERACA table
type SDBNERACA struct {
	Perkiraan string `gorm:"column:Perkiraan;primaryKey;size:25" json:"perkiraan"`
	Bulan int `gorm:"column:Bulan;primaryKey" json:"bulan"`
	Tahun int `gorm:"column:Tahun;primaryKey" json:"tahun"`
	Devisi string `gorm:"column:Devisi;primaryKey;size:15" json:"devisi"`
	DK int `gorm:"column:DK" json:"dk"`
	Valas string `gorm:"column:Valas;size:15" json:"valas"`
	Kurs float64 `gorm:"column:Kurs" json:"kurs"`
	AwalD float64 `gorm:"column:AwalD" json:"awald"`
	AwalK float64 `gorm:"column:AwalK" json:"awalk"`
	AwalDRp float64 `gorm:"column:AwalDRp" json:"awaldrp"`
	AwalKRp float64 `gorm:"column:AwalKRp" json:"awalkrp"`
	MD float64 `gorm:"column:MD" json:"md"`
	MK float64 `gorm:"column:MK" json:"mk"`
	MDRp float64 `gorm:"column:MDRp" json:"mdrp"`
	MKRp float64 `gorm:"column:MKRp" json:"mkrp"`
	JPD float64 `gorm:"column:JPD" json:"jpd"`
	JPK float64 `gorm:"column:JPK" json:"jpk"`
	JPDRp float64 `gorm:"column:JPDRp" json:"jpdrp"`
	JPKRp float64 `gorm:"column:JPKRp" json:"jpkrp"`
	RLD float64 `gorm:"column:RLD" json:"rld"`
	RLK float64 `gorm:"column:RLK" json:"rlk"`
	RLDRp float64 `gorm:"column:RLDRp" json:"rldrp"`
	RLKRp float64 `gorm:"column:RLKRp" json:"rlkrp"`
	Budget float64 `gorm:"column:Budget" json:"budget"`
	AkhirD *float64 `gorm:"column:AkhirD" json:"akhird"`
	AkhirDRp *float64 `gorm:"column:AkhirDRp" json:"akhirdrp"`
	AkhirK *float64 `gorm:"column:AkhirK" json:"akhirk"`
	AkhirKRp *float64 `gorm:"column:AkhirKRp" json:"akhirkrp"`
	RenBisDesThnIni float64 `gorm:"column:RenBisDesThnIni" json:"renbisdesthnini"`
	RenbisJunYAD float64 `gorm:"column:RenbisJunYAD" json:"renbisjunyad"`
	RenbisDesYAD float64 `gorm:"column:RenbisDesYAD" json:"renbisdesyad"`
	PPINDesThnIni float64 `gorm:"column:PPINDesThnIni" json:"ppindesthnini"`
	PPINJunYAD float64 `gorm:"column:PPINJunYAD" json:"ppinjunyad"`
	PPINDesYAD float64 `gorm:"column:PPINDesYAD" json:"ppindesyad"`
}

// TableName overrides the default table name for SDBNERACA
func (SDBNERACA) TableName() string {
	return "DBNERACA"
}
