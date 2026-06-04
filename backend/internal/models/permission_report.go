package models

// SPermissionReportRow represents a single row in the Permission Report matrix.
// It joins DBFLPASS (user metadata) with dbmenu or dbmenureport (permissions)
// to produce one human-readable record per user-menu pair.
type SPermissionReportRow struct {
	UserID     string `gorm:"column:USERID"   json:"user_id"`
	Username   string `gorm:"column:USERID"   json:"username"`
	FullName   string `gorm:"column:FullName" json:"full_name"`
	Role       string `gorm:"column:role"     json:"role"`
	MenuCode   string `gorm:"column:KODEMENU" json:"menu_code"`
	MenuName   string `gorm:"column:Keterangan" json:"menu_name"`
	MenuType   string `gorm:"column:menu_type"  json:"menu_type"` // "menu" or "report"
	HasAccess  int    `gorm:"column:HASACCESS"  json:"has_access"`
	IsCreate   int    `gorm:"column:ISTAMBAH"   json:"is_create"`
	IsUpdate   int    `gorm:"column:ISKOREKSI"  json:"is_update"`
	IsDelete   int    `gorm:"column:ISHAPUS"    json:"is_delete"`
	IsPrint    int    `gorm:"column:ISCETAK"    json:"is_print"`
	IsExport   int    `gorm:"column:ISEXPORT"   json:"is_export"`
	IsApprove1 int    `gorm:"column:IsOtorisasi1" json:"is_approve_1"`
	IsApprove2 int    `gorm:"column:IsOtorisasi2" json:"is_approve_2"`
	IsApprove3 int    `gorm:"column:IsOtorisasi3" json:"is_approve_3"`
	IsApprove4 int    `gorm:"column:IsOtorisasi4" json:"is_approve_4"`
	IsApprove5 int    `gorm:"column:IsOtorisasi5" json:"is_approve_5"`
	IsCanceled int    `gorm:"column:IsBatal"    json:"is_canceled"`
}
