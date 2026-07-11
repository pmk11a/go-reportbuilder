package models

import (
	"time"

	"gorm.io/gorm"
)

// SDbBrowseConfig is the GORM model for the dbbrowseconfigs table.
// Database-driven browse configuration. New browse types can be added via
// DB INSERT without code changes.
type SDbBrowseConfig struct {
	ID              uint           `gorm:"primaryKey" json:"id"`
	KodeBrowse      string         `gorm:"size:50;column:kodebrowse;index;uniqueIndex:idx_dbbrowseconfigs_kodebrowse,where:deleted_at IS NULL" json:"kodebrowse"`
	TargetTable     *string        `gorm:"size:128;column:tablename" json:"tablename"`
	KeyField        *string        `gorm:"size:128;column:keyfield" json:"keyfield"`
	LabelField      *string        `gorm:"size:128;column:labelfield" json:"labelfield"`
	Query           *string        `gorm:"type:text;column:query" json:"query"`
	AdditionalFields StringSlice   `gorm:"type:text;column:additionalfields" json:"additionalfields"`
	Joins           StringSlice    `gorm:"type:text;column:joins" json:"joins"`
	WhereExtra      *string        `gorm:"type:text;column:whereextra" json:"whereextra"`
	AliasFields     JSONStringMap  `gorm:"type:text;column:aliasfields" json:"aliasfields"`
	ParentFilters   JSONStringSlice `gorm:"type:text;column:parentfilters" json:"parentfilters"`
	Params          JSONStringMap  `gorm:"type:text;column:params" json:"params"`
	IsActive        int            `gorm:"default:1;column:is_active" json:"isactive"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName explicitly maps SDbBrowseConfig to the dbbrowseconfigs table.
func (SDbBrowseConfig) TableName() string {
	return "dbbrowseconfigs"
}