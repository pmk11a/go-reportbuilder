package models

// SDBAKSESPERKIRAAN represents the DBAKSESPERKIRAAN table
type SDBAKSESPERKIRAAN struct {
	UserID string `gorm:"column:UserID;primaryKey;size:25" json:"userid"`
	Perkiraan string `gorm:"column:Perkiraan;primaryKey;size:25" json:"perkiraan"`
}

// TableName overrides the default table name for SDBAKSESPERKIRAAN
func (SDBAKSESPERKIRAAN) TableName() string {
	return "DBAKSESPERKIRAAN"
}
