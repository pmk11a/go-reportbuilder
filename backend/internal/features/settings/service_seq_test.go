package settings

import "testing"

func TestParseDigitWidth(t *testing.T) {
	cases := []struct {
		in       string
		expected int
	}{
		{"", defaultSeqWidth},
		{"0", 1},
		{"00", 2},
		{"00000", 5},
		{"0000", 4},
		{"'00000'", 5}, // 5 zeroes, quote chars ignored
		{"abc", defaultSeqWidth}, // no zeroes → fall back to default
	}
	for _, tc := range cases {
		got := parseDigitWidth(tc.in)
		if got != tc.expected {
			t.Errorf("parseDigitWidth(%q) = %d, want %d", tc.in, got, tc.expected)
		}
	}
}

func TestPadN(t *testing.T) {
	cases := []struct {
		n        int
		width    int
		expected string
	}{
		{1, 5, "00001"},
		{9, 5, "00009"},
		{123, 5, "00123"},
		{99999, 5, "99999"},
		{100000, 5, "100000"}, // overflow → wider padding (no truncation)
		{1, 0, "00001"},      // width<=0 → default
		{1, -3, "00001"},
		{1, 1, "1"},
	}
	for _, tc := range cases {
		got := padN(tc.n, tc.width)
		if got != tc.expected {
			t.Errorf("padN(%d, %d) = %q, want %q", tc.n, tc.width, got, tc.expected)
		}
	}
}

func TestNextSequence_FiveDigitPadding(t *testing.T) {
	// Fresh start with width=5.
	got, _, _ := nextSequence("", 2026, 7, ResetBulan, 5)
	if got != "00001" {
		t.Errorf("empty counter width=5: got %q, want %q", got, "00001")
	}

	// After "202607/00009" the next should be "00010" (5-digit).
	got, _, _ = nextSequence("202607/00009", 2026, 7, ResetBulan, 5)
	if got != "00010" {
		t.Errorf("after 202607/00009: got %q, want %q", got, "00010")
	}

	// Cross-month reset with width=5 → "00001".
	got, _, _ = nextSequence("202607/00042", 2026, 8, ResetBulan, 5)
	if got != "00001" {
		t.Errorf("cross-month reset: got %q, want %q", got, "00001")
	}

	// Cross-year reset (ResetTahun) with width=5 → "00001".
	got, _, _ = nextSequence("202512/00007", 2026, 1, ResetTahun, 5)
	if got != "00001" {
		t.Errorf("cross-year reset: got %q, want %q", got, "00001")
	}

	// Width=4 still works (back-compat for old legacy rows).
	got, _, _ = nextSequence("", 2026, 7, ResetBulan, 4)
	if got != "0001" {
		t.Errorf("empty counter width=4: got %q, want %q", got, "0001")
	}
	got, _, _ = nextSequence("202607/0009", 2026, 7, ResetBulan, 4)
	if got != "0010" {
		t.Errorf("after 202607/0009 width=4: got %q, want %q", got, "0010")
	}
}
