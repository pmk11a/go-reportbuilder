package seeders

import (
	"log"

	"github.com/masza1/dapen-backend/internal/features/menu"
	"gorm.io/gorm"
)

func seedDBMenu(database *gorm.DB) {
	log.Println("Seeding DBMENU...")

	// Fetch existing menus to update icons and routes
	var existingMenus []menu.SDbMenu
	if err := database.Find(&existingMenus).Error; err == nil {
		for _, menu := range existingMenus {
			changed := false

			// Map icons based on Keterangan (menu name)
			iconMap := map[string]string{
				"Berkas": "Folder",
				"Setup Periode Kerja": "Calendar",
				"Kunci Periode Kerja": "Lock",
				"Set Nomor Transaksi dan Perusahaan": "Building",
				"Menu": "Menu",
				"Set Pemakai": "Users",
				"Ganti Password": "KeyRound",
				"Laporan": "FileText",
				"Master": "Database",
				"Konfigurasi": "Settings",
				"Log": "List",
				"Dashboard": "LayoutDashboard",
			}

			if newIcon, exists := iconMap[menu.Keterangan]; exists {
				if menu.Icon != newIcon {
					menu.Icon = newIcon
					changed = true
				}
			}

			// Update routes from old laravel format to new React frontend format
			if menu.Routename != nil {
				oldRoute := *menu.Routename
				newRoute := oldRoute

				if oldRoute == "berkas.mastermenu.index" {
					newRoute = "/admin/berkas/menu"
				} else if oldRoute == "berkas.set-pemakai.index" {
					newRoute = "/admin/users"
				} else if oldRoute == "berkas.perusahaan.index" {
					newRoute = "/admin/perusahaan"
				} else if oldRoute == "#setupPeriode" || oldRoute == "#gantiPassword" {
					newRoute = oldRoute // Keep as is
				}

				if newRoute != oldRoute {
					menu.Routename = &newRoute
					changed = true
				}
			}

			if changed {
				database.Save(&menu)
			}
		}
	}

	// Add Dashboard menu (KodeMenu: 11, LO: 0, OL: 0, TipeTrans: "")
	var count int64
	database.Model(&menu.SDbMenu{}).Where("KODEMENU = ?", "11").Count(&count)

	if count == 0 {
		emptyStr := ""
		dashRoute := "/admin/dashboard"
		newDash := menu.SDbMenu{
			KODEMENU:   "11",
			Keterangan: "Dashboard",
			L0:         0,
			ACCESS:     11, // Arbitrary access code based on KODEMENU
			OL:         0,
			TipeTrans:  &emptyStr,
			Routename:  &dashRoute,
			Icon:       "LayoutDashboard",
		}
		database.Create(&newDash)
		log.Println("Added Dashboard menu to DBMENU")
	} else {
		var dashMenu menu.SDbMenu
		database.Where("KODEMENU = ?", "11").First(&dashMenu)
		dashRoute := "/admin/dashboard"
		dashMenu.Routename = &dashRoute
		dashMenu.Icon = "LayoutDashboard"
		database.Save(&dashMenu)
	}
}
