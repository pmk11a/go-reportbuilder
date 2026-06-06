package database

import (
	"fmt"
	"log"

	"github.com/masza1/dapen-backend/internal/infrastructure/config"
	"gorm.io/driver/sqlserver"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB(cfg *config.SConfig) *gorm.DB {
	// Build connection string
	// sqlserver://username:password@localhost:1433?database=dbname
	dsn := fmt.Sprintf("sqlserver://%s:%s@%s:%s?database=%s&encrypt=%s&trustServerCertificate=%s",
		cfg.DBUsername,
		cfg.DBPassword,
		cfg.DBHost,
		cfg.DBPort,
		cfg.DBDatabase,
		cfg.DBEncrypt,
		cfg.DBTrustCert,
	)

	var err error
	DB, err = gorm.Open(sqlserver.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Register Activity Log Plugin

	log.Println("Database connection established")
	return DB
}
