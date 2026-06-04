package models

import (
	"time"
)

// SDBJUALDET represents the DBJUALDET table
type SDBJUALDET struct {
	NOBUKTI string `gorm:"column:NOBUKTI;primaryKey;size:20" json:"nobukti"`
	URUT int `gorm:"column:URUT;primaryKey" json:"urut"`
	KODEBRG *string `gorm:"column:KODEBRG;size:25" json:"kodebrg"`
	KODEGDG *string `gorm:"column:KODEGDG;size:20" json:"kodegdg"`
	TGLKIRIM *time.Time `gorm:"column:TGLKIRIM" json:"tglkirim"`
	PPN *int `gorm:"column:PPN" json:"ppn"`
	DISC *float64 `gorm:"column:DISC" json:"disc"`
	KURS float64 `gorm:"column:KURS" json:"kurs"`
	QNT *float64 `gorm:"column:QNT" json:"qnt"`
	QNT2 *float64 `gorm:"column:QNT2" json:"qnt2"`
	QNTBATAL *float64 `gorm:"column:QNTBATAL" json:"qntbatal"`
	TGLBATAL *time.Time `gorm:"column:TGLBATAL" json:"tglbatal"`
	NOSAT *int `gorm:"column:NOSAT" json:"nosat"`
	SATUAN *string `gorm:"column:SATUAN;size:5" json:"satuan"`
	ISI *float64 `gorm:"column:ISI" json:"isi"`
	HARGA *float64 `gorm:"column:HARGA" json:"harga"`
	HPP *float64 `gorm:"column:HPP" json:"hpp"`
	DISCP1 float64 `gorm:"column:DISCP1" json:"discp1"`
	DISCRp1 float64 `gorm:"column:DISCRp1" json:"discrp1"`
	DISCTOT *float64 `gorm:"column:DISCTOT" json:"disctot"`
	BYANGKUT *float64 `gorm:"column:BYANGKUT" json:"byangkut"`
	NOSO string `gorm:"column:NOSO;size:30" json:"noso"`
	URUTSO int `gorm:"column:URUTSO" json:"urutso"`
	NOSJLN string `gorm:"column:NOSJLN;size:30" json:"nosjln"`
	URUTSJLN int `gorm:"column:URUTSJLN" json:"urutsjln"`
	HRGNETTO *float64 `gorm:"column:HRGNETTO" json:"hrgnetto"`
	NDISKON *float64 `gorm:"column:NDISKON" json:"ndiskon"`
	SUBTOTAL *float64 `gorm:"column:SUBTOTAL" json:"subtotal"`
	NDPP *float64 `gorm:"column:NDPP" json:"ndpp"`
	NPPN *float64 `gorm:"column:NPPN" json:"nppn"`
	NNET *float64 `gorm:"column:NNET" json:"nnet"`
	SUBTOTALRp *float64 `gorm:"column:SUBTOTALRp" json:"subtotalrp"`
	NDPPRp *float64 `gorm:"column:NDPPRp" json:"ndpprp"`
	NPPNRp *float64 `gorm:"column:NPPNRp" json:"nppnrp"`
	NNETRp *float64 `gorm:"column:NNETRp" json:"nnetrp"`
	NetW float64 `gorm:"column:NetW" json:"netw"`
	GrossW float64 `gorm:"column:GrossW" json:"grossw"`
}

// TableName overrides the default table name for SDBJUALDET
func (SDBJUALDET) TableName() string {
	return "DBJUALDET"
}
