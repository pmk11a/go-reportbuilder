package activity

import (
	"time"
)

// SActivityLogConfig represents the configuration for which tables to track.
type SActivityLogConfig struct {
	ID              uint               `gorm:"primaryKey;autoIncrement" json:"id"`
	TargetTable     string             `gorm:"column:table_name;size:100;uniqueIndex;not null" json:"table_name"`
	DisplayName     string             `gorm:"size:100" json:"display_name"`
	SourceName      string             `gorm:"size:100" json:"source_name"`
	PrimaryKeyField string             `gorm:"size:50" json:"primary_key_field"`
	IsEnabled       bool               `gorm:"default:true" json:"is_enabled"`
	LogCreate       bool               `gorm:"default:true" json:"log_create"`
	LogUpdate       bool               `gorm:"default:true" json:"log_update"`
	LogDelete       bool               `gorm:"default:true" json:"log_delete"`
	CreatedAt       time.Time          `gorm:"type:datetime" json:"created_at"`
	UpdatedAt       time.Time          `gorm:"type:datetime" json:"updated_at"`
	Fields          []SActivityLogField `gorm:"foreignKey:ConfigID;constraint:OnDelete:CASCADE;" json:"fields"`
}

func (SActivityLogConfig) TableName() string {
	return "activity_log_config"
}

// SActivityLogField represents the specific fields/columns to track for a table.
type SActivityLogField struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	ConfigID    uint      `gorm:"not null;uniqueIndex:idx_config_field" json:"config_id"`
	FieldName   string    `gorm:"size:100;not null;uniqueIndex:idx_config_field" json:"field_name"`
	DisplayName string    `gorm:"size:100" json:"display_name"`
	IsTracked   bool      `gorm:"default:false" json:"is_tracked"`
	IsSensitive bool      `gorm:"default:false" json:"is_sensitive"`
	FieldType   string    `gorm:"size:20" json:"field_type"` // string, numeric, boolean, date
	SortOrder   int       `gorm:"default:0" json:"sort_order"`
	CreatedAt   time.Time `gorm:"type:datetime" json:"created_at"`
}

func (SActivityLogField) TableName() string {
	return "activity_log_fields"
}

// SDBLogFile represents the actual activity log record.
// Note: dblogfile table in SQL Server does not have an explicit id column
type SDBLogFile struct {
	Tahun      int32     `gorm:"column:Tahun;type:int;not null" json:"tahun"`
	Bulan      int32     `gorm:"column:Bulan;type:int;not null" json:"bulan"`
	Tanggal    time.Time `gorm:"column:Tanggal;type:datetime;primaryKey" json:"tanggal"` // Use as composite key
	Pemakai    string    `gorm:"column:Pemakai;type:varchar(20);not null;primaryKey" json:"pemakai"`
	Aktivitas  string    `gorm:"column:Aktivitas;type:varchar(200);not null" json:"aktivitas"`
	Sumber     string    `gorm:"column:Sumber;type:varchar(200);not null" json:"sumber"`
	NoBukti    string    `gorm:"column:NoBukti;type:varchar(30);not null" json:"no_bukti"`
	Keterangan string    `gorm:"column:Keterangan;type:varchar(4000);not null" json:"keterangan"`
}

func (SDBLogFile) TableName() string {
	return "dblogfile"
}
