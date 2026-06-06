package models

type SDbValas struct {
	KodeVls string `gorm:"column:KODEVLS;primaryKey"`
}

func (SDbValas) TableName() string {
	return "dbVALAS"
}
