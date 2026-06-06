package filters

// SPerkiraanResponse is the JSON shape returned by the shared perkiraan
// autocomplete/select widget. The optional fields (Perkiraan, Keterangan,
// Kelompok, L0) are populated only when relevant to the caller's view.
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
