package activity

import (
	"testing"
	"time"

	"github.com/masza1/dapen-backend/tests/testhelper"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

var testDB *gorm.DB

func init() {
	testDB = testhelper.InitTestDB(&testing.T{})
	testhelper.SetTestDB(testDB)
}

// TestActivityLogRepository_GetConfigs tests retrieving all activity log configurations.
func TestActivityLogRepository_GetConfigs(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create test configurations with fields
		config1 := &SActivityLogConfig{
			TargetTable:     "users",
			DisplayName:     "User Management",
			SourceName:      "SUser",
			PrimaryKeyField: "id",
			IsEnabled:       true,
			LogCreate:       true,
			LogUpdate:       true,
			LogDelete:       true,
			Fields: []SActivityLogField{
				{
					FieldName:   "username",
					DisplayName: "Username",
					IsTracked:   true,
					IsSensitive: false,
					FieldType:   "string",
					SortOrder:   1,
				},
				{
					FieldName:   "email",
					DisplayName: "Email",
					IsTracked:   true,
					IsSensitive: true,
					FieldType:   "string",
					SortOrder:   2,
				},
			},
		}

		assert.NoError(t, tx.Create(config1).Error)

		repo := NewActivityLogRepository(tx)

		// Act: Get all configurations
		configs, err := repo.GetConfigs()

		// Assert
		assert.NoError(t, err)
		assert.Greater(t, len(configs), 0)
		// Check that we can find our created config with preloaded fields
		found := false
		for _, c := range configs {
			if c.TargetTable == "users" {
				found = true
				assert.Equal(t, "User Management", c.DisplayName)
				assert.GreaterOrEqual(t, len(c.Fields), 2)
				break
			}
		}
		assert.True(t, found, "Expected to find users config in results")
	})
}

// TestActivityLogRepository_GetConfigByTableName tests retrieving a specific configuration.
func TestActivityLogRepository_GetConfigByTableName(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create a test configuration
		config := &SActivityLogConfig{
			TargetTable:     "DBPERKIRAAN",
			DisplayName:     "Account Management",
			SourceName:      "SDbPerkiraan",
			PrimaryKeyField: "perkiraan",
			IsEnabled:       true,
			LogCreate:       true,
			LogUpdate:       true,
			LogDelete:       false,
			Fields: []SActivityLogField{
				{
					FieldName:   "keterangan",
					DisplayName: "Description",
					IsTracked:   true,
					IsSensitive: false,
					FieldType:   "string",
					SortOrder:   1,
				},
			},
		}

		assert.NoError(t, tx.Create(config).Error)

		repo := NewActivityLogRepository(tx)

		// Act: Get config by table name
		result, err := repo.GetConfigByTableName("DBPERKIRAAN")

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, "DBPERKIRAAN", result.TargetTable)
		assert.Equal(t, "Account Management", result.DisplayName)
		assert.True(t, result.LogCreate)
		assert.False(t, result.LogDelete)
		// Fields should be preloaded
		assert.GreaterOrEqual(t, len(result.Fields), 1)
	})
}

// TestActivityLogRepository_GetConfigByTableNameNotFound tests retrieving non-existent configuration.
func TestActivityLogRepository_GetConfigByTableNameNotFound(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		repo := NewActivityLogRepository(tx)

		// Act: Get config for non-existent table
		result, err := repo.GetConfigByTableName("NONEXISTENT_TABLE_XYZ")

		// Assert: Should return error (RecordNotFound)
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Equal(t, gorm.ErrRecordNotFound, err)
	})
}

