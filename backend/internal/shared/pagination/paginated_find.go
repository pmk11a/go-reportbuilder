package pagination

import (
	"gorm.io/gorm"
)

// PaginatedFind executes a SQL Server 2008-compatible paginated query by
// wrapping baseSQL inside the existing BuildRowNumberQuery CTE pattern.
// Returns the page rows in dest and the total count BEFORE pagination.
func PaginatedFind(db *gorm.DB, dest any, baseSQL, orderBy string, page, pageSize int, args ...any) (total int64, err error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}

	countSQL := "SELECT COUNT(*) FROM (" + baseSQL + ") AS __count"
	if err = db.Raw(countSQL, args...).Scan(&total).Error; err != nil {
		return 0, err
	}

	pageSQL := BuildRowNumberQuery(baseSQL, orderBy, page, pageSize)
	if err = db.Raw(pageSQL, args...).Scan(dest).Error; err != nil {
		return total, err
	}

	return total, nil
}