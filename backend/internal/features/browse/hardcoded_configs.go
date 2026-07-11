package browse

// hardcodedConfigs is the fallback map mirroring BrowseService::getConfigMap()
// in the Laravel project. The actual production data lives in dbbrowseconfigs;
// this map only kicks in if no DB row exists.
var hardcodedConfigs = map[string]*Config{
	"1001": {
		Table:      "DBPERKIRAAN",
		KeyField:   "Perkiraan",
		LabelField: "Keterangan",
		AdditionalFields: []string{"Simbol", "Tipe", "DK"},
		Joins: []string{
			"LEFT JOIN DBAKSESPERKIRAAN ak ON ak.Perkiraan = DBPERKIRAAN.Perkiraan AND ak.UserMode = :userMode",
		},
		WhereExtra: "AND DBPERKIRAAN.Tipe = 1",
	},
	"1005": {
		Table:            "DBPERKIRAAN",
		KeyField:         "Perkiraan",
		LabelField:       "Keterangan",
		AdditionalFields: []string{"Simbol"},
		WhereExtra:       "AND DBPERKIRAAN.Tipe = 1",
	},
	"10051": {
		Table:            "DBPERKIRAAN",
		KeyField:         "Perkiraan",
		LabelField:       "Keterangan",
		AdditionalFields: []string{"Simbol", "Tipe", "DK"},
		Joins: []string{
			"LEFT JOIN DBAKSESPERKIRAAN ak ON ak.Perkiraan = DBPERKIRAAN.Perkiraan AND ak.UserMode = :userMode",
		},
		WhereExtra: "AND DBPERKIRAAN.Tipe = 1",
	},
	"100444": {
		Table:      "DBPERKIRAAN",
		KeyField:   "Perkiraan",
		LabelField: "Keterangan",
		WhereExtra: "AND DBPERKIRAAN.Tipe = 1",
	},
	"10053": {
		Table:      "DBPERKIRAAN",
		KeyField:   "Perkiraan",
		LabelField: "Keterangan",
		WhereExtra: "AND DBPERKIRAAN.Kelompok = 3 AND DBPERKIRAAN.Tipe = 1",
	},
	"10054": {
		Table:      "DBLRHPP",
		KeyField:   "Nomor",
		LabelField: "Keterangan",
	},
	"10055": {
		Table:      "DBPERKIRAAN",
		KeyField:   "Perkiraan",
		LabelField: "Keterangan",
		Joins: []string{
			"LEFT JOIN DBAKSESPERKIRAAN ak ON ak.Perkiraan = DBPERKIRAAN.Perkiraan AND ak.UserMode = :userMode",
		},
		WhereExtra: "AND DBPERKIRAAN.Tipe = 1",
	},
	"10059": {
		Table:      "DBPERKIRAAN",
		KeyField:   "Perkiraan",
		LabelField: "Keterangan",
		Joins: []string{
			"LEFT JOIN DBAKSESPERKIRAAN ak ON ak.Perkiraan = DBPERKIRAAN.Perkiraan AND ak.UserMode = :userMode",
		},
		WhereExtra: "AND DBPERKIRAAN.Tipe = 1",
	},
	"100408": {
		Table:      "DBPERKIRAAN",
		KeyField:   "Perkiraan",
		LabelField: "Keterangan",
		Joins: []string{
			"INNER JOIN DBPOSTHUTPIUT pht ON pht.Perkiraan = DBPERKIRAAN.Perkiraan",
		},
		WhereExtra: "AND pht.Kode = 'PT'",
	},
	"100409": {
		Table:      "DBPERKIRAAN",
		KeyField:   "Perkiraan",
		LabelField: "Keterangan",
		Joins: []string{
			"INNER JOIN DBPOSTHUTPIUT pht ON pht.Perkiraan = DBPERKIRAAN.Perkiraan",
		},
		WhereExtra: "AND pht.Kode = 'HT'",
	},
	"1007": {
		Table:      "DBDEPART",
		KeyField:   "Kode",
		LabelField: "Keterangan",
	},
	"1008": {
		Table:      "DBBAGIAN",
		KeyField:   "Kode",
		LabelField: "Keterangan",
	},
	"1009": {
		Table:            "DBCUSTSUPP",
		KeyField:         "Kode",
		LabelField:       "Nama",
		AdditionalFields: []string{"Alamat", "Kota", "Telepon"},
	},
	"1010": {
		Table:            "DBBARANG",
		KeyField:         "Kode",
		LabelField:       "Nama",
		AdditionalFields: []string{"Satuan", "Kelompok"},
	},
	"1011": {
		Table:      "DBAKTIVA",
		KeyField:   "Kode",
		LabelField: "Keterangan",
	},
	"1012": {
		Table:      "DBGIRO",
		KeyField:   "Nomor",
		LabelField: "Keterangan",
	},
	"1013": {
		Table:      "DBLOCKPERIODE",
		KeyField:   "Kode",
		LabelField: "Keterangan",
	},
	"1014": {
		Table:      "DBLOCKPERIODE",
		KeyField:   "Periode",
		LabelField: "Keterangan",
	},
	"1015": {
		Table:      "DBFLPASS",
		KeyField:   "USERID",
		LabelField: "Nama",
	},
	"1016": {
		Table:      "DBSUBGROUPJNSTAMBAH",
		KeyField:   "Kode",
		LabelField: "Keterangan",
	},
	"1017": {
		Table:      "DBARUSKAS",
		KeyField:   "Kode",
		LabelField: "Keterangan",
	},
	"1018": {
		Table:      "DBAKTIVADET",
		KeyField:   "Kode",
		LabelField: "Keterangan",
	},
	"1019": {
		Table:      "DBTRANSAKSI",
		KeyField:   "Nomor",
		LabelField: "Keterangan",
	},
}