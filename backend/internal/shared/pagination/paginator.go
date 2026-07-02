// Package pagination provides SQL Server 2008-compatible pagination helpers.
// SQL Server 2008 does not support OFFSET ... FETCH NEXT (introduced in SQL Server 2012).
// This package wraps SELECT queries using ROW_NUMBER() OVER (ORDER BY ...) pattern.
package pagination

import (
	"fmt"
	"strings"
)

// BuildRowNumberQuery constructs a ROW_NUMBER()-based pagination query
// compatible with SQL Server 2008+.
//
// It takes a base SELECT statement (without ORDER BY), an order specification,
// and page parameters, and returns a query wrapping the base with
// ROW_NUMBER() for paging.
//
// Parameters:
//   - baseSQL: the SELECT query without ORDER BY clause
//   - orderBy: column expressions for sorting, e.g. "u.FullName ASC, p.L1 ASC"
//   - page: 1-based page number
//   - pageSize: number of rows per page
//
// Returns:
//   - paginated SQL string
//   - no parameters needed (start/end are computed inline)
//
// Example output:
//
//	SELECT * FROM (
//		SELECT ROW_NUMBER() OVER (ORDER BY col1, col2) AS __rn, t.*
//		FROM (baseSQL) AS t
//	) AS paged WHERE __rn BETWEEN 1 AND 10
func BuildRowNumberQuery(baseSQL string, orderBy string, page, pageSize int) string {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	start := (page - 1) * pageSize + 1
	end := page * pageSize

	orderByClean := strings.TrimSpace(orderBy)

	return fmt.Sprintf(
		"SELECT * FROM (SELECT ROW_NUMBER() OVER (ORDER BY %s) AS __row_num, __inner.* FROM (%s) AS __inner) AS __paged WHERE __row_num BETWEEN %d AND %d",
		orderByClean,
		baseSQL,
		start,
		end,
	)
}

// StripOrderBy removes trailing ORDER BY clause from a query string.
func StripOrderBy(sql string) string {
	lower := strings.ToLower(strings.TrimRightFunc(sql, func(r rune) bool {
		return r == '\t' || r == '\n' || r == '\r' || r == ' '
	}))

	idx := strings.LastIndex(lower, " order by ")
	if idx < 0 {
		return sql
	}
	// Trim trailing whitespace after stripping ORDER BY
	result := strings.TrimRightFunc(sql[:idx], func(r rune) bool {
		return r == '\t' || r == '\n' || r == '\r' || r == ' '
	})
	return result
}
