package settings

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/masza1/dapen-backend/internal/infrastructure/persistence/models"
	"gorm.io/gorm"
)

// FormatCode constants mirror the legacy `DBNOMOR.FORMAT1..4` integer codes
// (see trade-exchange/app/Models/DBNOMOR.php). They select what each slot
// in the document-number template renders to.
const (
	FormatAlias         = 0 // Company initials (ALIAS)
	FormatKodeTransaksi = 1 // Transaction code (BKK, BKM, BBM, etc.)
	FormatMMYY          = 2 // 2-digit month + 2-digit year  (e.g. 0726)
	FormatMMYYYY        = 3 // 2-digit month + 4-digit year  (e.g. 072026)
	FormatNomorUrut     = 4 // Running sequence (the NOBKK counter)
	FormatYYMM          = 5 // 2-digit year + 2-digit month  (e.g. 2607)
	FormatYYYYMM        = 6 // 4-digit year + 2-digit month  (e.g. 202607)
)

// SeparatorCode constants mirror DBNOMOR.PEMISAH (0–3).
const (
	PemisahNone   = 0
	PemisahDash   = 1
	PemisahSlash  = 2
	PemisahDot    = 3
)

// ResetCode constants mirror DBNOMOR.Reset.
const (
	ResetBulan = 0
	ResetTahun = 1
)

// JNS-Field map: the prefix (BKK, BKM, etc.) on DBNOMOR and the
// matching counter field (NOBKK, NOBKM, etc.) used to derive the
// running sequence for that transaction type.
var nomorFields = []struct {
	PrefixField string
	CounterField string
	Jns         string
}{
	{"BKK", "NOBKK", "BKK"},
	{"BKM", "NOBKM", "BKM"},
	{"BBM", "NOBBM", "BBM"},
	{"BBK", "NOBBK", "BBK"},
	{"BMM", "NOBMM", "BMM"},
	{"BJK", "NOBJK", "BJK"},
	{"PJL", "NoPJL", "PJL"},
	{"PBL", "NOPBL", "PBL"},
	{"BPPB", "NOBPPB", "BPPB"},
	{"BPSB", "NOBPSB", "BPSB"},
	{"BBP", "NOBBP", "BBP"},
	{"BPB", "NOBPB", "BPB"},
	{"SPRK", "NOSPRK", "SPRK"},
	{"BSPRK", "NOBSPRK", "BSPRK"},
	{"PPL", "NOPPL", "PPL"},
	{"BPL", "NOBPL", "BPL"},
	{"PO", "NOPO", "PO"},
	{"BPO", "NOBPO", "BPO"},
	{"BP", "NOBP", "BP"},
	{"BPSPRK", "NOBPSPRK", "BPSPRK"},
	{"INS", "NOINS", "INS"},
	{"KNS", "NOKNS", "KNS"},
	{"RPB", "NORPB", "RPB"},
	{"SPG", "NOSPG", "SPG"},
	{"OPN", "NOOPN", "OPN"},
	{"KMS", "NOKMS", "KMS"},
	{"RBPB", "NORBPB", "RBPB"},
	{"ENQ", "NOENQ", "ENQ"},
	{"CR", "NOCR", "CR"},
	{"SO", "NOSO", "SO"},
	{"RKL", "NORKL", "RKL"},
	{"SC", "NOSC", "SC"},
	{"SPP", "NOSPP", "SPP"},
	{"SPB", "NOSPB", "SPB"},
	{"RSPB", "NORSPB", "RSPB"},
	{"INV", "NOINV", "INV"},
	{"PNJ", "NOPNJ", "PNJ"},
	{"TRC", "NOTRC", "TRC"},
	{"SHIP", "NOSHIP", "SHIP"},
	{"TBJ", "NOTBJ", "TBJ"},
	{"RBJ", "NORBJ", "RBJ"},
	{"TRS", "NOTRS", "TRS"},
	{"BHN", "NOBHN", "BHN"},
}

// pemisah returns the literal separator for a PEMISAH code.
func pemisah(code int) string {
	switch code {
	case PemisahDash:
		return "-"
	case PemisahSlash:
		return "/"
	case PemisahDot:
		return "."
	default:
		return ""
	}
}

