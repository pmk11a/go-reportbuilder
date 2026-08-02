package seeders

import (
	"log"
	"os"
	"strings"

	"gorm.io/gorm"
)

func seedReports(db *gorm.DB) {
	log.Println("Seeding reports from seed_report_tables.sql...")

	content, err := os.ReadFile("seed_report_tables.sql")
	if err != nil {
		log.Printf("Failed to read seed_report_tables.sql: %v. Make sure the file exists in the root directory.", err)
		return
	}

	sqlScript := string(content)
	
	// Split script by 'GO' keyword to handle SQL Server batch executions properly
	batches := strings.Split(sqlScript, "\nGO")
	
	for i, batch := range batches {
		batch = strings.TrimSpace(batch)
		if batch == "" || strings.HasPrefix(batch, "USE dbwbcp2") {
			continue // Skip empty batches or USE statements since GORM connects to the specific DB directly
		}
		
		// Remove trailing GO if any (some formatting might leave it)
		if strings.HasSuffix(strings.ToUpper(batch), "GO") {
			batch = batch[:len(batch)-2]
		}
		batch = strings.TrimSpace(batch)

		if batch == "" {
			continue
		}

		err := db.Exec(batch).Error
		if err != nil {
			log.Printf("Error executing batch %d: %v\nBatch content: %s", i+1, err, batch[:min(100, len(batch))]+"...")
		}
	}

	log.Println("Finished seeding reports.")
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
