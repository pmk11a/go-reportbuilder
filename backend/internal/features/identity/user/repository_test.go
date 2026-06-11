package user

import (
	"context"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlserver"
	"gorm.io/gorm"
)

func TestGetUserIDByLegacyUserID_Success(t *testing.T) {
	// Setup mock database
	sqlDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	defer sqlDB.Close()

	// Create GORM DB instance with mock driver
	gormDB, err := gorm.Open(sqlserver.New(sqlserver.Config{
		Conn: sqlDB,
	}), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to create GORM DB: %v", err)
	}

	// Create repository
	repo := NewUserRepository(gormDB)

	// Mock the SQL query - expect columns returned by SELECT
	now := time.Now()
	rows := sqlmock.NewRows([]string{"id", "name", "email", "user_id", "username", "password", "full_name", "role", "created_at", "updated_at"}).
		AddRow(1, "Test User", "test@example.com", "SA", "testuser", "hashed_pwd", "Test User", "admin", now, now)

	mock.ExpectQuery("SELECT.*FROM.*users.*WHERE.*user_id.*").
		WithArgs("SA").
		WillReturnRows(rows)

	// Execute
	userID, err := repo.GetUserIDByLegacyUserID(context.Background(), "SA")

	// Assert
	assert.NoError(t, err)
	assert.Equal(t, uint(1), userID)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetUserIDByLegacyUserID_NotFound(t *testing.T) {
	// Setup mock database
	sqlDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	defer sqlDB.Close()

	// Create GORM DB instance with mock driver
	gormDB, err := gorm.Open(sqlserver.New(sqlserver.Config{
		Conn: sqlDB,
	}), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to create GORM DB: %v", err)
	}

	// Create repository
	repo := NewUserRepository(gormDB)

	// Mock the SQL query with no results
	rows := sqlmock.NewRows([]string{"id", "name", "email", "user_id", "username", "password", "full_name", "role", "created_at", "updated_at"})

	mock.ExpectQuery("SELECT.*FROM.*users.*WHERE.*user_id.*").
		WithArgs("NONEXIST").
		WillReturnRows(rows)

	// Execute
	_, err = repo.GetUserIDByLegacyUserID(context.Background(), "NONEXIST")

	// Assert
	assert.Error(t, err)
	assert.Equal(t, gorm.ErrRecordNotFound, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetUserIDByLegacyUserID_MultipleUsers(t *testing.T) {
	// Setup mock database
	sqlDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	defer sqlDB.Close()

	// Create GORM DB instance with mock driver
	gormDB, err := gorm.Open(sqlserver.New(sqlserver.Config{
		Conn: sqlDB,
	}), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to create GORM DB: %v", err)
	}

	// Create repository
	repo := NewUserRepository(gormDB)

	// Mock the SQL query - return first of multiple (GORM First() behavior)
	now := time.Now()
	rows := sqlmock.NewRows([]string{"id", "name", "email", "user_id", "username", "password", "full_name", "role", "created_at", "updated_at"}).
		AddRow(5, "First User", "first@example.com", "ADM", "firstuser", "hashed_pwd", "First User", "admin", now, now).
		AddRow(6, "Second User", "second@example.com", "ADM", "seconduser", "hashed_pwd", "Second User", "admin", now, now)

	mock.ExpectQuery("SELECT.*FROM.*users.*WHERE.*user_id.*").
		WithArgs("ADM").
		WillReturnRows(rows)

	// Execute - First() returns only the first row
	userID, err := repo.GetUserIDByLegacyUserID(context.Background(), "ADM")

	// Assert - should return the ID of the first user
	assert.NoError(t, err)
	assert.Equal(t, uint(5), userID)
	assert.NoError(t, mock.ExpectationsWereMet())
}