// renderFormat returns the string for a given FORMAT slot (1..4 → index 0..3).
// ALIAS and KODE_TRANSAKSI are looked up on the DBNOMOR row; date formats use
// the supplied `t`; the running sequence is provided by `seqStr` (the caller
// computed the next value from NOBKK).
func renderFormat(slot int, n *models.SDBNOMOR, t time.Time, seqStr string, codeTransaksi string) string {
	switch slot {
	case FormatAlias:
		if n.ALIAS != nil {
			return *n.ALIAS
		}
		return ""
	case FormatKodeTransaksi:
		return codeTransaksi
	case FormatMMYY:
		return t.Format("my")
	case FormatMMYYYY:
		return t.Format("mY")
	case FormatNomorUrut:
		return seqStr
	case FormatYYMM:
		return t.Format("ym")
	case FormatYYYYMM:
		return t.Format("Ym")
	default:
		return ""
	}
}

// nextSequence parses the legacy counter string (e.g. "202607/0009") and
// returns the next 4-digit padded sequence number along with the YYYYMM it
// belongs to. The "current" counter is the *last issued* number, so the
// next one is current+1. If `current` is empty, the counter starts at 1.
//
// `tahun`, `bulan` are the active accounting period (the document date).
// `resetMode` follows DBNOMOR.Reset: 0=Bulan → sequence resets to 1 when
// the period's year+month differs from the counter's year+month; 1=Tahun
// → resets only when the year differs.
func nextSequence(current string, tahun int, bulan int, resetMode int) (string, int, int) {
	periodMM := bulan
	periodYYYY := tahun

	// No current counter → start fresh.
	if current == "" {
		return "0001", periodYYYY, periodMM
	}

	// Counter format is "<YYYYMM><sep><NNNN>" — split at the first
	// non-digit following the leading 6 digits.
	if len(current) < 7 {
		return "0001", periodYYYY, periodMM
	}
	y := atoiSafe(current[0:4])
	m := atoiSafe(current[4:6])
	seq := atoiSafe(trimLeadingNonDigits(current[6:]))

	if y == 0 || m == 0 {
		return "0001", periodYYYY, periodMM
	}

	switch resetMode {
	case ResetBulan:
		if y != periodYYYY || m != periodMM {
			seq = 0
		}
	case ResetTahun:
		if y != periodYYYY {
			seq = 0
		}
	}

	next := seq + 1
	if next < 1 {
		next = 1
	}
	return pad4(next), periodYYYY, periodMM
}

func atoiSafe(s string) int {
	n := 0
	for _, r := range s {
		if r < '0' || r > '9' {
			break
		}
		n = n*10 + int(r-'0')
	}
	return n
}

func trimLeadingNonDigits(s string) string {
	for i, r := range s {
		if r >= '0' && r <= '9' {
			return s[i:]
		}
	}
	return ""
}

func pad4(n int) string {
	const max = 9999
	if n > max {
		// Fall back to wider padding rather than wrap or panic.
		return fmt.Sprintf("%d", n)
	}
	return fmt.Sprintf("%04d", n)
}

// GenerateNoBuktiResult is what the API returns when previewing the next
// document number for a given transaction type. The caller can decide
// whether to commit (persist the new counter) later.
type GenerateNoBuktiResult struct {
	Jns         string `json:"jns"`
	NoBukti     string `json:"noBukti"`
	KodeTrans   string `json:"kodeTrans"`
	NewCounter  string `json:"newCounter"`  // The next full counter string ("YYYYMM/0001")
	Seq         string `json:"seq"`         // Just the 4-digit sequence
	Tahun       int    `json:"tahun"`
	Bulan       int    `json:"bulan"`
	Format      string `json:"format"`      // Human-readable template, e.g. "ALIAS/KODE_TRAN/NOMOR_URUT/MMYY"
}

// Service is the application-layer entry point. The handler stays thin;
// all numbering logic lives here so it's unit-testable in isolation.
type Service struct {
	db *gorm.DB
}

func NewService(db *gorm.DB) *Service {
	return &Service{db: db}
}

