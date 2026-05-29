package db

import (
	"log"

	"github.com/masza1/dapen-backend/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func SeedDatabase(database *gorm.DB) {
	log.Println("Checking for seeds...")
	seedSuperAdmin(database)
}

func seedSuperAdmin(database *gorm.DB) {
	var count int64
	database.Model(&models.SUser{}).Where("username = ?", "superadmin").Count(&count)

	if count == 0 {
		log.Println("Seeding Super Admin user...")

		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("superadmin123"), bcrypt.DefaultCost)

		// 1. Create legacy SDBFLPASS record (uncommented to ensure relationship works)
		dbflpass := models.SDBFLPASS{
			USERID:   "SA",
			UID:      "superadmin",
			FullName: "Super Admin",
			TINGKAT:  "2",
			STATUS:   "0",
			UID2:     string(hashedPassword),
		}

		// Use FirstOrCreate to avoid errors if already exists
		if err := database.Where("USERID = ?", dbflpass.USERID).FirstOrCreate(&dbflpass).Error; err != nil {
			log.Printf("Error seeding SDBFLPASS: %v", err)
			return
		}

		// 2. Create standard SUser record linked to SDBFLPASS
		admin := models.SUser{
			UserID:   dbflpass.USERID,
			Username: "superadmin",
			Password: string(hashedPassword),
			FullName: dbflpass.FullName,
			Name:     dbflpass.FullName,   // Set legacy name field
			Email:    "admin@example.com", // Set legacy email field
			Role:     models.RoleAdmin,
		}

		if err := database.Create(&admin).Error; err != nil {
			log.Printf("Error seeding user: %v", err)
		} else {
			log.Println("Super Admin user created: superadmin / superadmin123 (UserID: SADM001)")
		}
	}
}
