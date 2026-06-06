package repositories

import (
	"testing"

	"github.com/masza1/dapen-backend/internal/infrastructure/persistence/models"
	"github.com/masza1/dapen-backend/tests/testhelper"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

var periodeTestDB *gorm.DB

func init() {
	periodeTestDB = testhelper.InitTestDB(&testing.T{})
	testhelper.SetTestDB(periodeTestDB)
}

// TestPeriodeRepository_GetPeriodeByUserID tests retrieving a periode record by user ID.
func TestPeriodeRepository_GetPeriodeByUserID(t *testing.T) {
	testhelper.WithTestTx(t, periodeTestDB, func(tx *gorm.DB) {
		// Arrange: Create a test periode record
		periode := &models.DBPeriode{
			USERID: "USER001",
			BULAN:  "03",
			TAHUN:  "2024",
		}
		assert.NoError(t, tx.Create(periode).Error)

		repo := NewPeriodeRepository(tx)

		// Act: Get periode by user ID
		result, err := repo.GetPeriodeByUserID("USER001")

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, "USER001", result.USERID)
		assert.Equal(t, "03", result.BULAN)
		assert.Equal(t, "2024", result.TAHUN)
	})
}

// TestPeriodeRepository_GetPeriodeByUserIDNotFound tests retrieving non-existent periode.
func TestPeriodeRepository_GetPeriodeByUserIDNotFound(t *testing.T) {
	testhelper.WithTestTx(t, periodeTestDB, func(tx *gorm.DB) {
		repo := NewPeriodeRepository(tx)

		// Act: Get periode for non-existent user
		result, err := repo.GetPeriodeByUserID("NONEXISTENT_USER")

		// Assert: Should return nil without error (special behavior per interface)
		assert.NoError(t, err)
		assert.Nil(t, result)
	})
}

// TestPeriodeRepository_UpsertPeriodeCreate tests creating a new periode record via Upsert.
func TestPeriodeRepository_UpsertPeriodeCreate(t *testing.T) {
	testhelper.WithTestTx(t, periodeTestDB, func(tx *gorm.DB) {
		// Arrange
		newPeriode := &models.DBPeriode{
			USERID: "NEWUSER",
			BULAN:  "06",
			TAHUN:  "2024",
		}

		repo := NewPeriodeRepository(tx)

		// Act: Upsert (create) periode
		err := repo.UpsertPeriode(newPeriode)

		// Assert
		assert.NoError(t, err)

		// Verify it was persisted
		retrieved, err := repo.GetPeriodeByUserID("NEWUSER")
		assert.NoError(t, err)
		assert.NotNil(t, retrieved)
		assert.Equal(t, "NEWUSER", retrieved.USERID)
		assert.Equal(t, "06", retrieved.BULAN)
		assert.Equal(t, "2024", retrieved.TAHUN)
	})
}

// TestPeriodeRepository_UpsertPeriodeUpdate tests updating an existing periode record via Upsert.
func TestPeriodeRepository_UpsertPeriodeUpdate(t *testing.T) {
	testhelper.WithTestTx(t, periodeTestDB, func(tx *gorm.DB) {
		// Arrange: Create initial periode record
		periode := &models.DBPeriode{
			USERID: "UPDATEUSER",
			BULAN:  "01",
			TAHUN:  "2024",
		}
		assert.NoError(t, tx.Create(periode).Error)

		repo := NewPeriodeRepository(tx)

		// Act: Upsert with updated values
		updatedPeriode := &models.DBPeriode{
			USERID: "UPDATEUSER",
			BULAN:  "12",
			TAHUN:  "2025",
		}
		err := repo.UpsertPeriode(updatedPeriode)

		// Assert
		assert.NoError(t, err)

		// Verify the update
		retrieved, err := repo.GetPeriodeByUserID("UPDATEUSER")
		assert.NoError(t, err)
		assert.NotNil(t, retrieved)
		assert.Equal(t, "UPDATEUSER", retrieved.USERID)
		assert.Equal(t, "12", retrieved.BULAN)
		assert.Equal(t, "2025", retrieved.TAHUN)
	})
}

// TestPeriodeRepository_UpsertPeriodeMultipleUsers tests Upsert with multiple users.
func TestPeriodeRepository_UpsertPeriodeMultipleUsers(t *testing.T) {
	testhelper.WithTestTx(t, periodeTestDB, func(tx *gorm.DB) {
		// Arrange: Create multiple periode records
		periodes := []models.DBPeriode{
			{
				USERID: "USER1",
				BULAN:  "01",
				TAHUN:  "2024",
			},
			{
				USERID: "USER2",
				BULAN:  "02",
				TAHUN:  "2024",
			},
		}

		for _, p := range periodes {
			assert.NoError(t, tx.Create(&p).Error)
		}

		repo := NewPeriodeRepository(tx)

		// Act: Update USER1's periode
		updatedPeriode := &models.DBPeriode{
			USERID: "USER1",
			BULAN:  "06",
			TAHUN:  "2024",
		}
		err := repo.UpsertPeriode(updatedPeriode)

		// Assert
		assert.NoError(t, err)

		// Verify USER1 was updated
		user1, err := repo.GetPeriodeByUserID("USER1")
		assert.NoError(t, err)
		assert.Equal(t, "06", user1.BULAN)
		assert.Equal(t, "2024", user1.TAHUN)

		// Verify USER2 remains unchanged
		user2, err := repo.GetPeriodeByUserID("USER2")
		assert.NoError(t, err)
		assert.Equal(t, "02", user2.BULAN)
		assert.Equal(t, "2024", user2.TAHUN)
	})
}
