package seeders

import (
	"log"

	"github.com/masza1/dapen-backend/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func seedSuperAdmin(database *gorm.DB) {
	var count int64
	database.Model(&models.SUser{}).Where("username = ?", "superadmin").Count(&count)

	if count == 0 {
		log.Println("Seeding Super Admin user...")

		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("superadmin123"), bcrypt.DefaultCost)

		// 1. Create legacy SDBFLPASS record
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
			Name:     dbflpass.FullName,
			Email:    "superadmin@dapen.local",
			Role:     models.RoleAdmin,
		}

		if err := database.Where("username = ?", admin.Username).FirstOrCreate(&admin).Error; err != nil {
			log.Printf("Error seeding user: %v", err)
		} else {
			// Force update fields in case it already exists but was modified
			admin.Username = "superadmin"
			admin.Password = string(hashedPassword)
			admin.Role = models.RoleAdmin
			admin.UserID = dbflpass.USERID
			database.Save(&admin)

			log.Println("Super Admin user seeded successfully")
		}
	} else {
		// Update existing superadmin to ensure it has the right credentials
		var admin models.SUser
		database.Where("username = ?", "superadmin").First(&admin)

		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("superadmin123"), bcrypt.DefaultCost)
		admin.Username = "superadmin"
		admin.Password = string(hashedPassword)
		admin.Role = models.RoleAdmin
		admin.UserID = "SA"
		database.Save(&admin)

		log.Println("Super Admin user updated successfully")
	}
}
