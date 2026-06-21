package seeders

import (
	"log"

	"github.com/masza1/dapen-backend/internal/infrastructure/persistence/models"
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

		// Defense in depth: GetDynamicRole() already treats Role == admin as
		// the source of truth regardless of legacy TINGKAT, but keep the
		// legacy DBFLPASS row in sync too so admin-panel reads of TINGKAT
		// directly (outside GetDynamicRole) are not stale.
		var dbflpass models.SDBFLPASS
		if err := database.Where("USERID = ?", "SA").First(&dbflpass).Error; err == nil {
			if dbflpass.TINGKAT != "2" {
				dbflpass.TINGKAT = "2"
				if err := database.Save(&dbflpass).Error; err != nil {
					log.Printf("Error syncing SDBFLPASS TINGKAT for SA: %v", err)
				} else {
					log.Println("Synced existing SDBFLPASS TINGKAT to admin (2) for SA")
				}
			}
		} else {
			log.Printf("Could not load SDBFLPASS for SA to sync TINGKAT: %v", err)
		}

		log.Println("Super Admin user updated successfully")
	}
}
