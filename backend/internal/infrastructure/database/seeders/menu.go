package seeders

import (
	"bytes"
	"encoding/csv"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/masza1/dapen-backend/internal/features/menu"
	"gorm.io/gorm"
)

const csvFilename = "DBMENU.csv"

// findCSVPath searches for the CSV in known locations relative to the binary.
func findCSVPath() string {
	candidates := []string{
		csvFilename,
		filepath.Join("..", csvFilename),
		filepath.Join("internal", "infrastructure", "database", "seeders", csvFilename),
		filepath.Join("backend", "internal", "infrastructure", "database", "seeders", csvFilename),
	}

	for _, c := range candidates {
		if _, err := os.Stat(c); err == nil {
			fullPath, _ := filepath.Abs(c)
			return fullPath
		}
	}

	return ""
}

func seedDBMenu(database *gorm.DB) {
	log.Println("Seeding DBMENU...")

	csvPath := findCSVPath()
	if csvPath == "" {
		log.Printf("WARNING: %s not found, skipping DBMENU seed", csvFilename)
		log.Println("Place the file next to the binary or run from the project root.")
		return
	}
	log.Printf("Reading %s from %s", csvFilename, csvPath)

	data, err := os.ReadFile(csvPath)
	if err != nil {
		log.Fatalf("Failed to read %s: %v", csvFilename, err)
	}

	reader := csv.NewReader(bytes.NewReader(data))
	reader.LazyQuotes = true

	header, err := reader.Read()
	if err != nil {
		log.Fatalf("Failed to read CSV header: %v", err)
	}
	colIdx := map[string]int{}
	for i, name := range header {
		colIdx[strings.TrimSpace(name)] = i
	}

	type csvRow struct {
		kodeMenu   string
		keterangan string
		routeName  string
		icon       string
	}
	var rows []csvRow

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			log.Printf("Warning: skipping malformed CSV row: %v", err)
			continue
		}

		routeName := strings.TrimSpace(record[colIdx["routename"]])
		icon := strings.TrimSpace(record[colIdx["icon"]])

		if routeName == "" || icon == "" {
			continue
		}

		rows = append(rows, csvRow{
			kodeMenu:   strings.TrimSpace(record[colIdx["KODEMENU"]]),
			keterangan: strings.TrimSpace(record[colIdx["Keterangan"]]),
			routeName:  routeName,
			icon:       icon,
		})
	}

	if len(rows) == 0 {
		log.Println("No menu items with routename+icon found in CSV.")
		return
	}

	var existingMenus []menu.SDbMenu
	if err := database.Find(&existingMenus).Error; err != nil {
		log.Printf("Failed to query DBMENU: %v", err)
		return
	}

	// Build a lookup map by KODEMENU
	menuMap := map[string]*menu.SDbMenu{}
	for i := range existingMenus {
		menuMap[existingMenus[i].KODEMENU] = &existingMenus[i]
	}

	updated := 0
	created := 0

	for _, r := range rows {
		item, exists := menuMap[r.kodeMenu]
		if !exists {
			// Insert new record (e.g. Dashboard)
			emptyStr := ""
			// Fetch keterangan from CSV for the insert
			newItem := menu.SDbMenu{
				KODEMENU:   r.kodeMenu,
				Keterangan: r.keterangan,
				L0:         0,
				ACCESS:     0,
				OL:         0,
				TipeTrans:  &emptyStr,
				Routename:  &r.routeName,
				Icon:       r.icon,
			}
			if err := database.Create(&newItem).Error; err != nil {
				log.Printf("Failed to create menu %s: %v", r.kodeMenu, err)
				continue
			}
			// log.Printf("Created menu %s [%s]: routename=%q, icon=%s",
			// 	r.kodeMenu, r.keterangan, r.routeName, r.icon)
			created++
			continue
		}

		oldRoute := item.Routename
		oldIcon := item.Icon

		item.Routename = &r.routeName
		item.Icon = r.icon

		if err := database.Save(item).Error; err != nil {
			log.Printf("Failed to save menu %s: %v", r.kodeMenu, err)
			continue
		}

		log.Printf("Updated menu %s [%s]: routename=%q, icon=%s",
			r.kodeMenu, r.keterangan, r.routeName, r.icon)

		if oldRoute != nil && *oldRoute != r.routeName {
			log.Printf("  Routename: %q -> %q", *oldRoute, r.routeName)
		}
		if oldIcon != r.icon {
			log.Printf("  Icon: %q -> %q", oldIcon, r.icon)
		}

		updated++
	}

	log.Printf("DBMENU seed complete: %d created, %d updated", created, updated)

	// ensureDynamicBrowseMenu inserts the "Dynamic Browse" entry under
	// Berkas (parent KODEMENU "00") if it isn't already present. This
	// runs after the CSV-driven seed so existing deployments that
	// already seeded an older DBMENU.csv still get the new menu entry.
	ensureDynamicBrowseMenu(database)
}

// dynamicBrowseMenu is the catalogue row for the generic browse page
// rendered at /admin/berkas/browse. Defined separately so it can be
// re-used as a programmatic ensure in addition to the CSV entry.
var dynamicBrowseMenu = menu.SDbMenu{
	KODEMENU:   "0009",
	Keterangan: "Dynamic Browse",
	L0:         1,
	ACCESS:     9,
	OL:         0,
	TipeTrans:  func() *string { s := ""; return &s }(),
	Routename:  func() *string { s := "/admin/berkas/browse"; return &s }(),
	Icon:       "Search",
}

func ensureDynamicBrowseMenu(database *gorm.DB) {
	var existing menu.SDbMenu
	err := database.Where("KODEMENU = ?", dynamicBrowseMenu.KODEMENU).First(&existing).Error
	switch {
	case err == gorm.ErrRecordNotFound:
		if err := database.Create(&dynamicBrowseMenu).Error; err != nil {
			log.Printf("Failed to ensure Dynamic Browse menu: %v", err)
			return
		}
		log.Printf("Ensured Dynamic Browse menu (KODEMENU=%s, routename=%q)",
			dynamicBrowseMenu.KODEMENU, *dynamicBrowseMenu.Routename)
	case err != nil:
		log.Printf("Failed to look up Dynamic Browse menu: %v", err)
	default:
		// Row exists: make sure routename/icon match in case the
		// existing row predates the new contract.
		if existing.Routename == nil || *existing.Routename != *dynamicBrowseMenu.Routename {
			existing.Routename = dynamicBrowseMenu.Routename
			if err := database.Save(&existing).Error; err != nil {
				log.Printf("Failed to update Dynamic Browse routename: %v", err)
				return
			}
			log.Printf("Updated Dynamic Browse menu routename to %q",
				*dynamicBrowseMenu.Routename)
		}
	}
}
