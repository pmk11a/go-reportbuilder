package activity

import "time"

// SActivityLogConfigRes is the JSON response shape for an activity-log configuration entry.
type SActivityLogConfigRes struct {
	ID              uint                   `json:"id"`
	TableName       string                `json:"table_name"`
	TargetTable     string                `json:"target_table"`
	DisplayName     string                `json:"display_name"`
	SourceName      string                `json:"source_name"`
	PrimaryKeyField string                `json:"primary_key_field"`
	IsEnabled       bool                  `json:"is_enabled"`
	LogCreate       bool                  `json:"log_create"`
	LogUpdate       bool                  `json:"log_update"`
	LogDelete       bool                  `json:"log_delete"`
	Fields          []SActivityLogFieldRes `json:"fields"`
}

// SActivityLogConfigReq is the request payload for saving a new or updated activity-log configuration.
type SActivityLogConfigReq struct {
	TableName       string                 `json:"table_name" binding:"required"`
	TargetTable     string                 `json:"target_table" binding:"required"`
	DisplayName     string                 `json:"display_name"`
	SourceName      string                 `json:"source_name"`
	PrimaryKeyField string                `json:"primary_key_field"`
	IsEnabled       bool                   `json:"is_enabled"`
	LogCreate       bool                   `json:"log_create"`
	LogUpdate       bool                   `json:"log_update"`
	LogDelete       bool                   `json:"log_delete"`
	Fields          []SActivityLogFieldReq `json:"fields" binding:"required"`
}

// SActivityLogFieldRes is one field-entry in a configuration response.
type SActivityLogFieldRes struct {
	ID          uint   `json:"id"`
	ConfigID    uint   `json:"config_id"`
	FieldName   string `json:"field_name"`
	FieldType   string `json:"field_type"`
	DisplayName string `json:"display_name"`
	IsSensitive bool   `json:"is_sensitive"`
	IsTracked   bool   `json:"is_tracked"`
	SortOrder   int    `json:"sort_order"`
}

// SActivityLogFieldReq is the request payload for one field-entry in a configuration.
type SActivityLogFieldReq struct {
	FieldName   string `json:"field_name" binding:"required"`
	FieldType   string `json:"field_type"`
	DisplayName string `json:"display_name"`
	IsSensitive bool   `json:"is_sensitive"`
	IsTracked   bool   `json:"is_tracked"`
	SortOrder   int    `json:"sort_order"`
}

// SActivityLogRes is the JSON response shape for a single activity-log row.
type SActivityLogRes struct {
	ID         uint      `json:"id"`
	Tahun      int       `json:"tahun"`
	Bulan      int       `json:"bulan"`
	Tanggal    time.Time `json:"tanggal"`
	Aktivitas  string    `json:"aktivitas"`
	Pemakai    string    `json:"pemakai"`
	NoBukti    string    `json:"no_bukti"`
	Source     string    `json:"source"`
	Sumber     string    `json:"sumber"`
	Keterangan string    `json:"keterangan"`
	CreatedAt  string    `json:"created_at"`
}

// SActivityLogConfigMeta holds the runtime status of a config (used internally
// by the activity plugin to decide whether to log a table).
type SActivityLogConfigMeta struct {
	TableName   string
	TargetTable string
	Fields      []SActivityLogFieldRes
}
