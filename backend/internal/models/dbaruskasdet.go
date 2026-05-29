package models

type SDbArusKasDet struct {
	KodeSubAK string `gorm:"column:KodeSubAK;primaryKey"`
}

func (SDbArusKasDet) TableName() string {
	return "DBArusKasDet"
}