// GenerateNoBukti previews the next document number for `jns` (e.g. "BKK")
// in the given accounting period. The counter in DBNOMOR is NOT yet
// committed — call CommitCounter afterwards to persist.
//
// This mirrors the legacy `generateNoBukti` helper in trade-exchange.
func (s *Service) GenerateNoBukti(jns string, tahun int, bulan int) (*GenerateNoBuktiResult, error) {
	if jns == "" {
		return nil, errors.New("jns is required")
	}

	field, ok := lookupNomorField(jns)
	if !ok {
		return nil, fmt.Errorf("unknown transaction type: %s", jns)
	}

	var nomor models.SDBNOMOR
	if err := s.db.First(&nomor).Error; err != nil {
		return nil, fmt.Errorf("failed to load DBNOMOR: %w", err)
	}

	kodeTrans := readStringField(&nomor, field.PrefixField)
	currentCounter := readStringField(&nomor, field.CounterField)

	t := time.Date(tahun, time.Month(bulan), 1, 0, 0, 0, 0, time.UTC)
	seq, y, m := nextSequence(currentCounter, tahun, bulan, derefInt(nomor.Reset))

	formats := []int{
		derefInt(nomor.FORMAT1),
		derefInt(nomor.FORMAT2),
		derefInt(nomor.FORMAT3),
		derefInt(nomor.FORMAT4),
	}

	sep := pemisah(derefInt(nomor.PEMISAH))
	parts := make([]string, 0, 4*2-1)
	for i, f := range formats {
		if i > 0 {
			parts = append(parts, sep)
		}
		parts = append(parts, renderFormat(f, &nomor, t, seq, kodeTrans))
	}
	noBukti := strings.Join(parts, "")

	// Build the next full counter string to write back. Same layout
	// legacy uses: YYYYMM{sep-pemisah?}NNNN.
	newCounter := fmt.Sprintf("%04d%02d%s%s", y, m, sep, seq)

	formatDesc := describeFormats(formats)

	return &GenerateNoBuktiResult{
		Jns:        jns,
		NoBukti:    noBukti,
		KodeTrans:  kodeTrans,
		NewCounter: newCounter,
		Seq:        seq,
		Tahun:      tahun,
		Bulan:      bulan,
		Format:     formatDesc,
	}, nil
}

// CommitCounter persists the new counter for `jns` so subsequent
// `GenerateNoBukti` calls advance from the right position. It is the
// caller's responsibility to only commit after the transaction that
// consumed the number has actually been written.
func (s *Service) CommitCounter(jns string, newCounter string) error {
	field, ok := lookupNomorField(jns)
	if !ok {
		return fmt.Errorf("unknown transaction type: %s", jns)
	}
	res := s.db.Model(&models.SDBNOMOR{}).
		Update(field.CounterField, newCounter)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		// No row matched (DBNOMOR is empty). Insert one with this counter
		// so subsequent reads work.
		insert := map[string]interface{}{
			field.CounterField: newCounter,
			field.PrefixField:  "",
		}
		return s.db.Model(&models.SDBNOMOR{}).Create(insert).Error
	}
	return nil
}

func lookupNomorField(jns string) (struct {
	PrefixField  string
	CounterField string
	Jns          string
}, bool) {
	for _, f := range nomorFields {
		if f.Jns == jns {
			return f, true
		}
	}
	return struct {
		PrefixField  string
		CounterField string
		Jns          string
	}{}, false
}

