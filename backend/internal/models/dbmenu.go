package models

type SDbMenu struct {
	KODEMENU     string  `gorm:"primaryKey;column:KODEMENU;size:25"`
	Keterangan   string  `gorm:"column:Keterangan;size:500"`
	L0           int     `gorm:"column:L0"`
	ACCESS       int     `gorm:"column:ACCESS"`
	OL           int     `gorm:"column:OL"`
	TipeTrans    *string `gorm:"column:TipeTrans;size:8"`
	Routename    *string `gorm:"column:routename;size:255"`
	Icon         string  `gorm:"column:icon;size:50"`
	PlatformMask *int    `gorm:"column:PlatformMask"`
}

func (SDbMenu) TableName() string {
	return "DBMENU"
}
