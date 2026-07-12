package settings

import (
	"strings"
	"testing"
	"time"

	"github.com/masza1/dapen-backend/internal/infrastructure/persistence/models"
)

// renderFullNoBukti mirrors the assembly loop in GenerateNoBuktiTx so the
// format renderer is exercised exactly as the production code uses it.
func renderFullNoBukti(formats [4]int, sep string, alias string, at time.Time, seq string, code string) string {
	n := &models.SDBNOMOR{ALIAS: &alias}
	parts := make([]string, 0, 4*2-1)
	for i, f := range formats {
		if i > 0 {
			parts = append(parts, sep)
		}
		parts = append(parts, renderFormat(f, n, at, seq, code))
	}
	return strings.Join(parts, "")
}

func TestRenderNoBukti_DelphiCompatibility(t *testing.T) {
	jul2026 := time.Date(2026, 7, 15, 0, 0, 0, 0, time.UTC)
	jan2023 := time.Date(2023, 1, 15, 0, 0, 0, 0, time.UTC)

	cases := []struct {
		name     string
		formats  [4]int
		sep      string
		alias    string
		at       time.Time
		seq      string
		code     string
		expected string
	}{
		{
			name:     "user case 5-digit seq, Jan 2023",
			formats:  [4]int{FormatNomorUrut, FormatKodeTransaksi, FormatAlias, FormatMMYYYY},
			sep:      "/",
			alias:    "KANTOR PUSAT",
			at:       jan2023,
			seq:      "00001",
			code:     "BKK",
			expected: "00001/BKK/KANTOR PUSAT/012023",
		},
		{
			name:     "5-digit seq, MMYYYY Jul 2026",
			formats:  [4]int{FormatNomorUrut, FormatKodeTransaksi, FormatAlias, FormatMMYYYY},
			sep:      "/",
			alias:    "KANTOR PUSAT",
			at:       jul2026,
			seq:      "00001",
			code:     "BKK",
			expected: "00001/BKK/KANTOR PUSAT/072026",
		},
		{
			name:     "5-digit seq high counter",
			formats:  [4]int{FormatNomorUrut, FormatKodeTransaksi, FormatAlias, FormatMMYYYY},
			sep:      "/",
			alias:    "KANTOR PUSAT",
			at:       jul2026,
			seq:      "00123",
			code:     "BKK",
			expected: "00123/BKK/KANTOR PUSAT/072026",
		},
		{
			name:     "MMYY Jul 2026",
			formats:  [4]int{FormatNomorUrut, FormatKodeTransaksi, FormatAlias, FormatMMYY},
			sep:      "/",
			alias:    "KANTOR PUSAT",
			at:       jul2026,
			seq:      "00001",
			code:     "BKK",
			expected: "00001/BKK/KANTOR PUSAT/0726",
		},
		{
			name:     "YYYYMM Jul 2026",
			formats:  [4]int{FormatNomorUrut, FormatKodeTransaksi, FormatAlias, FormatYYYYMM},
			sep:      "/",
			alias:    "KANTOR PUSAT",
			at:       jul2026,
			seq:      "00001",
			code:     "BKK",
			expected: "00001/BKK/KANTOR PUSAT/202607",
		},
		{
			name:     "YYMM Jul 2026",
			formats:  [4]int{FormatNomorUrut, FormatKodeTransaksi, FormatAlias, FormatYYMM},
			sep:      "/",
			alias:    "KANTOR PUSAT",
			at:       jul2026,
			seq:      "00001",
			code:     "BKK",
			expected: "00001/BKK/KANTOR PUSAT/2607",
		},
		{
			name:     "dash separator",
			formats:  [4]int{FormatNomorUrut, FormatKodeTransaksi, FormatAlias, FormatMMYYYY},
			sep:      "-",
			alias:    "KANTOR PUSAT",
			at:       jan2023,
			seq:      "00001",
			code:     "BKK",
			expected: "00001-BKK-KANTOR PUSAT-012023",
		},
		{
			name:     "space separator",
			formats:  [4]int{FormatNomorUrut, FormatKodeTransaksi, FormatAlias, FormatMMYYYY},
			sep:      " ",
			alias:    "KANTOR PUSAT",
			at:       jan2023,
			seq:      "00001",
			code:     "BKK",
			expected: "00001 BKK KANTOR PUSAT 012023",
		},
		{
			name:     "leading zero month Feb 2026",
			formats:  [4]int{FormatNomorUrut, FormatKodeTransaksi, FormatAlias, FormatMMYYYY},
			sep:      "/",
			alias:    "KANTOR PUSAT",
			at:       time.Date(2026, 2, 15, 0, 0, 0, 0, time.UTC),
			seq:      "00001",
			code:     "BKK",
			expected: "00001/BKK/KANTOR PUSAT/022026",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := renderFullNoBukti(tc.formats, tc.sep, tc.alias, tc.at, tc.seq, tc.code)
			if got != tc.expected {
				t.Fatalf("format mismatch:\n  want: %q\n  got:  %q", tc.expected, got)
			}
		})
	}
}
