package database

import (
	"log"

	"github.com/masza1/dapen-backend/internal/features/activity"
	"github.com/masza1/dapen-backend/internal/infrastructure/persistence/models"
	"gorm.io/gorm"
)

// RunMigrations executes all database schema changes required by the application.
// This includes:
//   - Legacy constraint fixes for SQL Server compatibility
//   - Table auto-migration via GORM
//   - Index creation for performance optimization
//
// The legacy DBTRANS table is NOT auto-migrated (it belongs to the Delphi system).
// Instead, performance-critical indexes are created via raw SQL.
func RunMigrations(database *gorm.DB) {
	log.Println("Running selective migrations...")

	// SQL Server workaround: drop default constraint on 'role' column before migrating
	// because GORM fails to alter columns with default constraints in SQL Server.
	database.Exec(`
		DECLARE @ConstraintName nvarchar(200)
		SELECT @ConstraintName = Name FROM sys.default_constraints
		WHERE PARENT_OBJECT_ID = OBJECT_ID('users') AND PARENT_COLUMN_ID = (SELECT column_id FROM sys.columns WHERE NAME = 'role' AND object_id = OBJECT_ID('users'))
		IF @ConstraintName IS NOT NULL
			EXEC('ALTER TABLE users DROP CONSTRAINT ' + @ConstraintName)
	`)

	database.Exec(`
		DECLARE @ConstraintNameTahun nvarchar(200)
		SELECT @ConstraintNameTahun = Name FROM sys.default_constraints
		WHERE PARENT_OBJECT_ID = OBJECT_ID('dblogfile') AND PARENT_COLUMN_ID = (SELECT column_id FROM sys.columns WHERE NAME = 'Tahun' AND object_id = OBJECT_ID('dblogfile'))
		IF @ConstraintNameTahun IS NOT NULL
			EXEC('ALTER TABLE dblogfile DROP CONSTRAINT ' + @ConstraintNameTahun)
	`)

	database.Exec(`
		DECLARE @ConstraintNameBulan nvarchar(200)
		SELECT @ConstraintNameBulan = Name FROM sys.default_constraints
		WHERE PARENT_OBJECT_ID = OBJECT_ID('dblogfile') AND PARENT_COLUMN_ID = (SELECT column_id FROM sys.columns WHERE NAME = 'Bulan' AND object_id = OBJECT_ID('dblogfile'))
		IF @ConstraintNameBulan IS NOT NULL
			EXEC('ALTER TABLE dblogfile DROP CONSTRAINT ' + @ConstraintNameBulan)
	`)

	// SQL Server workaround: drop existing FK before AutoMigrate if it exists
	// to prevent GORM from attempting to recreate an existing constraint.
	database.Exec(`
		IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_activity_log_config_fields')
		BEGIN
			ALTER TABLE activity_log_fields DROP CONSTRAINT fk_activity_log_config_fields;
		END
	`)

	// Auto-migrate the user and activity-log tables.
	// SActivityLogConfig and SActivityLogField live in the activity feature
	// package (not the persistence/models package), so we import it above.
	// AutoMigrate creates the tables on the first run and applies non-breaking
	// changes on subsequent runs. Run via `--migrate`, never at startup.
	err := database.AutoMigrate(
		&models.SUser{},
		&models.SDbBrowseConfig{},
		&activity.SActivityLogConfig{},
		&activity.SActivityLogField{},
	)
	if err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Run index migrations for legacy tables.
	// These tables (DBTRANS, DBTRANSAKSI, DBPERKIRAAN) belong to the Delphi
	// system and are NOT auto-migrated. We only create indexes needed for
	// the kasbank listing performance.
	runIndexMigrations(database)

	log.Println("Migrations completed successfully")
}

// runIndexMigrations creates performance indexes on legacy tables.
// Indexes are created with IF NOT EXISTS semantics to be idempotent.
func runIndexMigrations(db *gorm.DB) {
	log.Println("Running index migrations for legacy tables...")

	// Index for kasbank listing: covers the common filter pattern
	// TipeTransHd IN (BKM, BKK, BBM, BBK) AND Tanggal BETWEEN ... AND ...
	// This composite index dramatically improves the List() query performance
	// by allowing SQL Server to seek on TipeTransHd first, then range-scan on Tanggal.
	db.Exec(`
		IF NOT EXISTS (
			SELECT 1 FROM sys.indexes
			WHERE name = 'IX_DBTRANS_TipeTransHd_Tanggal'
			AND object_id = OBJECT_ID('DBTRANS')
		)
		BEGIN
			CREATE NONCLUSTERED INDEX IX_DBTRANS_TipeTransHd_Tanggal
			ON DBTRANS (TipeTransHd, Tanggal)
			INCLUDE (NoBukti, Note)
		END
	`)

	// Index for NoBukti lookups (used by GetByNoBukti, InsertHeader duplicate checks)
	db.Exec(`
		IF NOT EXISTS (
			SELECT 1 FROM sys.indexes
			WHERE name = 'IX_DBTRANS_NoBukti'
			AND object_id = OBJECT_ID('DBTRANS')
		)
		BEGIN
			CREATE NONCLUSTERED INDEX IX_DBTRANS_NoBukti
			ON DBTRANS (NoBukti)
		END
	`)

	// Index for DBTRANSAKSI joins (used by GetAggregateTotals, RecalcTotals)
	db.Exec(`
		IF NOT EXISTS (
			SELECT 1 FROM sys.indexes
			WHERE name = 'IX_DBTRANSAKSI_NoBukti'
			AND object_id = OBJECT_ID('DBTRANSAKSI')
		)
		BEGIN
			CREATE NONCLUSTERED INDEX IX_DBTRANSAKSI_NoBukti
			ON DBTRANSAKSI (NoBukti)
			INCLUDE (Debet, Kredit, Valas, Kurs)
		END
	`)

	log.Println("Index migrations completed")
}
