package models

// SDBBARANG represents the DBBARANG table
type SDBBARANG struct {
	KODEBRG string `gorm:"column:KODEBRG;primaryKey;size:25" json:"kodebrg"`
	NAMABRG string `gorm:"column:NAMABRG;size:150" json:"namabrg"`
	KODEGRP string `gorm:"column:KODEGRP;size:20" json:"kodegrp"`
	KODESUBGRP string `gorm:"column:KODESUBGRP;size:10" json:"kodesubgrp"`
	KODESUPP *string `gorm:"column:KODESUPP;size:20" json:"kodesupp"`
	SAT1 string `gorm:"column:SAT1;size:5" json:"sat1"`
	ISI1 float64 `gorm:"column:ISI1" json:"isi1"`
	SAT2 *string `gorm:"column:SAT2;size:5" json:"sat2"`
	ISI2 *float64 `gorm:"column:ISI2" json:"isi2"`
	SAT3 *string `gorm:"column:SAT3;size:5" json:"sat3"`
	ISI3 *float64 `gorm:"column:ISI3" json:"isi3"`
	Hrg1_1 *float64 `gorm:"column:Hrg1_1" json:"hrg1_1"`
	Hrg2_1 *float64 `gorm:"column:Hrg2_1" json:"hrg2_1"`
	Hrg3_1 *float64 `gorm:"column:Hrg3_1" json:"hrg3_1"`
	Hrg1_2 *float64 `gorm:"column:Hrg1_2" json:"hrg1_2"`
	Hrg2_2 *float64 `gorm:"column:Hrg2_2" json:"hrg2_2"`
	Hrg3_2 *float64 `gorm:"column:Hrg3_2" json:"hrg3_2"`
	Hrg1_3 *float64 `gorm:"column:Hrg1_3" json:"hrg1_3"`
	Hrg2_3 *float64 `gorm:"column:Hrg2_3" json:"hrg2_3"`
	Hrg3_3 *float64 `gorm:"column:Hrg3_3" json:"hrg3_3"`
	QntMin *float64 `gorm:"column:QntMin" json:"qntmin"`
	QntMax *float64 `gorm:"column:QntMax" json:"qntmax"`
	ISAKTIF int `gorm:"column:ISAKTIF" json:"isaktif"`
	Keterangan *string `gorm:"column:Keterangan;size:50" json:"keterangan"`
	NFix *bool `gorm:"column:NFix" json:"nfix"`
	NamaBrg2 *string `gorm:"column:NamaBrg2;size:100" json:"namabrg2"`
	Tolerate *float64 `gorm:"column:Tolerate" json:"tolerate"`
	Proses int `gorm:"column:Proses" json:"proses"`
	IsTakeIn bool `gorm:"column:IsTakeIn" json:"istakein"`
	IsBarang *int `gorm:"column:IsBarang" json:"isbarang"`
	IsJasa *bool `gorm:"column:IsJasa" json:"isjasa"`
	KodeMerk *string `gorm:"column:KodeMerk;size:15" json:"kodemerk"`
	KodeHdGrp *string `gorm:"column:KodeHdGrp;size:15" json:"kodehdgrp"`

	// Relationships
	DBSPKs []SDBSPK `gorm:"foreignKey:KODBRG;references:KODBRG" json:"dbspks,omitempty"`
}

// TableName overrides the default table name for SDBBARANG
func (SDBBARANG) TableName() string {
	return "DBBARANG"
}
