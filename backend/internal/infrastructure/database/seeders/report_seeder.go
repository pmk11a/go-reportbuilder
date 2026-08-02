package seeders

import (
	"gorm.io/gorm"
)

func seedReports(db *gorm.DB) {
	executeSQLFile(db, "seed_report_tables.sql", "\nGO")
}
