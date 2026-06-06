package models

import (
	"time"
)

// SDBKARYAWAN represents the DBKARYAWAN table
type SDBKARYAWAN struct {
	KeyNIK int `gorm:"column:KeyNIK;primaryKey" json:"keynik"`
	TipeTrans *string `gorm:"column:TipeTrans;size:10" json:"tipetrans"`
	NoBukti *string `gorm:"column:NoBukti;size:30" json:"nobukti"`
	NIK *string `gorm:"column:NIK;size:10" json:"nik"`
	Nama *string `gorm:"column:Nama;size:50" json:"nama"`
	NamaPanggilan *string `gorm:"column:NamaPanggilan;size:50" json:"namapanggilan"`
	Kelamin *string `gorm:"column:Kelamin;size:1" json:"kelamin"`
	TmpLahir *string `gorm:"column:TmpLahir;size:30" json:"tmplahir"`
	TglLahir *time.Time `gorm:"column:TglLahir" json:"tgllahir"`
	Agama *string `gorm:"column:Agama;size:20" json:"agama"`
	Tinggi *float64 `gorm:"column:Tinggi" json:"tinggi"`
	Berat *float64 `gorm:"column:Berat" json:"berat"`
	BerkacaMata *int `gorm:"column:BerkacaMata" json:"berkacamata"`
	Darah *string `gorm:"column:Darah;size:2" json:"darah"`
	NomorKTP *string `gorm:"column:NomorKTP;size:50" json:"nomorktp"`
	AlamatKTP *string `gorm:"column:AlamatKTP;size:100" json:"alamatktp"`
	KecamatanKTP *string `gorm:"column:KecamatanKTP;size:30" json:"kecamatanktp"`
	KabupatenKTP *string `gorm:"column:KabupatenKTP;size:30" json:"kabupatenktp"`
	PropinsiKTP *string `gorm:"column:PropinsiKTP;size:30" json:"propinsiktp"`
	KodePosKTP *string `gorm:"column:KodePosKTP;size:20" json:"kodeposktp"`
	AlamatRmh *string `gorm:"column:AlamatRmh;size:100" json:"alamatrmh"`
	KecamatanRmh *string `gorm:"column:KecamatanRmh;size:30" json:"kecamatanrmh"`
	KabupatenRmh *string `gorm:"column:KabupatenRmh;size:30" json:"kabupatenrmh"`
	PropinsiRmh *string `gorm:"column:PropinsiRmh;size:30" json:"propinsirmh"`
	KodePosRmh *string `gorm:"column:KodePosRmh;size:20" json:"kodeposrmh"`
	TeleponHP *string `gorm:"column:TeleponHP;size:60" json:"teleponhp"`
	KodePendAkhir *string `gorm:"column:KodePendAkhir;size:20" json:"kodependakhir"`
	KetPendAkhir *string `gorm:"column:KetPendAkhir;size:50" json:"ketpendakhir"`
	StatusTempTinggal *string `gorm:"column:StatusTempTinggal;size:20" json:"statustemptinggal"`
	Hubungan *int `gorm:"column:Hubungan" json:"hubungan"`
	Referensi *string `gorm:"column:Referensi;size:100" json:"referensi"`
	Rekomendasi *int `gorm:"column:Rekomendasi" json:"rekomendasi"`
	NamaR *string `gorm:"column:NamaR;size:100" json:"namar"`
	JabatanR *string `gorm:"column:JabatanR;size:100" json:"jabatanr"`
	NamaInstR *string `gorm:"column:NamaInstR;size:100" json:"namainstr"`
	AlamatR *string `gorm:"column:AlamatR;size:100" json:"alamatr"`
	TglMasuk *time.Time `gorm:"column:TglMasuk" json:"tglmasuk"`
	TglKeluar *time.Time `gorm:"column:TglKeluar" json:"tglkeluar"`
	BankAccount *string `gorm:"column:BankAccount;size:50" json:"bankaccount"`
	NomorAstek *string `gorm:"column:NomorAstek;size:50" json:"nomorastek"`
	TglAstek *time.Time `gorm:"column:TglAstek" json:"tglastek"`
	KodeShf *string `gorm:"column:KodeShf;size:15" json:"kodeshf"`
	KodeJab *string `gorm:"column:KodeJab;size:20" json:"kodejab"`
	KodeDept *string `gorm:"column:KodeDept;size:20" json:"kodedept"`
	KodeESL *string `gorm:"column:KodeESL;size:20" json:"kodeesl"`
	KodeGrade *string `gorm:"column:KodeGrade;size:20" json:"kodegrade"`
	GajiPokok *float64 `gorm:"column:GajiPokok" json:"gajipokok"`
	TnjJabatan *float64 `gorm:"column:TnjJabatan" json:"tnjjabatan"`
	TnjKehadiran *float64 `gorm:"column:TnjKehadiran" json:"tnjkehadiran"`
	TnjTransport *float64 `gorm:"column:TnjTransport" json:"tnjtransport"`
	TnjMakan *float64 `gorm:"column:TnjMakan" json:"tnjmakan"`
	TnjLain2 *float64 `gorm:"column:TnjLain2" json:"tnjlain2"`
	TnjHaid *float64 `gorm:"column:TnjHaid" json:"tnjhaid"`
	JKK *float64 `gorm:"column:JKK" json:"jkk"`
	JHT *float64 `gorm:"column:JHT" json:"jht"`
	JPK *float64 `gorm:"column:JPK" json:"jpk"`
	JKM *float64 `gorm:"column:JKM" json:"jkm"`
	Prima *float64 `gorm:"column:Prima" json:"prima"`
	TnjPajak *bool `gorm:"column:TnjPajak" json:"tnjpajak"`
	StsPJK *string `gorm:"column:StsPJK;size:20" json:"stspjk"`
	StsAST *string `gorm:"column:StsAST;size:20" json:"stsast"`
	Tanggung *float64 `gorm:"column:Tanggung" json:"tanggung"`
	NPWP *string `gorm:"column:NPWP;size:50" json:"npwp"`
	Aktif *int `gorm:"column:Aktif" json:"aktif"`
	LamaKontrak *int `gorm:"column:LamaKontrak" json:"lamakontrak"`
	TglAkhirKontrak *time.Time `gorm:"column:TglAkhirKontrak" json:"tglakhirkontrak"`
	IDUserInput *string `gorm:"column:IDUserInput;size:30" json:"iduserinput"`
	TglInput *time.Time `gorm:"column:TglInput" json:"tglinput"`
	IsSales *bool `gorm:"column:IsSales" json:"issales"`
	Produksi *int `gorm:"column:Produksi" json:"produksi"`
	KodeGdg string `gorm:"column:KodeGdg;size:15" json:"kodegdg"`
	KodeCost string `gorm:"column:KodeCost;size:30" json:"kodecost"`

	// Relationships
	DBJabatan *SDBJABATAN `gorm:"foreignKey:KodeJab;references:KODEJAB" json:"dbjabatan,omitempty"`
}

// TableName overrides the default table name for SDBKARYAWAN
func (SDBKARYAWAN) TableName() string {
	return "DBKARYAWAN"
}
