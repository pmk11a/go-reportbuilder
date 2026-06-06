package models

type SDbCustSupp struct {
	KodeCustSupp string `gorm:"column:KODECUSTSUPP;primaryKey"`
	NamaCustSupp string `gorm:"column:NAMACUSTSUPP"`
	Alamat1      string `gorm:"column:ALAMAT1"`
	Kota         string `gorm:"column:Kota"`
	Jenis        int    `gorm:"column:JENIS"`
	MyID         *string `gorm:"column:MyID" json:"-"`
}

func (SDbCustSupp) TableName() string {
	return "DBCUSTSUPP"
}
