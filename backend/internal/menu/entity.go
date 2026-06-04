package menu

// (Combined from legacy internal/models/dbmenu.go and dbmenureport.go.)
// Each GORM model implements TableName() so GORM does not auto-pluralize.

// SDbMenu is the master menu catalogue row.
type SDbMenu struct {
	KODEMENU     string  `gorm:"primaryKey;column:KODEMENU;size:25"`
	Keterangan   string  `gorm:"column:Keterangan;size:500"`
	L0           int     `gorm:"column:L0"`
	ACCESS       int     `gorm:"column:ACCESS"`
	OL           int     `gorm:"column:OL"`
	TipeTrans    *string `gorm:"column:TipeTrans;size:8"`
	Routename    *string `gorm:"column:routename;size:255"`
	Icon         string  `gorm:"column:icon;size:50"`
	PlatformMask *int    `gorm:"-"`
}

func (SDbMenu) TableName() string { return "DBMENU" }

// SDBMENUREPORT is the master report catalogue row.
type SDBMENUREPORT struct {
	KODEMENU   string `gorm:"column:KODEMENU;primaryKey;size:25" json:"kodemenu"`
	Keterangan string `gorm:"column:Keterangan;size:500" json:"keterangan"`
	L0         int    `gorm:"column:L0" json:"l0"`
	ACCESS     int    `gorm:"column:ACCESS" json:"access"`
	OL         int    `gorm:"column:OL" json:"ol"`
}

func (SDBMENUREPORT) TableName() string { return "DBMENUREPORT" }
