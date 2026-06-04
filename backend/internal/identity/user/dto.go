package user

// SCreateUserPayload defines input constraints for creating a legacy DBFLPASS user.
type SCreateUserPayload struct {
	Username string `json:"username" binding:"required,min=3"`
	Password string `json:"password" binding:"required,min=6"`
	FullName string `json:"full_name" binding:"required"`
	Role     string `json:"role" binding:"required,oneof=admin employee karyawan"`
}

// SUpdateUserPayload defines input constraints for updating a DBFLPASS user.
type SUpdateUserPayload struct {
	FullName string `json:"full_name" binding:"required"`
	Role     string `json:"role" binding:"required,oneof=admin employee karyawan"`
	Password string `json:"password"` // optional: leave blank to keep unchanged
	Status   string `json:"status"`   // optional: "0" = inactive, "1" = active
}
