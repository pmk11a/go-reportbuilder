package models

type SDbPostHutPiut struct {
	NoFaktur  string `gorm:"column:NoFaktur;primaryKey"`
	Perkiraan string `gorm:"column:Perkiraan"`
	Kode      string `gorm:"column:Kode"`
}

func (SDbPostHutPiut) TableName() string {
	return "DBPOSTHUTPIUT"
}
