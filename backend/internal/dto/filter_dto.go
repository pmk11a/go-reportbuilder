package dto

type SPerkiraanResponse struct {
	ID          string `json:"id"`
	Text        string `json:"text"`
	Kode        string `json:"Kode"`
	Description string `json:"Description"`
	Perkiraan   string `json:"perkiraan,omitempty"`
	Keterangan  string `json:"keterangan,omitempty"`
	Kelompok    int    `json:"kelompok,omitempty"`
	L0          int    `json:"l0,omitempty"`
}
