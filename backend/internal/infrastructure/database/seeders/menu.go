package seeders

import (
	"embed"
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"strings"

	"github.com/masza1/dapen-backend/internal/features/menu"
	"gorm.io/gorm"
)

//go:embed DBMENU.csv
var csvFS embed.FS

func seedDBMenu(database *gorm.DB) {
	log.Println("Seeding DBMENU...")

	data, err := csvFS.Open("DBMENU.csv")
	if err != nil {
		log.Fatalf("Failed to open DBMENU.csv: %v", err)
	}
	defer data.Close()

	reader := csv.NewReader(data)
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
		kodeMenu    string
		keterangan  string
		routeName   string
		icon        string
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

	for _, csvRow := range rows {
		var item menu.SDbMenu
		err := database.Where("KODEMENU = ?", csvRow.kodeMenu).First(&item).Error

		if err == gorm.ErrRecordNotFound {
			// Not in DB yet — skip (we only update existing records)
			log.Printf("Menu %s (%s) not found in DB — skipping", csvRow.kodeMenu, csvRow.keterangan)
			notFound++
			continue
		}

		if err != nil {
			log.Printf("Error querying menu %s: %v", csvRow.kodeMenu, err)
			continue
		}

		// Update routename and icon
		oldRoute := item.Routename
		oldIcon := item.Icon

		item.Routename = &csvRow.routeName
		item.Icon = csvRow.icon

		if err := database.Save(&item).Error; err != nil {
			log.Printf("Failed to save menu %s: %v", csvRow.kodeMenu, err)
			continue
		}

		routeDesc := fmt.Sprintf("%q", csvRow.routeName)
		if csvRow.routeName == "" {
			routeDesc = "(empty)"
		}
		log.Printf("Updated menu %s [%s]: routename=%s, icon=%s",
			csvRow.kodeMenu, csvRow.keterangan, routeDesc, csvRow.icon)

		if oldRoute != nil && *oldRoute != csvRow.routeName {
			log.Printf("  Routename: %q -> %q", *oldRoute, csvRow.routeName)
		}
		if oldIcon != csvRow.icon {
			log.Printf("  Icon: %q -> %q", oldIcon, csvRow.icon)
		}

		updated++
	}

	log.Printf("DBMENU seed complete: %d updated, %d not found in DB", updated, notFound)
}
