package permission

// SUpdateUserPermissionsPayload defines the input shape for PUT
// /api/admin/users/{id}/permissions. The frontend sends a split body:
// menu, report, and COA access each as their own slice.
type SUpdateUserPermissionsPayload struct {
	Menu   []SUserPermissionPayload `json:"menu"`
	Report []SUserPermissionPayload `json:"report"`
	Coa    []SUserCoaPayload        `json:"coa"`
}

// SUserPermissionPayload mirrors a single permission row sent by the frontend
// for either menu (dbflmenu) or report (DBFLMENUREPORT). Supports the legacy
// simple model and the granular permission set.
type SUserPermissionPayload struct {
	KodeMenu   string  `json:"kodemenu"`
	Keterangan string  `json:"keterangan"`
	L0         int     `json:"l0"`
	L1         int     `json:"l1"`
	L2         int     `json:"l2"`
	L3         int     `json:"l3"`
	Icon       string  `json:"icon"`
	Routename  *string `json:"routename"`

	// Legacy simple model
	Checked int `json:"checked"`
	Aktif   int `json:"aktif"`
	Access  int `json:"access"`

	// Granular permissions
	HasAccess  int `json:"has_access"`
	IsCreate   int `json:"is_create"`
	IsUpdate   int `json:"is_update"`
	IsDelete   int `json:"is_delete"`
	IsPrint    int `json:"is_print"`
	IsExport   int `json:"is_export"`
	IsApprove1 int `json:"is_approve_1"`
	IsApprove2 int `json:"is_approve_2"`
	IsApprove3 int `json:"is_approve_3"`
	IsApprove4 int `json:"is_approve_4"`
	IsApprove5 int `json:"is_approve_5"`
	IsCanceled int `json:"is_canceled"`
}

// SUserCoaPayload mirrors a single row from DBAKSESPERKIRAAN.
type SUserCoaPayload struct {
	Perkiraan  string `json:"perkiraan"`
	Keterangan string `json:"keterangan"`
	Checked    int    `json:"checked"`
}

// SPermissionReportRowDTO is the JSON-shaped version of a permission report
// row sent to the frontend. Mirrors permission.SPermissionReportRow.
type SPermissionReportRowDTO struct {
	UserID     string `json:"user_id"`
	Username   string `json:"username"`
	FullName   string `json:"full_name"`
	Role       string `json:"role"`
	MenuCode   string `json:"menu_code"`
	MenuName   string `json:"menu_name"`
	MenuType   string `json:"menu_type"`
	HasAccess  int    `json:"has_access"`
	IsCreate   int    `json:"is_create"`
	IsUpdate   int    `json:"is_update"`
	IsDelete   int    `json:"is_delete"`
	IsPrint    int    `json:"is_print"`
	IsExport   int    `json:"is_export"`
	IsApprove1 int    `json:"is_approve_1"`
	IsApprove2 int    `json:"is_approve_2"`
	IsApprove3 int    `json:"is_approve_3"`
	IsApprove4 int    `json:"is_approve_4"`
	IsApprove5 int    `json:"is_approve_5"`
	IsCanceled int    `json:"is_canceled"`
}

// SPermissionReportResponse is the paginated JSON response for the
// /admin/reports/permissions?format=json endpoint.
type SPermissionReportResponse struct {
	Data    []SPermissionReportRowDTO `json:"data"`
	Total   int64                     `json:"total"`
	Page    int                       `json:"page"`
	PerPage int                       `json:"per_page"`
}

// SReportFilters holds the optional filters for the Permission Report
// endpoint. All fields are optional; empty values mean "no filter".
type SReportFilters struct {
	UserID   *string `json:"user_id,omitempty"   form:"userId"`
	MenuID   *string `json:"menu_id,omitempty"   form:"menuId"`
	MenuType string  `json:"menu_type,omitempty"  form:"menuType"` // "menu" or "report", default "menu"
	Page     int     `json:"page,omitempty"       form:"page"`
	PerPage  int     `json:"per_page,omitempty"   form:"perPage"`
}
