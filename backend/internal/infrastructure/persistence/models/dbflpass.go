package models

type SDBFLPASS struct {
	USERID    string `gorm:"primaryKey;column:USERID;size:50;not null" json:"user_id"`
	UID       string `gorm:"column:UID;size:50" json:"-"`
	FullName  string `gorm:"column:FullName;size:100" json:"full_name"`
	TINGKAT   string `gorm:"column:TINGKAT;size:2" json:"tingkat"`
	STATUS    string `gorm:"column:STATUS;size:1" json:"status"`
	HOSTID    string `gorm:"column:HOSTID;size:50" json:"host_id"`
	IPAddres  string `gorm:"column:IPAddres;size:50" json:"ip_address"`
	KodeBag   string `gorm:"column:kodeBag;size:10" json:"kode_bag"`
	KodeJab   string `gorm:"column:KodeJab;size:10" json:"kode_jab"`
	KodeKasir string `gorm:"column:KodeKasir;size:10" json:"kode_kasir"`
	Kodegdg   string `gorm:"column:Kodegdg;size:10" json:"kode_gdg"`
	Keynik    string `gorm:"column:keynik;size:50" json:"keynik"`
	UID2      string `gorm:"column:UID2;size:100" json:"-"` // Legacy password hash
}

func (SDBFLPASS) TableName() string {
	return "DBFLPASS"
}
