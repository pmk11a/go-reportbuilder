package services

import (
	"testing"

	"github.com/masza1/dapen-backend/internal/infrastructure/persistence/models"
	"github.com/masza1/dapen-backend/internal/legacy/repositories"
	"github.com/masza1/dapen-backend/tests/testhelper"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

// TestPeriodeService_GetPeriode_ExistingRecord verifies retrieval of an
// existing periode record by userID.
func TestPeriodeService_GetPeriode_ExistingRecord(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		existingPeriode := &models.DBPeriode{
			USERID: "USR001",
			BULAN:  "01",
			TAHUN:  "2024",
		}
		if err := tx.Create(existingPeriode).Error; err != nil {
			t.Fatalf("Failed to seed periode: %v", err)
		}

		repo := repositories.NewPeriodeRepository(tx)
		svc := NewPeriodeService(repo)

		res, err := svc.GetPeriode("USR001")
		assert.NoError(t, err)
		assert.NotNil(t, res)
		assert.Equal(t, "USR001", res.USERID)
		assert.Equal(t, "01", res.BULAN)
		assert.Equal(t, "2024", res.TAHUN)
	})
}

// TestPeriodeService_GetPeriode_NotFound verifies that when no record exists,
// a new empty periode is returned with the userID set (firstOrNew behavior).
func TestPeriodeService_GetPeriode_NotFound(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		repo := repositories.NewPeriodeRepository(tx)
		svc := NewPeriodeService(repo)

		res, err := svc.GetPeriode("UNKNOWN_USER")
		assert.NoError(t, err)
		assert.NotNil(t, res)
		assert.Equal(t, "UNKNOWN_USER", res.USERID)
		// BULAN and TAHUN should be empty
		assert.Equal(t, "", res.BULAN)
		assert.Equal(t, "", res.TAHUN)
	})
}

// TestPeriodeService_SetPeriode_Create verifies that SetPeriode creates
// a new record when one doesn't exist (upsert behavior).
func TestPeriodeService_SetPeriode_Create(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		repo := repositories.NewPeriodeRepository(tx)
		svc := NewPeriodeService(repo)

		err := svc.SetPeriode("USR002", "06", "2024")
		assert.NoError(t, err)

		// Verify created
		retrieved, err := repo.GetPeriodeByUserID("USR002")
		assert.NoError(t, err)
		assert.NotNil(t, retrieved)
		assert.Equal(t, "USR002", retrieved.USERID)
		assert.Equal(t, "06", retrieved.BULAN)
		assert.Equal(t, "2024", retrieved.TAHUN)
	})
}

// TestPeriodeService_SetPeriode_Update verifies that SetPeriode overwrites
// an existing record (upsert behavior).
func TestPeriodeService_SetPeriode_Update(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		existingPeriode := &models.DBPeriode{
			USERID: "USR003",
			BULAN:  "01",
			TAHUN:  "2024",
		}
		if err := tx.Create(existingPeriode).Error; err != nil {
			t.Fatalf("Failed to seed periode: %v", err)
		}

		repo := repositories.NewPeriodeRepository(tx)
		svc := NewPeriodeService(repo)

		// Update with different month/year
		err := svc.SetPeriode("USR003", "12", "2025")
		assert.NoError(t, err)

		// Verify updated
		retrieved, err := repo.GetPeriodeByUserID("USR003")
		assert.NoError(t, err)
		assert.NotNil(t, retrieved)
		assert.Equal(t, "12", retrieved.BULAN)
		assert.Equal(t, "2025", retrieved.TAHUN)
	})
}

// TestPeriodeService_SetPeriode_MultipleUsers verifies that SetPeriode
// operates independently per user (no cross-contamination).
func TestPeriodeService_SetPeriode_MultipleUsers(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		repo := repositories.NewPeriodeRepository(tx)
		svc := NewPeriodeService(repo)

		// Create records for different users
		err1 := svc.SetPeriode("USR_A", "03", "2024")
		err2 := svc.SetPeriode("USR_B", "04", "2024")
		assert.NoError(t, err1)
		assert.NoError(t, err2)

		// Verify each user has their own record
		userA, err := repo.GetPeriodeByUserID("USR_A")
		assert.NoError(t, err)
		assert.Equal(t, "03", userA.BULAN)

		userB, err := repo.GetPeriodeByUserID("USR_B")
		assert.NoError(t, err)
		assert.Equal(t, "04", userB.BULAN)
	})
}
