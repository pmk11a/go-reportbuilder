package browse

import "github.com/masza1/dapen-backend/internal/infrastructure/persistence/models"

// Config is a unified browse configuration shape.
// Matches the output of Laravel's BrowseService::getConfigMap() values and
// GenericBrowseService::normalizeRow(). Compatible with both sources.
type Config struct {
	Table            string                   `json:"table"`
	KeyField         string                   `json:"keyField"`
	LabelField       string                   `json:"labelField"`
	Query            string                   `json:"query,omitempty"`
	AdditionalFields []string                 `json:"additionalFields"`
	Joins            []string                 `json:"joins,omitempty"`
	WhereExtra       string                   `json:"whereExtra,omitempty"`
	AliasFields      map[string]string        `json:"aliasFields,omitempty"`
	ParentFilters    []models.ParentFilter    `json:"parentFilters,omitempty"`
	Params           map[string]string        `json:"params,omitempty"`
}

// BrowseType describes a browse metadata entry returned by /types.
type BrowseType struct {
	KodeBrowse string `json:"kodeBrowse"`
	KeyField   string `json:"keyField"`
	LabelField string `json:"labelField"`
	Group      string `json:"group"`
	Source     string `json:"source"` // "hardcoded" | "database"
}

// SearchResult is a generic row returned by Search/Validate.
// Each field is stored as map[string]interface{} because the underlying SQL
// returns arbitrary column shapes depending on the browse type.
type SearchResult map[string]interface{}

// SearchFilter holds query parameters for /api/browse/search.
//
// Semantics follow modern autofilter UI: offset/limit + hasMore flag
// (infinite scroll friendly). Sort defaults to ASC by labelField.
type SearchFilter struct {
	KodeBrowse string `form:"kodeBrowse" binding:"required"`
	Search     string `form:"search"`
	Limit      int    `form:"limit,default=20"`
	Offset     int    `form:"offset,default=0"`
	SortBy     string `form:"sortBy,default=text"`
	SortDir    string `form:"sortDir,default=ASC"`
	// Jenis is an optional, kodeBrowse-specific discriminator.
	// For kodeBrowse=1009 (custsupp) it accepts "Hutang" or "Piutang".
	// For kodeBrowse=1004 (perkiraan) it accepts "Y" (kelompok kas/bank)
	// or "T" (non-kelompok). Empty string disables the discriminator.
	Jenis string `form:"jenis"`
}

// BrowsePagedResponse is the data payload of /api/browse/search.
// Items use offset/limit (not page) and a HasMore boolean so the FE can
// drive an infinite-scroll picker without recalculating pages.
type BrowsePagedResponse struct {
	Items   []SearchResult `json:"items"`
	Total   int64          `json:"total"`
	Limit   int            `json:"limit"`
	Offset  int            `json:"offset"`
	HasMore bool           `json:"hasMore"`
}

// ParentFilterEntry is used for query-based browse configs to inject
// <P:column> placeholders in the query text.
type ParentFilterEntry struct {
	SourceColumn string
	Operator     string
}

// BrowseGroups maps kodeBrowse to a human-friendly group label.
var BrowseGroups = map[string]string{
	"1001":  "Perkiraan",
	"1005":  "Perkiraan",
	"10051": "Perkiraan",
	"100444": "Perkiraan",
	"10053": "Perkiraan",
	"10054": "Perkiraan",
	"10055": "Perkiraan",
	"10059": "Perkiraan",
	"100408": "Perkiraan",
	"100409": "Perkiraan",
	"1007":  "Departemen",
	"1008":  "Bagian",
	"1009":  "Customer/Supplier",
	"1010":  "Barang",
	"1011":  "Aktiva",
	"1012":  "Giro",
	"1013":  "Kas/Bank",
	"1014":  "Periode",
	"1015":  "User",
	"1016":  "Sub Group Jns Tambah",
	"1017":  "Arus Kas",
	"1018":  "Aktiva Det",
	"1019":  "Transaksi",
}