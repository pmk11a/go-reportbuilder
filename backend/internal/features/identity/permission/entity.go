package permission

// Package permission owns the user-permission model and DTOs.
// Migrations note: per the project's Domain-Based + DDD-Lite architecture,
// all permission-related GORM entities and HTTP DTOs live here in the
// identity/permission sub-domain. Legacy CRUD tables (dbflmenu, DBFLMENUREPORT,
// DBAKSESPERKIRAAN) are read with composite JOINs against the master
// DBMENU / DBMENUREPORT catalogues.

// SUserPermission maps a single row from the legacy dbflmenu or DBFLMENUREPORT
// table for a specific USERID. Used for reading and updating user access controls.
// Supports both simple access model (checked/aktif/access) and granular permissions.
type SUserPermission struct {
	// Menu hierarchy & metadata
	KodeMenu   string  `gorm:"column:KODEMENU" json:"kodemenu"`
	Keterangan string  `gorm:"column:Keterangan" json:"keterangan"`
	L0         int     `gorm:"column:L0" json:"l0"`
	L1         int     `gorm:"column:L1" json:"l1"`
	L2         int     `gorm:"column:L2" json:"l2"`
	L3         int     `gorm:"column:L3" json:"l3"`
	Icon       string  `gorm:"column:Icon" json:"icon"`
	Routename  *string `gorm:"column:Routename" json:"routename"`

	// Legacy simple model (for backward compatibility)
	Checked int `gorm:"column:checked" json:"checked"`
	Aktif   int `gorm:"column:aktif" json:"aktif"`
	Access  int `gorm:"column:ACCESS" json:"access"`

	// Granular permissions from Laravel DbFlmenu
	HasAccess  int `gorm:"column:HASACCESS" json:"has_access"`
	IsCreate   int `gorm:"column:ISTAMBAH" json:"is_create"`
	IsUpdate   int `gorm:"column:ISKOREKSI" json:"is_update"`
	IsDelete   int `gorm:"column:ISHAPUS" json:"is_delete"`
	IsPrint    int `gorm:"column:ISCETAK" json:"is_print"`
	IsExport   int `gorm:"column:ISEXPORT" json:"is_export"`
	IsApprove1 int `gorm:"column:IsOtorisasi1" json:"is_approve_1"`
	IsApprove2 int `gorm:"column:IsOtorisasi2" json:"is_approve_2"`
	IsApprove3 int `gorm:"column:IsOtorisasi3" json:"is_approve_3"`
	IsApprove4 int `gorm:"column:IsOtorisasi4" json:"is_approve_4"`
	IsApprove5 int `gorm:"column:IsOtorisasi5" json:"is_approve_5"`
	IsCanceled int `gorm:"column:IsBatal" json:"is_canceled"`
}

// SUserCoaAccess maps a row from DBAKSESPERKIRAAN, representing a COA entry
// that the user has access to.
type SUserCoaAccess struct {
	Perkiraan  string `gorm:"column:Perkiraan" json:"perkiraan"`
	Keterangan string `gorm:"column:Keterangan" json:"keterangan"`
	Checked    int    `gorm:"column:checked" json:"checked"` // 0 = no access, 1 = has access
}

// SPermissionReportRow represents a single row in the Permission Report matrix.
// It joins DBFLPASS (user metadata) with dbflmenu or DBFLMENUREPORT (permissions)
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

// SDbFlmenu mirrors the legacy dbflmenu composite-PK table used to scope
// per-user granular permission flags. The pair (USERID, L1) is the primary key.
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