// TestActivityLogRepository_SaveConfigCreate tests creating a new configuration.
func TestActivityLogRepository_SaveConfigCreate(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange
		newConfig := &SActivityLogConfig{
			TargetTable:     "DBCUSTSUPP",
			DisplayName:     "Customer/Supplier Management",
			SourceName:      "SDbCustSupp",
			PrimaryKeyField: "kodecustsupp",
			IsEnabled:       true,
			LogCreate:       true,
			LogUpdate:       true,
			LogDelete:       true,
			Fields: []SActivityLogField{
				{
					FieldName:   "namacustsupp",
					DisplayName: "Name",
					IsTracked:   true,
					IsSensitive: false,
					FieldType:   "string",
					SortOrder:   1,
				},
			},
		}

		repo := NewActivityLogRepository(tx)

		// Act: Save the new config
		err := repo.SaveConfig(newConfig)

		// Assert
		assert.NoError(t, err)
		assert.NotZero(t, newConfig.ID)

		// Verify it was persisted
		retrieved, err := repo.GetConfigByTableName("DBCUSTSUPP")
		assert.NoError(t, err)
		assert.Equal(t, "DBCUSTSUPP", retrieved.TargetTable)
		assert.Equal(t, "Customer/Supplier Management", retrieved.DisplayName)
		assert.GreaterOrEqual(t, len(retrieved.Fields), 1)
	})
}

// TestActivityLogRepository_SaveConfigUpdate tests updating an existing configuration.
func TestActivityLogRepository_SaveConfigUpdate(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create initial config
		config := &SActivityLogConfig{
			TargetTable:     "DBDEPART",
			DisplayName:     "Department Old",
			SourceName:      "SDBDEPART",
			PrimaryKeyField: "kodedepart",
			IsEnabled:       true,
			LogCreate:       true,
			LogUpdate:       true,
			LogDelete:       true,
			Fields: []SActivityLogField{
				{
					FieldName:   "namadef",
					DisplayName: "Name",
					IsTracked:   true,
					IsSensitive: false,
					FieldType:   "string",
					SortOrder:   1,
				},
			},
		}

		assert.NoError(t, tx.Create(config).Error)
		originalID := config.ID

		repo := NewActivityLogRepository(tx)

		// Act: Update the config
		config.DisplayName = "Department New"
		config.LogDelete = false
		config.Fields = []SActivityLogField{
			{
				FieldName:   "namadef",
				DisplayName: "Name",
				IsTracked:   true,
				IsSensitive: false,
				FieldType:   "string",
				SortOrder:   1,
			},
			{
				FieldName:   "namamanager",
				DisplayName: "Manager Name",
				IsTracked:   true,
				IsSensitive: false,
				FieldType:   "string",
				SortOrder:   2,
			},
		}

		err := repo.SaveConfig(config)

		// Assert
		assert.NoError(t, err)
		assert.Equal(t, originalID, config.ID)

		// Verify the update
		updated, err := repo.GetConfigByTableName("DBDEPART")
		assert.NoError(t, err)
		assert.Equal(t, "Department New", updated.DisplayName)
		assert.False(t, updated.LogDelete)
		// Fields should be replaced (2 instead of original 1)
		assert.Equal(t, 2, len(updated.Fields))
	})
}

// TestActivityLogRepository_GetLogs tests retrieving activity logs.
func TestActivityLogRepository_GetLogs(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create test activity logs
		now := time.Now()
		logs := []SDBLogFile{
			{
				Tahun:      int32(now.Year()),
				Bulan:      int32(now.Month()),
				Tanggal:    now,
				Pemakai:    "admin",
				Aktivitas:  "INSERT",
				Sumber:     "users",
				NoBukti:    "001",
				Keterangan: "User created",
			},
			{
				Tahun:      int32(now.Year()),
				Bulan:      int32(now.Month()),
				Tanggal:    now.Add(-time.Hour),
				Pemakai:    "admin",
				Aktivitas:  "UPDATE",
				Sumber:     "users",
				NoBukti:    "002",
				Keterangan: "User updated",
			},
		}

		for _, log := range logs {
			assert.NoError(t, tx.Create(&log).Error)
		}

		repo := NewActivityLogRepository(tx)

		// Act: Get logs with pagination
		retrievedLogs, total, err := repo.GetLogs(10, 0)

		// Assert
		assert.NoError(t, err)
		assert.GreaterOrEqual(t, total, int64(2))
		assert.GreaterOrEqual(t, len(retrievedLogs), 2)
		// Logs should be ordered by date desc (most recent first)
		assert.Equal(t, "INSERT", retrievedLogs[0].Aktivitas)
		assert.Equal(t, "UPDATE", retrievedLogs[1].Aktivitas)
	})
}

