package models

type SDbPostHutPiut struct {
	Perkiraan string `gorm:"column:Perkiraan;primaryKey"`
	Kode      string `gorm:"column:Kode"`
}

func (SDbPostHutPiut) TableName() string {
	return "DBPOSTHUTPIUT"
}
