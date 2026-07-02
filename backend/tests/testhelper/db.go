package testhelper

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"testing"

	"github.com/joho/godotenv"
	"github.com/masza1/dapen-backend/internal/features/activity"
	"github.com/masza1/dapen-backend/internal/features/menu"
	"github.com/masza1/dapen-backend/internal/infrastructure/database/seeders"
	"github.com/masza1/dapen-backend/internal/infrastructure/persistence/models"
	"gorm.io/driver/sqlserver"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var testDB *gorm.DB

// InitTestDB initializes the test database, creates DbDapenka2_test if it doesn't exist,
// runs AutoMigrate for all required models, seeds minimal data, and returns the connected DB.
// The connection string is built from environment variables loaded from .env.
func InitTestDB(t *testing.T) *gorm.DB {
	// Load .env from project root
	projectRoot := findProjectRoot()
	envPath := filepath.Join(projectRoot, ".env")
	if err := godotenv.Load(envPath); err != nil {
		log.Printf("Warning: Could not load .env from %s: %v\n", envPath, err)
	}

	// Build connection to master database (to create test DB if needed)
	dbUsername := os.Getenv("DB_USERNAME")
	if dbUsername == "" {
		dbUsername = "sa"
	}
	dbPassword := os.Getenv("DB_PASSWORD")
	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "127.0.0.1"
	}
	dbPort := os.Getenv("DB_PORT")
	if dbPort == "" {
		dbPort = "1433"
	}
	dbEncrypt := os.Getenv("DB_ENCRYPT")
	if dbEncrypt == "" {
		dbEncrypt = "disable"
	}
	dbTrustCert := os.Getenv("DB_TRUST_SERVER_CERTIFICATE")
	if dbTrustCert == "" {
		dbTrustCert = "true"
	}

	// Create test database if it doesn't exist
	masterDSN := fmt.Sprintf("sqlserver://%s:%s@%s:%s?encrypt=%s&trustServerCertificate=%s",
		dbUsername, dbPassword, dbHost, dbPort, dbEncrypt, dbTrustCert)

	masterDB, err := gorm.Open(sqlserver.Open(masterDSN), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		log.Fatalf("Failed to connect to master database: %v", err)
	}

	// Create test database if it doesn't exist
	sqlDB, err := masterDB.DB()
	if err != nil {
		log.Fatalf("Failed to get SQL DB from GORM: %v", err)
	}
	defer sqlDB.Close()

	createTestDBSQL := `
	IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'DbDapenka2_test')
	BEGIN
		CREATE DATABASE DbDapenka2_test
	END
	`
	if err := masterDB.Exec(createTestDBSQL).Error; err != nil {
		log.Fatalf("Failed to create test database: %v", err)
	}

	// Connect to test database
	testDSN := fmt.Sprintf("sqlserver://%s:%s@%s:%s?database=DbDapenka2_test&encrypt=%s&trustServerCertificate=%s",
		dbUsername, dbPassword, dbHost, dbPort, dbEncrypt, dbTrustCert)

	testDB, err := gorm.Open(sqlserver.Open(testDSN), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		log.Fatalf("Failed to connect to test database: %v", err)
	}

	log.Println("Test database connected: DbDapenka2_test")

	// Run AutoMigrate for all required models
	// These models are needed for tests across different packages
	// Note: SDbPerkiraan is excluded due to foreign key constraint issues with SDBAKSESPERKIRAAN relationship
	migrationModels := []interface{}{
		&models.SUser{},
		&models.SDBFLPASS{},
		&menu.SDbMenu{},
		&models.DBPeriode{},
		&models.SDBPERUSAHAAN{},
		&models.SDbCustSupp{},
		&models.SDBDEPART{},
		&models.SDBBAGIAN{},
		&models.SDBJABATAN{},
		// &models.SDbPerkiraan{}, // Excluded: has problematic many-to-many relationship with DBAKSESPERKIRAAN
		&models.SDBAKSESPERKIRAAN{},
		&models.SDBDEVISI{},
		&activity.SDBLogFile{},
		&activity.SActivityLogConfig{},
		&activity.SActivityLogField{},
	}

	for i, model := range migrationModels {
		if err := testDB.AutoMigrate(model); err != nil {
			modelType := fmt.Sprintf("%T", model)
			log.Printf("Warning: Failed to migrate model %d (%s): %v. Continuing with next model...\n", i, modelType, err)
			// Don't fatally fail - skip this model and continue
		}
	}

	// Seed minimal data (SuperAdmin + menus)
	seeders.SeedDatabase(testDB)

	log.Println("Test database initialized with migrations and seeds")

	return testDB
}

// GetTestDB returns the singleton test database connection.
// Only valid if InitTestDB has been called previously.
func GetTestDB() *gorm.DB {
	return testDB
}

// SetTestDB sets the test database connection. Used internally in TestMain.
func SetTestDB(db *gorm.DB) {
	testDB = db
}

// findProjectRoot walks up the directory tree to find the project root
// (the directory containing go.mod).
func findProjectRoot() string {
	dir, err := os.Getwd()
	if err != nil {
		return "."
	}

	for {
		if _, err := os.Stat(filepath.Join(dir, "go.mod")); err == nil {
			return dir
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			// Reached filesystem root without finding go.mod
			return "."
		}
		dir = parent
	}
}

// CleanupTestDB drops all data from test tables. Call this in teardown
// if you want to clean up between test suites (not recommended — use WithTestTx instead).
func CleanupTestDB(db *gorm.DB) error {
	tableNames := []string{
		"activity_log_fields",
		"activity_log_config",
		"dblogfile",
		"DBDEVISI",
		"DBAKSESPERKIRAAN",
		"DBPERKIRAAN",
		"DBJABATAN",
		"DBBAGIAN",
		"DBDEPART",
		"DBCUSTSUPP",
		"DBPERUSAHAAN",
		"DBPERIODE",
		"DBMENU",
		"DBFLPASS",
		"users",
	}

	for _, table := range tableNames {
		if err := db.Exec(fmt.Sprintf("DELETE FROM [%s]", table)).Error; err != nil {
			// Table might not exist, continue
			log.Printf("Warning: Could not clean table %s: %v\n", table, err)
		}
	}

	return nil
}

// TruncateAllTables truncates all test tables for a complete reset.
// Only use at teardown of entire test suite, not between individual tests.
// Uses explicit table list instead of sp_MSForEachTable (undocumented, not
// guaranteed available on all SQL Server versions).
func TruncateAllTables(db *gorm.DB) error {
	tableNames := []string{
		"activity_log_fields",
		"activity_log_config",
		"dblogfile",
		"DBDEVISI",
		"DBAKSESPERKIRAAN",
		"DBPERKIRAAN",
		"DBJABATAN",
		"DBBAGIAN",
		"DBDEPART",
		"DBCUSTSUPP",
		"DBPERUSAHAAN",
		"DBPERIODE",
		"DBMENU",
		"DBFLPASS",
		"users",
	}

	for _, table := range tableNames {
		if err := db.Exec(fmt.Sprintf("TRUNCATE TABLE [%s]", table)).Error; err != nil {
			log.Printf("Warning: Could not truncate table %s: %v\n", table, err)
		}
	}

	return nil
}

// GetDatabaseHandle returns the underlying sql.DB for advanced operations.
func GetDatabaseHandle(db *gorm.DB) (*sql.DB, error) {
	return db.DB()
}
