package models

type SDbArusKas struct {
	KodeAK string `gorm:"column:KodeAK;primaryKey"`
}

func (SDbArusKas) TableName() string {
	return "DBArusKas"
}
