package repositories

import (
	"os"
	"testing"

	"github.com/masza1/dapen-backend/internal/infrastructure/persistence/models"
	"github.com/masza1/dapen-backend/tests/testhelper"
	"github.com/stretchr/testify/assert"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var testDB *gorm.DB

func TestMain(m *testing.M) {
	testDB = testhelper.InitTestDB(nil)
	code := m.Run()
	os.Exit(code)
}

// ─── GORM USERS TABLE TESTS ───

// TestUserRepository_GetByUsername tests retrieving a user by username.
func TestUserRepository_GetByUsername(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create a test user
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		testUser := &models.SUser{
			Username: "testuser",
			Password: string(hashedPassword),
			Name:     "Test User",
			Email:    "test@example.com",
			Role:     models.RoleEmployee,
		}
		assert.NoError(t, tx.Create(testUser).Error)

		repo := NewUserRepository(tx)

		// Act: Retrieve user by username
		user, err := repo.GetByUsername("testuser")

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, user)
		assert.Equal(t, "testuser", user.Username)
		assert.Equal(t, "Test User", user.Name)
		assert.Equal(t, "test@example.com", user.Email)
	})
}

// TestUserRepository_GetByUsernameNotFound tests retrieving non-existent user.
func TestUserRepository_GetByUsernameNotFound(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		repo := NewUserRepository(tx)

		// Act: Try to retrieve non-existent user
		user, err := repo.GetByUsername("nonexistent")

		// Assert
		assert.Error(t, err)
		assert.Nil(t, user)
		assert.Equal(t, gorm.ErrRecordNotFound, err)
	})
}

// TestUserRepository_GetByID tests retrieving a user by ID.
func TestUserRepository_GetByID(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create a test user
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		testUser := &models.SUser{
			Username: "getbyidtest",
			Password: string(hashedPassword),
			Name:     "Get By ID Test",
			Email:    "getbyid@example.com",
			Role:     models.RoleEmployee,
		}
		assert.NoError(t, tx.Create(testUser).Error)

		repo := NewUserRepository(tx)

		// Act: Retrieve user by ID
		user, err := repo.GetByID(testUser.ID)

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, user)
		assert.Equal(t, testUser.ID, user.ID)
		assert.Equal(t, "getbyidtest", user.Username)
		assert.Equal(t, "Get By ID Test", user.Name)
	})
}

// TestUserRepository_GetByIDNotFound tests retrieving non-existent user by ID.
func TestUserRepository_GetByIDNotFound(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		repo := NewUserRepository(tx)

		// Act: Try to retrieve non-existent user by ID
		user, err := repo.GetByID(99999)

		// Assert
		assert.Error(t, err)
		assert.Nil(t, user)
		assert.Equal(t, gorm.ErrRecordNotFound, err)
	})
}

// TestUserRepository_Create tests creating a new user.
func TestUserRepository_Create(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		newUser := &models.SUser{
			Username: "newuser",
			Password: string(hashedPassword),
			Name:     "New User",
			Email:    "newuser@example.com",
			Role:     models.RoleEmployee,
		}

		repo := NewUserRepository(tx)

		// Act: Create user
		err := repo.Create(newUser)

		// Assert
		assert.NoError(t, err)
		assert.NotZero(t, newUser.ID)

		// Verify it was persisted
		retrieved, err := repo.GetByUsername("newuser")
		assert.NoError(t, err)
		assert.NotNil(t, retrieved)
		assert.Equal(t, "New User", retrieved.Name)
	})
}

// TestUserRepository_Update tests updating an existing user.
func TestUserRepository_Update(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create a test user
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		testUser := &models.SUser{
			Username: "updatetest",
			Password: string(hashedPassword),
			Name:     "Original Name",
			Email:    "original@example.com",
			Role:     models.RoleEmployee,
		}
		assert.NoError(t, tx.Create(testUser).Error)

		repo := NewUserRepository(tx)

		// Act: Update user
		testUser.Name = "Updated Name"
		testUser.Email = "updated@example.com"
		testUser.Role = models.RoleAdmin
		err := repo.Update(testUser)

		// Assert
		assert.NoError(t, err)

		// Verify the update
		updated, err := repo.GetByID(testUser.ID)
		assert.NoError(t, err)
		assert.Equal(t, "Updated Name", updated.Name)
		assert.Equal(t, "updated@example.com", updated.Email)
		assert.Equal(t, models.RoleAdmin, updated.Role)
	})
}