// TestActivityLogRepository_GetLogsPagination tests log pagination.
func TestActivityLogRepository_GetLogsPagination(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create multiple logs
		now := time.Now()
		for i := 0; i < 5; i++ {
			log := SDBLogFile{
				Tahun:      int32(now.Year()),
				Bulan:      int32(now.Month()),
				Tanggal:    now.Add(-time.Duration(i) * time.Hour),
				Pemakai:    "admin",
				Aktivitas:  "INSERT",
				Sumber:     "test_table",
				NoBukti:    "00" + string(rune(49+i)),
				Keterangan: "Test log " + string(rune(49+i)),
			}
			assert.NoError(t, tx.Create(&log).Error)
		}

		repo := NewActivityLogRepository(tx)

		// Act: Get first page
		page1, total, err := repo.GetLogs(2, 0)

		// Assert first page
		assert.NoError(t, err)
		assert.GreaterOrEqual(t, total, int64(5))
		assert.Equal(t, 2, len(page1))

		// Act: Get second page
		page2, total, err := repo.GetLogs(2, 2)

		// Assert second page
		assert.NoError(t, err)
		assert.GreaterOrEqual(t, total, int64(5))
		assert.Equal(t, 2, len(page2))

		// Pages should have different logs
		assert.NotEqual(t, page1[0].NoBukti, page2[0].NoBukti)
	})
}

// TestActivityLogRepository_GetTables tests retrieving all user tables from SQL Server.
func TestActivityLogRepository_GetTables(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		repo := NewActivityLogRepository(tx)

		// Act: Get all tables
		tables, err := repo.GetTables()

		// Assert
		assert.NoError(t, err)
		assert.Greater(t, len(tables), 0)
		// Should at least find tables we know exist (created by AutoMigrate)
		tableMap := make(map[string]bool)
		for _, t := range tables {
			tableMap[t] = true
		}
		// These tables should exist after migrations
		expectedTables := []string{"users", "DBFLPASS", "DBMENU"}
		for _, expected := range expectedTables {
			assert.True(t, tableMap[expected], "Expected table %s to exist", expected)
		}
	})
}

// TestActivityLogRepository_GetTableColumns tests retrieving columns for a specific table.
func TestActivityLogRepository_GetTableColumns(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		repo := NewActivityLogRepository(tx)

		// Act: Get columns for "users" table
		columns, err := repo.GetTableColumns("users")

		// Assert
		assert.NoError(t, err)
		assert.Greater(t, len(columns), 0)
		// Check for expected columns
		columnMap := make(map[string]bool)
		for _, c := range columns {
			columnMap[c] = true
		}
		// These are expected columns in the users table
		expectedColumns := []string{"id", "username", "password"}
		for _, expected := range expectedColumns {
			assert.True(t, columnMap[expected] || columnMap[expected+"s"],
				"Expected column %s (or plural) to exist in users table", expected)
		}
	})
}

// TestActivityLogRepository_GetTableColumnsEmpty tests querying columns for non-existent table.
func TestActivityLogRepository_GetTableColumnsEmpty(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		repo := NewActivityLogRepository(tx)

		// Act: Get columns for non-existent table
		columns, err := repo.GetTableColumns("NONEXISTENT_TABLE_XYZ")

		// Assert: Should return empty slice without error (SQL Server just returns empty)
		assert.NoError(t, err)
		assert.Equal(t, 0, len(columns))
	})
}
