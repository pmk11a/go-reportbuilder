package models

import (
	"time"
)

// SDBAKTIVA represents the DBAKTIVA table
type SDBAKTIVA struct {
	Devisi string `gorm:"column:Devisi;primaryKey;size:15" json:"devisi"`
	Perkiraan string `gorm:"column:Perkiraan;primaryKey;size:30" json:"perkiraan"`
	Keterangan string `gorm:"column:Keterangan;size:500" json:"keterangan"`
	Quantity float64 `gorm:"column:Quantity" json:"quantity"`
	Persen float64 `gorm:"column:Persen" json:"persen"`
	Tanggal *time.Time `gorm:"column:Tanggal" json:"tanggal"`
	Tipe string `gorm:"column:Tipe;size:50" json:"tipe"`
	Kodebag string `gorm:"column:Kodebag;size:15" json:"kodebag"`
	Akumulasi string `gorm:"column:Akumulasi;size:25" json:"akumulasi"`
	NoMuka string `gorm:"column:NoMuka;size:25" json:"nomuka"`
	NoBelakang string `gorm:"column:NoBelakang;size:20" json:"nobelakang"`
	Biaya string `gorm:"column:Biaya;size:25" json:"biaya"`
	PersenBiaya1 float64 `gorm:"column:PersenBiaya1" json:"persenbiaya1"`
	Biaya2 string `gorm:"column:Biaya2;size:25" json:"biaya2"`
	PersenBiaya2 float64 `gorm:"column:PersenBiaya2" json:"persenbiaya2"`
	Biaya3 string `gorm:"column:biaya3;size:25" json:"biaya3"`
	Persenbiaya3 float64 `gorm:"column:persenbiaya3" json:"persenbiaya3"`
	Biaya4 string `gorm:"column:biaya4;size:25" json:"biaya4"`
	Persenbiaya4 float64 `gorm:"column:persenbiaya4" json:"persenbiaya4"`
	TipeAktiva int `gorm:"column:TipeAktiva" json:"tipeaktiva"`
	NoBelakang2 *string `gorm:"column:NoBelakang2;size:20" json:"nobelakang2"`
	NoAktivaHd *string `gorm:"column:NoAktivaHd;size:35" json:"noaktivahd"`
	Kelompok int `gorm:"column:Kelompok" json:"kelompok"`
	GroupAktiva string `gorm:"column:GroupAktiva;size:15" json:"groupaktiva"`
	NoBuktiSem *string `gorm:"column:NoBuktiSem;size:30" json:"nobuktisem"`

	// Relationships
	NoMukaPerkiraan *SDbPerkiraan `gorm:"foreignKey:NoMuka;references:Perkiraan" json:"nomuka_perkiraan,omitempty"`
	AkumulasiPerkiraan *SDbPerkiraan `gorm:"foreignKey:Akumulasi;references:Perkiraan" json:"akumulasi_perkiraan,omitempty"`
	BiayaPerkiraan *SDbPerkiraan `gorm:"foreignKey:Biaya;references:Perkiraan" json:"biaya_perkiraan,omitempty"`
	DBDevisi *SDBDEVISI `gorm:"foreignKey:Devisi;references:Devisi" json:"dbdevisi,omitempty"`
}

// TableName overrides the default table name for SDBAKTIVA
func (SDBAKTIVA) TableName() string {
	return "DBAKTIVA"
}
