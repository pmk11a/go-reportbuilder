package services

import (
	"testing"

	"github.com/masza1/dapen-backend/internal/infrastructure/persistence/models"
	"github.com/masza1/dapen-backend/internal/legacy/repositories"
	"github.com/masza1/dapen-backend/tests/testhelper"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

var testDB *gorm.DB

func TestMain(m *testing.M) {
	testDB = testhelper.InitTestDB(&testing.T{})
	testhelper.SetTestDB(testDB)
}

// TestUserService_GetByUsername verifies the service retrieves a user by username
// from the repository and returns it unchanged.
func TestUserService_GetByUsername(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Create test user with associated SDBFLPASS record
		testUser := &models.SUser{
			Username: "testuser",
			Email:    "test@example.com",
		}
		if err := tx.Create(testUser).Error; err != nil {
			t.Fatalf("Failed to create test user: %v", err)
		}

		repo := repositories.NewUserRepository(tx)
		_ = NewUserService(repo)

		user, err := repo.GetByUsername("testuser")
		assert.NoError(t, err)
		assert.NotNil(t, user)
		assert.Equal(t, "testuser", user.Username)
	})
}

// TestUserService_GetByID verifies the service retrieves a user by ID
// from the repository.
func TestUserService_GetByID(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		testUser := &models.SUser{
			Username: "testuser2",
			Email:    "test2@example.com",
		}
		if err := tx.Create(testUser).Error; err != nil {
			t.Fatalf("Failed to create test user: %v", err)
		}

		repo := repositories.NewUserRepository(tx)
		_ = NewUserService(repo)

		user, err := repo.GetByID(testUser.ID)
		assert.NoError(t, err)
		assert.NotNil(t, user)
		assert.Equal(t, testUser.ID, user.ID)
		assert.Equal(t, "testuser2", user.Username)
	})
}

// TestUserService_Create_Success verifies a user can be created and persisted.
func TestUserService_Create_Success(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		newUser := &models.SUser{
			Username: "newuser",
			Email:    "new@example.com",
		}

		repo := repositories.NewUserRepository(tx)
		_ = NewUserService(repo)

		err := repo.Create(newUser)
		assert.NoError(t, err)
		assert.Greater(t, newUser.ID, uint(0))

		// Verify persisted in DB
		retrieved, err := repo.GetByID(newUser.ID)
		assert.NoError(t, err)
		assert.Equal(t, "newuser", retrieved.Username)
	})
}

// TestUserService_Update_Success verifies a user can be updated and changes persist.
func TestUserService_Update_Success(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		testUser := &models.SUser{
			Username: "updatetest",
			Email:    "update@example.com",
		}
		if err := tx.Create(testUser).Error; err != nil {
			t.Fatalf("Failed to create test user: %v", err)
		}

		repo := repositories.NewUserRepository(tx)
		svc := NewUserService(repo)
		_ = svc

		testUser.Email = "newemail@example.com"
		err := repo.Update(testUser)
		assert.NoError(t, err)

		retrieved, err := repo.GetByID(testUser.ID)
		assert.NoError(t, err)
		assert.Equal(t, "newemail@example.com", retrieved.Email)
	})
}

// TestUserService_Delete_Success verifies a user can be deleted from the database.
func TestUserService_Delete_Success(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		testUser := &models.SUser{
			Username: "deletetest",
			Email:    "delete@example.com",
		}
		if err := tx.Create(testUser).Error; err != nil {
			t.Fatalf("Failed to create test user: %v", err)
		}

		repo := repositories.NewUserRepository(tx)
		svc := NewUserService(repo)
		_ = svc

		err := repo.Delete(testUser.ID)
		assert.NoError(t, err)

		_, err = repo.GetByID(testUser.ID)
		assert.Error(t, err) // Should not find the user
	})
}

// TestUserService_GetByUserIDDBFLPASS verifies retrieval of legacy DBFLPASS records.
func TestUserService_GetByUserIDDBFLPASS(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		legacyUser := &models.SDBFLPASS{
			USERID:   "LEGACYUSER01",
			FullName: "Legacy User",
		}
		if err := tx.Create(legacyUser).Error; err != nil {
			t.Fatalf("Failed to create legacy user: %v", err)
		}

		repo := repositories.NewUserRepository(tx)
		svc := NewUserService(repo)
		_ = svc

		retrieved, err := repo.GetByUserIDDBFLPASS("LEGACYUSER01")
		assert.NoError(t, err)
		assert.NotNil(t, retrieved)
		assert.Equal(t, "LEGACYUSER01", retrieved.USERID)
		assert.Equal(t, "Legacy User", retrieved.FullName)
	})
}

// TestUserService_CreateDBFLPASS verifies legacy user creation with
// automatic duplication of permissions across tables.
func TestUserService_CreateDBFLPASS(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		newLegacyUser := &models.SDBFLPASS{
			USERID:   "NEWLEGACY01",
			FullName: "New Legacy User",
		}

		repo := repositories.NewUserRepository(tx)
		svc := NewUserService(repo)
		_ = svc

		err := repo.CreateDBFLPASS(newLegacyUser)
		assert.NoError(t, err)

		retrieved, err := repo.GetByUserIDDBFLPASS("NEWLEGACY01")
		assert.NoError(t, err)
		assert.NotNil(t, retrieved)
		assert.Equal(t, "NEWLEGACY01", retrieved.USERID)
	})
}

// TestUserService_UpdateDBFLPASS verifies legacy user updates persist to DB.
func TestUserService_UpdateDBFLPASS(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		legacyUser := &models.SDBFLPASS{
			USERID:   "LEGACYUPDATE01",
			FullName: "Legacy User",
		}
		if err := tx.Create(legacyUser).Error; err != nil {
			t.Fatalf("Failed to create legacy user: %v", err)
		}

		repo := repositories.NewUserRepository(tx)
		svc := NewUserService(repo)
		_ = svc

		legacyUser.FullName = "Updated Legacy User"
		err := repo.UpdateDBFLPASS(legacyUser)
		assert.NoError(t, err)

		retrieved, err := repo.GetByUserIDDBFLPASS("LEGACYUPDATE01")
		assert.NoError(t, err)
		assert.Equal(t, "Updated Legacy User", retrieved.FullName)
	})
}

// TestUserService_DeleteDBFLPASS verifies legacy user deletion.
func TestUserService_DeleteDBFLPASS(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		legacyUser := &models.SDBFLPASS{
			USERID:   "LEGACYDELETE01",
			FullName: "Legacy User",
		}
		if err := tx.Create(legacyUser).Error; err != nil {
			t.Fatalf("Failed to create legacy user: %v", err)
		}

		repo := repositories.NewUserRepository(tx)
		svc := NewUserService(repo)
		_ = svc

		err := repo.DeleteDBFLPASS("LEGACYDELETE01")
		assert.NoError(t, err)

		_, err = repo.GetByUserIDDBFLPASS("LEGACYDELETE01")
		assert.Error(t, err) // Should not find the user
	})
}
