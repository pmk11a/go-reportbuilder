package models

import (
	"time"
)

// SDBPERUSAHAAN represents the company settings table
type SDBPERUSAHAAN struct {
	KODEUSAHA      string     `gorm:"column:KODEUSAHA;primaryKey;size:10" json:"kodeusaha"`
	NAMA           *string    `gorm:"column:NAMA;size:100" json:"nama"`
	ALAMAT1        *string    `gorm:"column:ALAMAT1;size:255" json:"alamat1"`
	ALAMAT2        *string    `gorm:"column:ALAMAT2;size:255" json:"alamat2"`
	KOTA           *string    `gorm:"column:KOTA;size:50" json:"kota"`
	Telpon         *string    `gorm:"column:Telpon;size:20" json:"telpon"`
	Fax            *string    `gorm:"column:Fax;size:20" json:"fax"`
	Email          *string    `gorm:"column:email;size:100" json:"email"`
	Direksi        *string    `gorm:"column:Direksi;size:100" json:"direksi"`
	Jabatan        *string    `gorm:"column:Jabatan;size:100" json:"jabatan"`
	NAMAPKP        *string    `gorm:"column:NAMAPKP;size:100" json:"namapkp"`
	ALAMATPKP1     *string    `gorm:"column:ALAMATPKP1;size:255" json:"alamatpkp1"`
	ALAMATPKP2     *string    `gorm:"column:ALAMATPKP2;size:255" json:"alamatpkp2"`
	KOTAPKP        *string    `gorm:"column:KOTAPKP;size:50" json:"kotapkp"`
	NPWP           *string    `gorm:"column:NPWP;size:50" json:"npwp"`
	TGLPENGUKUHAN  *time.Time `gorm:"column:TGLPENGUKUHAN;type:datetime" json:"tglpengukuhan"`
	NAMAPKP1       *string    `gorm:"column:NAMAPKP1;size:100" json:"namapkp1"`
	ALAMATPKP21    *string    `gorm:"column:ALAMATPKP21;size:255" json:"alamatpkp21"`
	ALAMATPKP22    *string    `gorm:"column:ALAMATPKP22;size:255" json:"alamatpkp22"`
	KOTAPKP1       *string    `gorm:"column:KOTAPKP1;size:50" json:"kotapkp1"`
	NPWP1          *string    `gorm:"column:NPWP1;size:50" json:"npwp1"`
	TGLPENGUKUHAN1 *time.Time `gorm:"column:TGLPENGUKUHAN1;type:datetime" json:"tglpengukuhan1"`
	LOGO           []byte     `gorm:"column:LOGO" json:"logo,omitempty"`
	TTD            []byte     `gorm:"column:TTD" json:"ttd,omitempty"`
}

// TableName overrides the table name
func (SDBPERUSAHAAN) TableName() string {
	return "DBPERUSAHAAN"
}
