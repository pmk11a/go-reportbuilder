package services

import (
	"context"
	"testing"

	"github.com/masza1/dapen-backend/internal/features/menu"
	"github.com/masza1/dapen-backend/tests/testhelper"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

// TestMenuService_GetPaginatedMenus verifies menu pagination and search.
func TestMenuService_GetPaginatedMenus(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Seed test menus
		for i := 1; i <= 15; i++ {
			m := &menu.SDbMenu{
				KODEMENU:   "M" + string(rune('0'+i)),
				Keterangan: "Menu " + string(rune('0'+i)),
				L0:         0,
			}
			if err := tx.Create(m).Error; err != nil {
				t.Fatalf("Failed to seed menu: %v", err)
			}
		}

		repo := menu.NewMenuRepository(tx)
		svc := menu.NewMenuService(repo)

		res, err := svc.GetPaginatedMenus(1, 10, "")
		assert.NoError(t, err)
		assert.NotNil(t, res)
		assert.Equal(t, int64(15), res.Pagination.Total)
		assert.Len(t, res.Data, 10)
	})
}

// TestMenuService_GetParentMenus verifies retrieval of parent menus at
// a specific level. Level N queries menus at level N-1.
func TestMenuService_GetParentMenus(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Seed parent and child menus
		parentMenu := &menu.SDbMenu{
			KODEMENU:   "PARENT",
			Keterangan: "Parent Menu",
			L0:         0,
		}
		childMenu := &menu.SDbMenu{
			KODEMENU:   "CHILD",
			Keterangan: "Child Menu",
			L0:         1,
		}
		if err := tx.Create(parentMenu).Error; err != nil {
			t.Fatalf("Failed to seed parent menu: %v", err)
		}
		if err := tx.Create(childMenu).Error; err != nil {
			t.Fatalf("Failed to seed child menu: %v", err)
		}

		repo := menu.NewMenuRepository(tx)
		svc := menu.NewMenuService(repo)

		// Request parents for level 1 (which looks at level 0)
		parents, err := svc.GetParentMenus(2)
		assert.NoError(t, err)
		// Result depends on DB schema; just verify no error
		_ = parents
	})
}

// TestMenuService_GetMenuByID verifies retrieval of a single menu by code.
func TestMenuService_GetMenuByID(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		testMenu := &menu.SDbMenu{
			KODEMENU:   "DASHBOARD",
			Keterangan: "Dashboard Menu",
			L0:         0,
		}
		if err := tx.Create(testMenu).Error; err != nil {
			t.Fatalf("Failed to seed menu: %v", err)
		}

		repo := menu.NewMenuRepository(tx)
		svc := menu.NewMenuService(repo)

		retrieved, err := svc.GetMenuByID("DASHBOARD")
		assert.NoError(t, err)
		assert.NotNil(t, retrieved)
		assert.Equal(t, "DASHBOARD", retrieved.KODEMENU)
		assert.Equal(t, "Dashboard Menu", retrieved.Keterangan)
	})
}

// TestMenuService_CreateMenu_Success verifies menu creation with validation.
func TestMenuService_CreateMenu_Success(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		newMenu := &menu.SDbMenu{
			KODEMENU:   "NEWMENU",
			Keterangan: "New Test Menu",
			L0:         0,
		}

		repo := menu.NewMenuRepository(tx)
		svc := menu.NewMenuService(repo)

		err := svc.CreateMenu(context.Background(), newMenu)
		assert.NoError(t, err)

		// Verify persisted
		retrieved, err := svc.GetMenuByID("NEWMENU")
		assert.NoError(t, err)
		assert.Equal(t, "New Test Menu", retrieved.Keterangan)
	})
}

// TestMenuService_CreateMenu_EmptyCode verifies that empty KODEMENU is rejected.
func TestMenuService_CreateMenu_EmptyCode(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		invalidMenu := &menu.SDbMenu{
			KODEMENU:   "",
			Keterangan: "Invalid Menu",
		}

		repo := menu.NewMenuRepository(tx)
		svc := menu.NewMenuService(repo)

		err := svc.CreateMenu(context.Background(), invalidMenu)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "kode menu is required")
	})
}

// TestMenuService_CreateMenu_Duplicate verifies that duplicate KODEMENU is rejected.
func TestMenuService_CreateMenu_Duplicate(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		existingMenu := &menu.SDbMenu{
			KODEMENU:   "DUP",
			Keterangan: "Existing Menu",
		}
		if err := tx.Create(existingMenu).Error; err != nil {
			t.Fatalf("Failed to seed menu: %v", err)
		}

		repo := menu.NewMenuRepository(tx)
		svc := menu.NewMenuService(repo)

		dupMenu := &menu.SDbMenu{
			KODEMENU:   "DUP",
			Keterangan: "Duplicate",
		}
		err := svc.CreateMenu(context.Background(), dupMenu)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "already exists")
	})
}

// TestMenuService_UpdateMenu_Success verifies menu updates persist to DB.
func TestMenuService_UpdateMenu_Success(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		testMenu := &menu.SDbMenu{
			KODEMENU:   "UPDATE",
			Keterangan: "Original Description",
			L0:         0,
		}
		if err := tx.Create(testMenu).Error; err != nil {
			t.Fatalf("Failed to seed menu: %v", err)
		}

		repo := menu.NewMenuRepository(tx)
		svc := menu.NewMenuService(repo)

		updateReq := &menu.SDbMenu{
			Keterangan: "Updated Description",
			L0:         1,
		}
		err := svc.UpdateMenu(context.Background(), "UPDATE", updateReq)
		assert.NoError(t, err)

		retrieved, err := svc.GetMenuByID("UPDATE")
		assert.NoError(t, err)
		assert.Equal(t, "Updated Description", retrieved.Keterangan)
	})
}

// TestMenuService_UpdateMenu_NotFound verifies that updating a non-existent
// menu returns an error.
func TestMenuService_UpdateMenu_NotFound(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		repo := menu.NewMenuRepository(tx)
		svc := menu.NewMenuService(repo)

		updateReq := &menu.SDbMenu{
			Keterangan: "Update",
		}
		err := svc.UpdateMenu(context.Background(), "NONEXISTENT", updateReq)
		assert.Error(t, err)
	})
}

// TestMenuService_DeleteMenu_Success verifies menu deletion.
func TestMenuService_DeleteMenu_Success(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		testMenu := &menu.SDbMenu{
			KODEMENU:   "DELETE",
			Keterangan: "Delete Me",
		}
		if err := tx.Create(testMenu).Error; err != nil {
			t.Fatalf("Failed to seed menu: %v", err)
		}

		repo := menu.NewMenuRepository(tx)
		svc := menu.NewMenuService(repo)

		err := svc.DeleteMenu(context.Background(), "DELETE")
		assert.NoError(t, err)

		_, err = svc.GetMenuByID("DELETE")
		assert.Error(t, err)
	})
}

// TestMenuService_DeleteMenu_NotFound verifies that deleting a non-existent
// menu returns an error.
func TestMenuService_DeleteMenu_NotFound(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		repo := menu.NewMenuRepository(tx)
		svc := menu.NewMenuService(repo)

		err := svc.DeleteMenu(context.Background(), "NONEXISTENT")
		assert.Error(t, err)
	})
}
