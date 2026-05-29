package dto

import "time"

type SActivityLogConfigReq struct {
	TableName       string                 `json:"table_name" binding:"required"`
	DisplayName     string                 `json:"display_name"`
	SourceName      string                 `json:"source_name"`
	PrimaryKeyField string                 `json:"primary_key_field"`
	IsEnabled       bool                   `json:"is_enabled"`
	LogCreate       bool                   `json:"log_create"`
	LogUpdate       bool                   `json:"log_update"`
	LogDelete       bool                   `json:"log_delete"`
	Fields          []SActivityLogFieldReq  `json:"fields"`
}

type SActivityLogFieldReq struct {
	FieldName   string `json:"field_name" binding:"required"`
	DisplayName string `json:"display_name"`
	IsTracked   bool   `json:"is_tracked"`
	IsSensitive bool   `json:"is_sensitive"`
	FieldType   string `json:"field_type"`
	SortOrder   int    `json:"sort_order"`
}

type SActivityLogConfigRes struct {
	ID              uint                   `json:"id"`
	TableName       string                 `json:"table_name"`
	DisplayName     string                 `json:"display_name"`
	SourceName      string                 `json:"source_name"`
	PrimaryKeyField string                 `json:"primary_key_field"`
	IsEnabled       bool                   `json:"is_enabled"`
	LogCreate       bool                   `json:"log_create"`
	LogUpdate       bool                   `json:"log_update"`
	LogDelete       bool                   `json:"log_delete"`
	Fields          []SActivityLogFieldRes  `json:"fields"`
}

type SActivityLogFieldRes struct {
	ID          uint   `json:"id"`
	FieldName   string `json:"field_name"`
	DisplayName string `json:"display_name"`
	IsTracked   bool   `json:"is_tracked"`
	IsSensitive bool   `json:"is_sensitive"`
	FieldType   string `json:"field_type"`
	SortOrder   int    `json:"sort_order"`
}

type SActivityLogRes struct {
	ID         uint      `json:"id"`
	Tahun      int       `json:"tahun"`
	Bulan      int       `json:"bulan"`
	Tanggal    time.Time `json:"tanggal"`
	Pemakai    string    `json:"pemakai"`
	Aktivitas  string    `json:"aktivitas"`
	Sumber     string    `json:"sumber"`
	NoBukti    string    `json:"no_bukti"`
	Keterangan string    `json:"keterangan"`
}
