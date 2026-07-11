package models

type SDbPerkiraan struct {
	Perkiraan      string `gorm:"column:Perkiraan;primaryKey"`
	Kelompok       string `gorm:"column:Kelompok"`
	Tipe           int    `gorm:"column:Tipe"`
	DK             string `gorm:"column:DK"`
	Valas          string `gorm:"column:Valas"`
	KodeAK         string `gorm:"column:KodeAK"`
	KodeSAK        string `gorm:"column:KodeSAK"`
	Keterangan     string `gorm:"column:Keterangan"`
	Simbol         string `gorm:"column:Simbol"`
	FlagCashFlow   int    `gorm:"column:FlagCashFlow"`
	Neraca         string `gorm:"column:Neraca"`
	IsPPN          int    `gorm:"column:IsPPN"`
	GroupPerkiraan string `gorm:"column:GroupPerkiraan"`
	Lokasi         string `gorm:"column:Lokasi"`
	MyID           *string `gorm:"column:MyID;->;<-:false" json:"-"`

	// Relasi
	AksesPerkiraan []SDBFLPASS     `gorm:"many2many:DBAKSESPERKIRAAN;foreignKey:Perkiraan;joinForeignKey:Perkiraan;References:USERID;joinReferences:UserID"`
	ValasRel       *SDbValas       `gorm:"foreignKey:Valas;references:KodeVls"`
	ArusKas        *SDbArusKas     `gorm:"foreignKey:KodeAK;references:KodeAK"`
	ArusKasDet     *SDbArusKasDet  `gorm:"foreignKey:KodeSAK;references:KodeSubAK"`
	KelompokKas    *SDbPostHutPiut `gorm:"foreignKey:Perkiraan;references:Perkiraan"`
}

func (SDbPerkiraan) TableName() string {
	return "DBPERKIRAAN"
}
