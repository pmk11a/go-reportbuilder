package menu

import (
	"testing"

	"github.com/masza1/dapen-backend/tests/testhelper"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

var testDB *gorm.DB

func init() {
	testDB = testhelper.InitTestDB(&testing.T{})
	testhelper.SetTestDB(testDB)
}

// TestMenuRepository_FindByID tests retrieving a menu by its code.
func TestMenuRepository_FindByID(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create a test menu
		menu := &SDbMenu{
			KODEMENU:   "MENU001",
			Keterangan: "Dashboard",
			L0:         1,
			ACCESS:     1,
			OL:         0,
			Icon:       "dashboard",
		}
		assert.NoError(t, tx.Create(menu).Error)

		repo := NewMenuRepository(tx)

		// Act: Find menu by ID
		result, err := repo.FindByID("MENU001")

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, "MENU001", result.KODEMENU)
		assert.Equal(t, "Dashboard", result.Keterangan)
		assert.Equal(t, 1, result.L0)
	})
}

// TestMenuRepository_FindByIDNotFound tests retrieving non-existent menu.
func TestMenuRepository_FindByIDNotFound(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		repo := NewMenuRepository(tx)

		// Act: Try to find non-existent menu
		result, err := repo.FindByID("NONEXISTENT")

		// Assert
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Equal(t, gorm.ErrRecordNotFound, err)
	})
}

// TestMenuRepository_FindPaginated tests retrieving menus with pagination.
func TestMenuRepository_FindPaginated(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create test menus
		menus := []SDbMenu{
			{
				KODEMENU:   "MENU001",
				Keterangan: "Dashboard",
				L0:         1,
				ACCESS:     1,
				OL:         0,
				Icon:       "dashboard",
			},
			{
				KODEMENU:   "MENU002",
				Keterangan: "Settings",
				L0:         1,
				ACCESS:     1,
				OL:         0,
				Icon:       "settings",
			},
			{
				KODEMENU:   "MENU003",
				Keterangan: "Users",
				L0:         1,
				ACCESS:     1,
				OL:         0,
				Icon:       "users",
			},
		}

		for _, m := range menus {
			assert.NoError(t, tx.Create(&m).Error)
		}

		repo := NewMenuRepository(tx)

		// Act: Get menus paginated
		results, total, err := repo.FindPaginated(1, 2, "")

		// Assert
		assert.NoError(t, err)
		assert.GreaterOrEqual(t, total, int64(3))
		assert.Equal(t, 2, len(results))
	})
}

// TestMenuRepository_FindPaginatedWithSearch tests menu search functionality.
func TestMenuRepository_FindPaginatedWithSearch(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create test menus
		menus := []SDbMenu{
			{
				KODEMENU:   "MENU001",
				Keterangan: "User Management",
				L0:         1,
				ACCESS:     1,
				OL:         0,
				Icon:       "users",
			},
			{
				KODEMENU:   "MENU002",
				Keterangan: "User Settings",
				L0:         1,
				ACCESS:     1,
				OL:         0,
				Icon:       "settings",
			},
			{
				KODEMENU:   "MENU003",
				Keterangan: "Dashboard",
				L0:         1,
				ACCESS:     1,
				OL:         0,
				Icon:       "dashboard",
			},
		}

		for _, m := range menus {
			assert.NoError(t, tx.Create(&m).Error)
		}

		repo := NewMenuRepository(tx)

		// Act: Search for "User"
		results, total, err := repo.FindPaginated(1, 10, "User")

		// Assert
		assert.NoError(t, err)
		assert.GreaterOrEqual(t, total, int64(2))
		// Check that results contain User-related menus
		assert.Greater(t, len(results), 0)
	})
}

// TestMenuRepository_FindPaginatedPageTwo tests pagination on second page.
func TestMenuRepository_FindPaginatedPageTwo(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create multiple menus
		for i := 1; i <= 5; i++ {
			menu := SDbMenu{
				KODEMENU:   "MENU00" + string(rune(48+i)),
				Keterangan: "Menu " + string(rune(48+i)),
				L0:         1,
				ACCESS:     1,
				OL:         0,
				Icon:       "icon",
			}
			assert.NoError(t, tx.Create(&menu).Error)
		}

		repo := NewMenuRepository(tx)

		// Act: Get second page
		page1, total1, err := repo.FindPaginated(1, 2, "")
		assert.NoError(t, err)

		page2, total2, err := repo.FindPaginated(2, 2, "")

		// Assert
		assert.NoError(t, err)
		assert.Equal(t, total1, total2) // Same total count
		assert.Equal(t, 2, len(page1))
		assert.Equal(t, 2, len(page2))
		// Ensure different menus on different pages
		assert.NotEqual(t, page1[0].KODEMENU, page2[0].KODEMENU)
	})
}

