package repositories

import (
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/masza1/dapen-backend/internal/models"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

func TestActivityLogRepository_GetConfigs(t *testing.T) {
	db, mock, err := setupTestDB()
	assert.NoError(t, err)

	repo := NewActivityLogRepository(db)

	t.Run("Success GetConfigs", func(t *testing.T) {
		rows := sqlmock.NewRows([]string{"id", "table_name"}).
			AddRow(1, "users")
		mock.ExpectQuery(`(?i)SELECT \* FROM "activity_log_config"`).WillReturnRows(rows)
		
		fieldRows := sqlmock.NewRows([]string{"config_id", "field_name"}).
			AddRow(1, "username")
		mock.ExpectQuery(`SELECT \* FROM "activity_log_fields" WHERE "activity_log_fields"\."config_id" = @p1`).
			WithArgs(1).
			WillReturnRows(fieldRows)

		configs, err := repo.GetConfigs()
		assert.NoError(t, err)
		assert.Len(t, configs, 1)
	})
}

func TestActivityLogRepository_GetConfigByTableName(t *testing.T) {
	db, mock, err := setupTestDB()
	assert.NoError(t, err)

	repo := NewActivityLogRepository(db)

	t.Run("Success", func(t *testing.T) {
		rows := sqlmock.NewRows([]string{"id", "table_name"}).
			AddRow(1, "users")
		mock.ExpectQuery(`(?i)SELECT \* FROM "activity_log_config" WHERE table_name = @p1`).
			WithArgs("users").
			WillReturnRows(rows)

		fieldRows := sqlmock.NewRows([]string{"config_id", "field_name"}).
			AddRow(1, "username")
		mock.ExpectQuery(`SELECT \* FROM "activity_log_fields" WHERE "activity_log_fields"\."config_id" = @p1`).
			WithArgs(1).
			WillReturnRows(fieldRows)

		config, err := repo.GetConfigByTableName("users")
		assert.NoError(t, err)
		assert.NotNil(t, config)
	})

	t.Run("Not Found", func(t *testing.T) {
		mock.ExpectQuery(`(?i)SELECT \* FROM "activity_log_config" WHERE table_name = @p1`).
			WithArgs("unknown").
			WillReturnError(gorm.ErrRecordNotFound)

		config, err := repo.GetConfigByTableName("unknown")
		assert.Error(t, err)
		assert.Nil(t, config)
	})
}

func TestActivityLogRepository_SaveConfig(t *testing.T) {
	db, mock, err := setupTestDB()
	assert.NoError(t, err)

	repo := NewActivityLogRepository(db)

	t.Run("Create New", func(t *testing.T) {
		cfg := &models.SActivityLogConfig{
			TargetTable: "users",
			Fields: []models.SActivityLogField{{FieldName: "name"}},
		}

		mock.ExpectBegin()
		mock.ExpectQuery(`(?i)SELECT \* FROM "activity_log_config" WHERE table_name = @p1`).
			WithArgs("users").
			WillReturnError(gorm.ErrRecordNotFound)
			
		mock.ExpectQuery(`(?i)INSERT INTO "activity_log_config"`).WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
		mock.ExpectQuery(`(?i)INSERT INTO "activity_log_fields"`).WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
		mock.ExpectCommit()

		err := repo.SaveConfig(cfg)
		assert.NoError(t, err)
	})
}

func TestActivityLogRepository_GetLogs(t *testing.T) {
	db, mock, err := setupTestDB()
	assert.NoError(t, err)

	repo := NewActivityLogRepository(db)

	t.Run("Success", func(t *testing.T) {
		mock.ExpectQuery(`(?i)SELECT count\(\*\) FROM "dblogfile"`).
			WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))
		
		rows := sqlmock.NewRows([]string{"KODEMENU", "keterangan"}).AddRow("01", "desc")
		mock.ExpectQuery(`(?i)SELECT \* FROM "dblogfile"`).
			WillReturnRows(rows)

		logs, total, err := repo.GetLogs(10, 0)
		assert.NoError(t, err)
		assert.Equal(t, int64(1), total)
		assert.Len(t, logs, 1)
	})
}

func TestActivityLogRepository_GetTables(t *testing.T) {
	db, mock, err := setupTestDB()
	assert.NoError(t, err)

	repo := NewActivityLogRepository(db)

	t.Run("Success", func(t *testing.T) {
		rows := sqlmock.NewRows([]string{"TABLE_NAME"}).AddRow("users")
		mock.ExpectQuery(`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'`).
			WillReturnRows(rows)

		tables, err := repo.GetTables()
		assert.NoError(t, err)
		assert.Len(t, tables, 1)
		assert.Equal(t, "users", tables[0])
	})
}

func TestActivityLogRepository_GetTableColumns(t *testing.T) {
	db, mock, err := setupTestDB()
	assert.NoError(t, err)

	repo := NewActivityLogRepository(db)

	t.Run("Success", func(t *testing.T) {
		rows := sqlmock.NewRows([]string{"COLUMN_NAME"}).AddRow("username")
		mock.ExpectQuery(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = @p1`).
			WithArgs("users").
			WillReturnRows(rows)

		cols, err := repo.GetTableColumns("users")
		assert.NoError(t, err)
		assert.Len(t, cols, 1)
		assert.Equal(t, "username", cols[0])
	})
}
