package database

import "testing"

func TestRewriteSQL2008(t *testing.T) {
	cases := []struct {
		name string
		in   string
		out  string
	}{
		{
			name: "HasTable probe — single row",
			in:   `SELECT * FROM "users" ORDER BY (SELECT NULL) OFFSET 0 ROW FETCH NEXT 1 ROWS ONLY`,
			out:  `SELECT TOP 1 * FROM "users" ORDER BY (SELECT NULL)`,
		},
		{
			name: "Paginated — first page of 25",
			in:   `SELECT a, b FROM t WHERE x=1 ORDER BY x OFFSET 10 ROWS FETCH NEXT 25 ROWS ONLY`,
			out:  `SELECT TOP 25 a, b FROM t WHERE x=1 ORDER BY x`,
		},
		{
			name: "Already TOP — strip only OFFSET...FETCH",
			in:   `SELECT TOP (3) * FROM t ORDER BY id OFFSET 20 ROWS FETCH NEXT 5 ROWS ONLY`,
			out:  `SELECT TOP (3) * FROM t ORDER BY id`,
		},
		{
			name: "No FETCH NEXT — leave alone",
			in:   `SELECT * FROM t WHERE id=1`,
			out:  `SELECT * FROM t WHERE id=1`,
		},
	}
	for _, c := range cases {
		got := rewriteSQL2008(c.in)
		if got != c.out {
			t.Errorf("%s\n  want: %s\n  got:  %s", c.name, c.out, got)
		}
	}
}