// TestMenuRepository_FindParentsByLevel tests retrieving menus at a specific level.
func TestMenuRepository_FindParentsByLevel(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create menus at different levels
		menus := []SDbMenu{
			{
				KODEMENU:   "PARENT1",
				Keterangan: "Parent Menu 1",
				L0:         1,
				ACCESS:     1,
				OL:         0,
				Icon:       "icon1",
			},
			{
				KODEMENU:   "PARENT2",
				Keterangan: "Parent Menu 2",
				L0:         1,
				ACCESS:     1,
				OL:         0,
				Icon:       "icon2",
			},
			{
				KODEMENU:   "CHILD1",
				Keterangan: "Child Menu 1",
				L0:         2,
				ACCESS:     1,
				OL:         0,
				Icon:       "icon3",
			},
		}

		for _, m := range menus {
			assert.NoError(t, tx.Create(&m).Error)
		}

		repo := NewMenuRepository(tx)

		// Act: Get menus at level 1
		results, err := repo.FindParentsByLevel(1)

		// Assert
		assert.NoError(t, err)
		assert.GreaterOrEqual(t, len(results), 2)
		// All results should be at level 1
		for _, m := range results {
			assert.Equal(t, 1, m.L0)
		}
	})
}

// TestMenuRepository_FindParentsByLevelEmpty tests retrieving menus at level with no results.
func TestMenuRepository_FindParentsByLevelEmpty(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		repo := NewMenuRepository(tx)

		// Act: Get menus at level 99 (which doesn't exist)
		results, err := repo.FindParentsByLevel(99)

		// Assert: Should return empty slice without error
		assert.NoError(t, err)
		assert.Equal(t, 0, len(results))
	})
}

// TestMenuRepository_Create tests creating a new menu.
func TestMenuRepository_Create(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange
		newMenu := &SDbMenu{
			KODEMENU:   "NEWMENU",
			Keterangan: "New Menu",
			L0:         1,
			ACCESS:     1,
			OL:         0,
			Icon:       "newicon",
		}

		repo := NewMenuRepository(tx)

		// Act: Create menu
		err := repo.Create(newMenu)

		// Assert
		assert.NoError(t, err)

		// Verify it was persisted
		retrieved, err := repo.FindByID("NEWMENU")
		assert.NoError(t, err)
		assert.NotNil(t, retrieved)
		assert.Equal(t, "New Menu", retrieved.Keterangan)
	})
}

// TestMenuRepository_Update tests updating an existing menu.
func TestMenuRepository_Update(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create a test menu
		menu := &SDbMenu{
			KODEMENU:   "UPDATETEST",
			Keterangan: "Original Menu",
			L0:         1,
			ACCESS:     1,
			OL:         0,
			Icon:       "original",
		}
		assert.NoError(t, tx.Create(menu).Error)

		repo := NewMenuRepository(tx)

		// Act: Update menu
		menu.Keterangan = "Updated Menu"
		menu.Icon = "updated"
		err := repo.Update(menu)

		// Assert
		assert.NoError(t, err)

		// Verify the update
		updated, err := repo.FindByID("UPDATETEST")
		assert.NoError(t, err)
		assert.Equal(t, "Updated Menu", updated.Keterangan)
		assert.Equal(t, "updated", updated.Icon)
	})
}

// TestMenuRepository_Delete tests deleting a menu.
func TestMenuRepository_Delete(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create a test menu
		menu := &SDbMenu{
			KODEMENU:   "DELETETEST",
			Keterangan: "Menu to Delete",
			L0:         1,
			ACCESS:     1,
			OL:         0,
			Icon:       "delete",
		}
		assert.NoError(t, tx.Create(menu).Error)

		repo := NewMenuRepository(tx)

		// Act: Delete menu
		err := repo.Delete("DELETETEST")

		// Assert
		assert.NoError(t, err)

		// Verify deletion
		deleted, err := repo.FindByID("DELETETEST")
		assert.Error(t, err)
		assert.Nil(t, deleted)
		assert.Equal(t, gorm.ErrRecordNotFound, err)
	})
}
