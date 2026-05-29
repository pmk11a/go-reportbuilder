package models

type SDbFlmenu struct {
	USERID    string `gorm:"primaryKey;column:USERID;size:50"`
	L1        string `gorm:"primaryKey;column:L1;size:50"`
	HASACCESS bool   `gorm:"column:HASACCESS"`
	ISTAMBAH  bool   `gorm:"column:ISTAMBAH"`
	ISKOREKSI bool   `gorm:"column:ISKOREKSI"`
	ISHAPUS   bool   `gorm:"column:ISHAPUS"`
	ISCETAK   bool   `gorm:"column:ISCETAK"`
	ISEXPORT  bool   `gorm:"column:ISEXPORT"`
}

func (SDbFlmenu) TableName() string {
	return "dbflmenu"
}
