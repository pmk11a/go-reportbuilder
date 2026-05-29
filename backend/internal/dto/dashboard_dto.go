package dto

import "time"

type SMenuResponseItem struct {
	Code        string           `json:"code"`
	Icon        string           `json:"icon"`
	Route       string           `json:"route"`
	TipeTrans   string           `json:"TipeTrans"`
	Title       string           `json:"title"`
	Type        string           `json:"type"`
	Items       []SMenuResponseItem `json:"items,omitempty"`
	Permissions *SMenuPermissions `json:"permissions,omitempty"`
}

type SMenuPermissions struct {
	Access bool `json:"access"`
	Add    bool `json:"add"`
	Edit   bool `json:"edit"`
	Delete bool `json:"delete"`
	Print  bool `json:"print"`
	Export bool `json:"export"`
}

type SPensiunanWithoutFiles struct {
	KODECUSTSUPP    string  `json:"KODECUSTSUPP"`
	NAMACUSTSUPP    string  `json:"NAMACUSTSUPP"`
	NoPegawai       *string `json:"NoPegawai"`
	TglLahir        *string `json:"TglLahir"`
	TglPensiun      *string `json:"TglPensiun"`
	TglKepersertaan *string `json:"TglKepersertaan"`
}

type SRawPensiunan struct {
	KODECUSTSUPP    string     `gorm:"column:KODECUSTSUPP"`
	NAMACUSTSUPP    string     `gorm:"column:NAMACUSTSUPP"`
	NoPegawai       *string    `gorm:"column:NoPegawai"`
	TglLahir        *time.Time `gorm:"column:TglLahir"`
	TglPensiun      *time.Time `gorm:"column:TglPensiun"`
	TglKepersertaan *time.Time `gorm:"column:TglKepersertaan"`
}
