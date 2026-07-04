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
			log.Printf("Created menu %s [%s]: routename=%q, icon=%s",
				r.kodeMenu, r.keterangan, r.routeName, r.icon)
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
}