func readStringField(n *models.SDBNOMOR, name string) string {
	switch name {
	case "BKK":
		return derefStr(n.BKK)
	case "BKM":
		return derefStr(n.BKM)
	case "BBM":
		return derefStr(n.BBM)
	case "BBK":
		return derefStr(n.BBK)
	case "BMM":
		return derefStr(n.BMM)
	case "BJK":
		return derefStr(n.BJK)
	case "PJL":
		return derefStr(n.PJL)
	case "NoPJL":
		return derefStr(n.NoPJL)
	case "PBL":
		return derefStr(n.PBL)
	case "NOPBL":
		return derefStr(n.NOPBL)
	case "BPPB":
		return derefStr(n.BPPB)
	case "NOBPPB":
		return derefStr(n.NOBPPB)
	case "BPSB":
		return derefStr(n.BPSB)
	case "NOBPSB":
		return derefStr(n.NOBPSB)
	case "BBP":
		return derefStr(n.BBP)
	case "NOBBP":
		return derefStr(n.NOBBP)
	case "BPB":
		return derefStr(n.BPB)
	case "NOBPB":
		return derefStr(n.NOBPB)
	case "SPRK":
		return derefStr(n.SPRK)
	case "NOSPRK":
		return derefStr(n.NOSPRK)
	case "BSPRK":
		return derefStr(n.BSPRK)
	case "NOBSPRK":
		return derefStr(n.NOBSPRK)
	case "PPL":
		return derefStr(n.PPL)
	case "NOPPL":
		return derefStr(n.NOPPL)
	case "BPL":
		return derefStr(n.BPL)
	case "NOBPL":
		return derefStr(n.NOBPL)
	case "PO":
		return derefStr(n.PO)
	case "NOPO":
		return derefStr(n.NOPO)
	case "BPO":
		return derefStr(n.BPO)
	case "NOBPO":
		return derefStr(n.NOBPO)
	case "BP":
		return derefStr(n.BP)
	case "NOBP":
		return derefStr(n.NOBP)
	case "BPSPRK":
		return derefStr(n.BPSPRK)
	case "NOBPSPRK":
		return derefStr(n.NOBPSPRK)
	case "INS":
		return derefStr(n.INS)
	case "NOINS":
		return derefStr(n.NOINS)
	case "KNS":
		return derefStr(n.KNS)
	case "NOKNS":
		return derefStr(n.NOKNS)
	case "RPB":
		return derefStr(n.RPB)
	case "NORPB":
		return derefStr(n.NORPB)
	case "SPG":
		return derefStr(n.SPG)
	case "NOSPG":
		return derefStr(n.NOSPG)
	case "OPN":
		return derefStr(n.OPN)
	case "NOOPN":
		return derefStr(n.NOOPN)
	case "KMS":
		return derefStr(n.KMS)
	case "NOKMS":
		return derefStr(n.NOKMS)
	case "RBPB":
		return derefStr(n.RBPB)
	case "NORBPB":
		return derefStr(n.NORBPB)
	case "ENQ":
		return derefStr(n.ENQ)
	case "NOENQ":
		return derefStr(n.NOENQ)
	case "CR":
		return derefStr(n.CR)
	case "NOCR":
		return derefStr(n.NOCR)
	case "SO":
		return derefStr(n.SO)
	case "NOSO":
		return derefStr(n.NOSO)
	case "RKL":
		return derefStr(n.RKL)
	case "NORKL":
		return derefStr(n.NORKL)
	case "SC":
		return derefStr(n.SC)
	case "NOSC":
		return derefStr(n.NOSC)
	case "SPP":
		return derefStr(n.SPP)
	case "NOSPP":
		return derefStr(n.NOSPP)
	case "SPB":
		return derefStr(n.SPB)
	case "NOSPB":
		return derefStr(n.NOSPB)
	case "RSPB":
		return derefStr(n.RSPB)
	case "NORSPB":
		return derefStr(n.NORSPB)
	case "INV":
		return derefStr(n.INV)
	case "NOINV":
		return derefStr(n.NOINV)
	case "PNJ":
		return derefStr(n.PNJ)
	case "NOPNJ":
		return derefStr(n.NOPNJ)
	case "TRC":
		return derefStr(n.TRC)
	case "NOTRC":
		return derefStr(n.NOTRC)
	case "SHIP":
		return derefStr(n.SHIP)
	case "NOSHIP":
		return derefStr(n.NOSHIP)
	case "TBJ":
		return derefStr(n.TBJ)
	case "NOTBJ":
		return derefStr(n.NOTBJ)
	case "RBJ":
		return derefStr(n.RBJ)
	case "NORBJ":
		return derefStr(n.NORBJ)
	case "TRS":
		return derefStr(n.TRS)
	case "NOTRS":
		return derefStr(n.NOTRS)
	case "BHN":
		return derefStr(n.BHN)
	case "NOBHN":
		return derefStr(n.NOBHN)
	}
	return ""
}

func derefStr(p *string) string {
	if p == nil {
		return ""
	}
	return *p
}

func derefInt(p *int) int {
	if p == nil {
		return 0
	}
	return *p
}

func describeFormats(codes []int) string {
	names := []string{
		"ALIAS",
		"KODE_TRANS",
		"MMYY",
		"MMYYYY",
		"NOMOR_URUT",
		"YYMM",
		"YYYYMM",
	}
	parts := make([]string, 0, len(codes))
	for _, c := range codes {
		if c >= 0 && c < len(names) {
			parts = append(parts, names[c])
		} else {
			parts = append(parts, fmt.Sprintf("?(%d)", c))
		}
	}
	return strings.Join(parts, "/")
}