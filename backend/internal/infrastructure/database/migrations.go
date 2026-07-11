package database

import (
	"log"

	"github.com/masza1/dapen-backend/internal/features/activity"
	"github.com/masza1/dapen-backend/internal/infrastructure/persistence/models"
	"gorm.io/gorm"
)

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

	log.Println("Migrations completed successfully")
}
