package dto

// SCreateUserPayload defines input constraints for creating a legacy DBFLPASS user
type SCreateUserPayload struct {
	Username string `json:"username" binding:"required,min=3"`
	Password string `json:"password" binding:"required,min=6"`
	FullName string `json:"full_name" binding:"required"`
	Role     string `json:"role" binding:"required,oneof=admin employee karyawan"`
}

// SUpdateUserPayload defines input constraints for updating a DBFLPASS user
type SUpdateUserPayload struct {
	FullName string `json:"full_name" binding:"required"`
	Role     string `json:"role" binding:"required,oneof=admin employee karyawan"`
	Password string `json:"password"`  // optional: leave blank to keep unchanged
	Status   string `json:"status"`    // optional: "0" = inactive, "1" = active
}

// SUpdateUserPermissionsPayload defines input constraints for updating user permissions
type SUpdateUserPermissionsPayload struct {
	Menu   []SUserPermissionPayload `json:"menu"`
	Report []SUserPermissionPayload `json:"report"`
	Coa    []SUserCoaPayload        `json:"coa"`
}

// SUserPermissionPayload mirrors the legacy dbmenu / dbmenureport permission row
type SUserPermissionPayload struct {
	KodeMenu   string  `json:"kodemenu"`
	Keterangan string  `json:"keterangan"`
	L0         int     `json:"l0"`
	L1         int     `json:"l1"`
	L2         int     `json:"l2"`
	L3         int     `json:"l3"`
	Checked    int     `json:"checked"`
	Aktif      int     `json:"aktif"`
	Access     int     `json:"access"`
	Icon       string  `json:"icon"`
	Routename  *string `json:"routename"`
}

// SUserCoaPayload mirrors a single row from DBAKSESPERKIRAAN
type SUserCoaPayload struct {
	Perkiraan  string `json:"perkiraan"`
	Keterangan string `json:"keterangan"`
	Checked    int    `json:"checked"` // 0 = no access, 1 = has access
}
