package seeders

import (
	"gorm.io/gorm"
)

func seedDbBrowseConfigs(db *gorm.DB) {
	executeSQLFile(db, "seed_browse.sql", ";")
}