// TestUserRepository_Delete tests deleting a user (soft delete via DeletedAt).
func TestUserRepository_Delete(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create a test user
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		testUser := &models.SUser{
			Username: "deletetest",
			Password: string(hashedPassword),
			Name:     "Delete Test",
			Email:    "delete@example.com",
		}
		assert.NoError(t, tx.Create(testUser).Error)
		userID := testUser.ID

		repo := NewUserRepository(tx)

		// Act: Delete user
		err := repo.Delete(userID)

		// Assert
		assert.NoError(t, err)

		// Verify soft delete (should not find the user anymore)
		deleted, err := repo.GetByID(userID)
		assert.Error(t, err)
		assert.Nil(t, deleted)

		// But the record should still exist in the database (soft delete)
		var hardDeletedUser models.SUser
		result := tx.Unscoped().First(&hardDeletedUser, userID)
		assert.NoError(t, result.Error)
		assert.NotNil(t, hardDeletedUser.DeletedAt)
	})
}

// ─── LEGACY DBFLPASS TABLE TESTS ───

// TestUserRepository_GetPaginatedDBFLPASS tests retrieving DBFLPASS records with pagination.
func TestUserRepository_GetPaginatedDBFLPASS(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create test DBFLPASS records
		dbflpassUsers := []models.SDBFLPASS{
			{
				USERID:   "USER1",
				UID:      "user1",
				FullName: "User One",
				TINGKAT:  "0",
				STATUS:   "0",
			},
			{
				USERID:   "USER2",
				UID:      "user2",
				FullName: "User Two",
				TINGKAT:  "1",
				STATUS:   "0",
			},
			{
				USERID:   "USER3",
				UID:      "user3",
				FullName: "User Three",
				TINGKAT:  "2",
				STATUS:   "1",
			},
		}

		for _, u := range dbflpassUsers {
			assert.NoError(t, tx.Create(&u).Error)
		}

		repo := NewUserRepository(tx)

		// Act: Get paginated DBFLPASS
		results, total, err := repo.GetPaginatedDBFLPASS(1, 2, "", "")

		// Assert
		assert.NoError(t, err)
		assert.GreaterOrEqual(t, total, int64(3))
		assert.Equal(t, 2, len(results))
	})
}

// TestUserRepository_GetPaginatedDBFLPASSWithSearch tests DBFLPASS pagination with search filter.
func TestUserRepository_GetPaginatedDBFLPASSWithSearch(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create test DBFLPASS records
		dbflpassUsers := []models.SDBFLPASS{
			{
				USERID:   "ADMIN1",
				UID:      "admin1",
				FullName: "Admin One",
				TINGKAT:  "2",
				STATUS:   "0",
			},
			{
				USERID:   "EMP1",
				UID:      "emp1",
				FullName: "Employee One",
				TINGKAT:  "0",
				STATUS:   "0",
			},
		}

		for _, u := range dbflpassUsers {
			assert.NoError(t, tx.Create(&u).Error)
		}

		repo := NewUserRepository(tx)

		// Act: Search for "Admin"
		results, total, err := repo.GetPaginatedDBFLPASS(1, 10, "Admin", "")

		// Assert
		assert.NoError(t, err)
		assert.GreaterOrEqual(t, total, int64(1))
		assert.Greater(t, len(results), 0)
		assert.Equal(t, "Admin One", results[0].FullName)
	})
}

// TestUserRepository_GetPaginatedDBFLPASSWithStatusFilter tests DBFLPASS pagination with status filter.
func TestUserRepository_GetPaginatedDBFLPASSWithStatusFilter(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create test DBFLPASS records with different statuses
		dbflpassUsers := []models.SDBFLPASS{
			{
				USERID:   "ACTIVE1",
				UID:      "active1",
				FullName: "Active User",
				TINGKAT:  "0",
				STATUS:   "0", // Active
			},
			{
				USERID:   "INACTIVE1",
				UID:      "inactive1",
				FullName: "Inactive User",
				TINGKAT:  "0",
				STATUS:   "1", // Inactive
			},
		}

		for _, u := range dbflpassUsers {
			assert.NoError(t, tx.Create(&u).Error)
		}

		repo := NewUserRepository(tx)

		// Act: Filter by status "0" (active)
		results, total, err := repo.GetPaginatedDBFLPASS(1, 10, "", "0")

		// Assert
		assert.NoError(t, err)
		assert.GreaterOrEqual(t, total, int64(1))
		assert.Greater(t, len(results), 0)
	})
}

