package dashboard

import "time"

// SPensiunanWithoutFiles is the JSON shape for one row in the
// "pensiunan without uploaded files" list.
type SPensiunanWithoutFiles struct {
	KODECUSTSUPP    string  `json:"KODECUSTSUPP"`
	NAMACUSTSUPP    string  `json:"NAMACUSTSUPP"`
	NoPegawai       *string `json:"NoPegawai"`
	TglLahir        *string `json:"TglLahir"`
	TglPensiun      *string `json:"TglPensiun"`
	TglKepersertaan *string `json:"TglKepersertaan"`
}

// SRawPensiunan is the raw row shape produced by the dashboard's
// custom SQL query (uses *time.Time for the date columns so GORM
// can scan them before we reformat to ISO strings on the way out).
type SRawPensiunan struct {
	KODECUSTSUPP    string     `gorm:"column:KODECUSTSUPP"`
	NAMACUSTSUPP    string     `gorm:"column:NAMACUSTSUPP"`
	NoPegawai       *string    `gorm:"column:NoPegawai"`
	TglLahir        *time.Time `gorm:"column:TglLahir"`
	TglPensiun      *time.Time `gorm:"column:TglPensiun"`
	TglKepersertaan *time.Time `gorm:"column:TglKepersertaan"`
}
