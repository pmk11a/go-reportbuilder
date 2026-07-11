package pagination

import (
	"strings"

	"gorm.io/gorm"
)

// First2008 wraps .Take() with mandatory .Order() to avoid GORM's OFFSET ...
// FETCH NEXT (SQL Server 2012+).
//
// Panics if orderBy is blank — this is intentional to surface regressions at
// dev time, not as silent non-determinism.
//
// Note: we use .Take() rather than .First() because First() internally
// appends ORDER BY <primary_key> (see gorm/finisher_api.go:121-123), which
// combined with our explicit .Order(orderBy) would produce a duplicate
// ORDER BY list when orderBy is the same as the primary key.
// Take() does not auto-add any ORDER BY, so the caller's orderBy is
// the sole ordering column.
func First2008(db *gorm.DB, dest any, orderBy string, queryFn func(*gorm.DB) *gorm.DB) error {
	if strings.TrimSpace(orderBy) == "" {
		panic("pagination: First2008 called with empty orderBy — add an explicit column name")
	}
	if queryFn != nil {
		db = queryFn(db)
	}
	return db.Order(orderBy).Take(dest).Error
}