// TestUserRepository_GetByUserIDDBFLPASS tests retrieving a specific DBFLPASS record by UserID.
func TestUserRepository_GetByUserIDDBFLPASS(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create a test DBFLPASS record
		dbflpass := &models.SDBFLPASS{
			USERID:   "TESTUSER",
			UID:      "testuser",
			FullName: "Test User",
			TINGKAT:  "1",
			STATUS:   "0",
		}
		assert.NoError(t, tx.Create(dbflpass).Error)

		repo := NewUserRepository(tx)

		// Act: Retrieve by UserID
		result, err := repo.GetByUserIDDBFLPASS("TESTUSER")

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, "TESTUSER", result.USERID)
		assert.Equal(t, "Test User", result.FullName)
		assert.Equal(t, "1", result.TINGKAT)
	})
}

// TestUserRepository_GetByUserIDDBFLPASSNotFound tests retrieving non-existent DBFLPASS record.
func TestUserRepository_GetByUserIDDBFLPASSNotFound(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		repo := NewUserRepository(tx)

		// Act: Try to retrieve non-existent DBFLPASS
		result, err := repo.GetByUserIDDBFLPASS("NONEXISTENT")

		// Assert
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Equal(t, gorm.ErrRecordNotFound, err)
	})
}

// TestUserRepository_CreateDBFLPASS tests creating a new DBFLPASS record.
func TestUserRepository_CreateDBFLPASS(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange
		newDBFLPASS := &models.SDBFLPASS{
			USERID:   "NEWUSER",
			UID:      "newuser",
			FullName: "New User",
			TINGKAT:  "0",
			STATUS:   "0",
		}

		repo := NewUserRepository(tx)

		// Act: Create DBFLPASS record
		err := repo.CreateDBFLPASS(newDBFLPASS)

		// Assert
		assert.NoError(t, err)

		// Verify it was persisted
		retrieved, err := repo.GetByUserIDDBFLPASS("NEWUSER")
		assert.NoError(t, err)
		assert.NotNil(t, retrieved)
		assert.Equal(t, "New User", retrieved.FullName)
	})
}

// TestUserRepository_UpdateDBFLPASS tests updating an existing DBFLPASS record.
func TestUserRepository_UpdateDBFLPASS(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create a test DBFLPASS record
		dbflpass := &models.SDBFLPASS{
			USERID:   "UPDATEUSER",
			UID:      "updateuser",
			FullName: "Original Name",
			TINGKAT:  "0",
			STATUS:   "0",
		}
		assert.NoError(t, tx.Create(dbflpass).Error)

		repo := NewUserRepository(tx)

		// Act: Update DBFLPASS record
		dbflpass.FullName = "Updated Name"
		dbflpass.TINGKAT = "2"
		dbflpass.STATUS = "1"
		err := repo.UpdateDBFLPASS(dbflpass)

		// Assert
		assert.NoError(t, err)

		// Verify the update
		updated, err := repo.GetByUserIDDBFLPASS("UPDATEUSER")
		assert.NoError(t, err)
		assert.Equal(t, "Updated Name", updated.FullName)
		assert.Equal(t, "2", updated.TINGKAT)
		assert.Equal(t, "1", updated.STATUS)
	})
}

// TestUserRepository_DeleteDBFLPASS tests deleting a DBFLPASS record (hard delete).
func TestUserRepository_DeleteDBFLPASS(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create a test DBFLPASS record
		dbflpass := &models.SDBFLPASS{
			USERID:   "DELETEUSER",
			UID:      "deleteuser",
			FullName: "Delete User",
			TINGKAT:  "0",
			STATUS:   "0",
		}
		assert.NoError(t, tx.Create(dbflpass).Error)

		repo := NewUserRepository(tx)

		// Act: Delete DBFLPASS record
		err := repo.DeleteDBFLPASS("DELETEUSER")

		// Assert
		assert.NoError(t, err)

		// Verify deletion
		deleted, err := repo.GetByUserIDDBFLPASS("DELETEUSER")
		assert.Error(t, err)
		assert.Nil(t, deleted)
		assert.Equal(t, gorm.ErrRecordNotFound, err)
	})
}
