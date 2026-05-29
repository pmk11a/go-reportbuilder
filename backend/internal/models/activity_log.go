package models

import (
	"time"
)

// SActivityLogConfig represents the configuration for which tables to track.
type SActivityLogConfig struct {
	ID              uint               `gorm:"primaryKey;autoIncrement" json:"id"`
	TargetTable     string             `gorm:"column:table_name;type:varchar(100);uniqueIndex;not null" json:"table_name"`
	DisplayName     string             `gorm:"type:varchar(100)" json:"display_name"`
	SourceName      string             `gorm:"type:varchar(100)" json:"source_name"`
	PrimaryKeyField string             `gorm:"type:varchar(50)" json:"primary_key_field"`
	IsEnabled       bool               `gorm:"default:true" json:"is_enabled"`
	LogCreate       bool               `gorm:"default:true" json:"log_create"`
	LogUpdate       bool               `gorm:"default:true" json:"log_update"`
	LogDelete       bool               `gorm:"default:true" json:"log_delete"`
	CreatedAt       time.Time          `json:"created_at"`
	UpdatedAt       time.Time          `json:"updated_at"`
	Fields          []SActivityLogField `gorm:"foreignKey:ConfigID;constraint:OnDelete:CASCADE;" json:"fields"`
}

func (SActivityLogConfig) TableName() string {
	return "activity_log_config"
}

// SActivityLogField represents the specific fields/columns to track for a table.
type SActivityLogField struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	ConfigID    uint      `gorm:"not null;uniqueIndex:idx_config_field" json:"config_id"`
	FieldName   string    `gorm:"type:varchar(100);not null;uniqueIndex:idx_config_field" json:"field_name"`
	DisplayName string    `gorm:"type:varchar(100)" json:"display_name"`
	IsTracked   bool      `gorm:"default:false" json:"is_tracked"`
	IsSensitive bool      `gorm:"default:false" json:"is_sensitive"`
	FieldType   string    `gorm:"type:varchar(20)" json:"field_type"` // string, numeric, boolean, date
	SortOrder   int       `gorm:"default:0" json:"sort_order"`
	CreatedAt   time.Time `json:"created_at"`
}

func (SActivityLogField) TableName() string {
	return "activity_log_fields"
}

// SDBLogFile represents the actual activity log record.
type SDBLogFile struct {
	ID         uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Tahun      int       `gorm:"column:Tahun" json:"tahun"`
	Bulan      int       `gorm:"column:Bulan" json:"bulan"`
	Tanggal    time.Time `gorm:"column:Tanggal" json:"tanggal"`
	Pemakai    string    `gorm:"column:Pemakai;type:varchar(50)" json:"pemakai"`
	Aktivitas  string    `gorm:"column:Aktivitas;type:varchar(255)" json:"aktivitas"`
	Sumber     string    `gorm:"column:Sumber;type:varchar(100)" json:"sumber"`
	NoBukti    string    `gorm:"column:NoBukti;type:varchar(100)" json:"no_bukti"`
	Keterangan string    `gorm:"column:Keterangan;type:text" json:"keterangan"` // In SQL Server, use text or varchar(max)
}

func (SDBLogFile) TableName() string {
	return "dblogfile"
}
