package db

import (
	"log"

	"github.com/masza1/dapen-backend/internal/models"
	"gorm.io/gorm"
)

func RunMigrations(database *gorm.DB) {
	log.Println("Running selective migrations...")

	// Auto-migrate the users and legacy SDBFLPASS table
	err := database.AutoMigrate(
		&models.SUser{},
		// &models.SDBFLPASS{},
		&models.SActivityLogConfig{},
		&models.SActivityLogField{},
		&models.SDBLogFile{},
	)
	if err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	log.Println("Migrations completed successfully")
}
