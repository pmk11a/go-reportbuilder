package seeders

import (
	"bytes"
	"encoding/csv"
	"fmt"
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
// It tries: same directory as this source file, then working directory,
// then absolute paths. Returns the first found path.
func findCSVPath() string {
	candidates := []string{
		csvFilename,                          // same dir as binary (working dir)
		filepath.Join("..", csvFilename),     // one level up (e.g. from seeders/)
		filepath.Join("internal", "infrastructure", "database", "seeders", csvFilename), // relative to project root
		filepath.Join("backend", "internal", "infrastructure", "database", "seeders", csvFilename), // relative to repo root
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

	// Read header
	header, err := reader.Read()
	if err != nil {
		log.Fatalf("Failed to read CSV header: %v", err)
	}
	colIdx := map[string]int{}
	for i, name := range header {
		colIdx[strings.TrimSpace(name)] = i
	}

	// Read all rows
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

		// Only consider rows that have a non-empty routename and icon
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

	// Load existing menus from DB
	var existingMenus []menu.SDbMenu
	if err := database.Find(&existingMenus).Error; err != nil {
		log.Printf("Failed to query DBMENU: %v", err)
		return
	}

	updated := 0
	notFound := 0

	for _, r := range rows {
		var item menu.SDbMenu
		err := database.Where("KODEMENU = ?", r.kodeMenu).First(&item).Error

		if err == gorm.ErrRecordNotFound {
			// Not in DB yet — skip (we only update existing records)
			log.Printf("Menu %s (%s) not found in DB — skipping", r.kodeMenu, r.keterangan)
			notFound++
			continue
		}

		if err != nil {
			log.Printf("Error querying menu %s: %v", r.kodeMenu, err)
			continue
		}

		// Update routename and icon only
		oldRoute := item.Routename
		oldIcon := item.Icon

		item.Routename = &r.routeName
		item.Icon = r.icon

		if err := database.Save(&item).Error; err != nil {
			log.Printf("Failed to save menu %s: %v", r.kodeMenu, err)
			continue
		}

		routeDesc := fmt.Sprintf("%q", r.routeName)
		if r.routeName == "" {
			routeDesc = "(empty)"
		}
		log.Printf("Updated menu %s [%s]: routename=%s, icon=%s",
			r.kodeMenu, r.keterangan, routeDesc, r.icon)

		if oldRoute != nil && *oldRoute != r.routeName {
			log.Printf("  Routename: %q -> %q", *oldRoute, r.routeName)
		}
		if oldIcon != r.icon {
			log.Printf("  Icon: %q -> %q", oldIcon, r.icon)
		}

		updated++
	}

	log.Printf("DBMENU seed complete: %d updated, %d not found in DB", updated, notFound)
}
