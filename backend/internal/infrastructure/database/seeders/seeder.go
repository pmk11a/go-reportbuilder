package seeders

import (
	"log"

	"gorm.io/gorm"
)

func SeedDatabase(database *gorm.DB) {
	log.Println("Checking for seeds...")
	seedSuperAdmin(database)
	seedDBMenu(database)
	seedDbBrowseConfigs(database)
}


