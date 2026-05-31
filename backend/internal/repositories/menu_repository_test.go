package repositories

import (
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/masza1/dapen-backend/internal/models"
	"github.com/stretchr/testify/assert"
)

// Reusing setupTestDB from user_repository_test.go isn't possible across packages without an exported util,
// but since this is in the same package `repositories`, we can reuse `setupTestDB` defined in `user_repository_test.go`.

func TestMenuRepository_FindByID(t *testing.T) {
	db, mock, err := setupTestDB()
	assert.NoError(t, err)

	repo := NewMenuRepository(db)

	t.Run("Success FindByID", func(t *testing.T) {
		rows := sqlmock.NewRows([]string{"KODEMENU", "Keterangan"}).
			AddRow("01", "Dashboard")

		mock.ExpectQuery(`SELECT \* FROM "DBMENU" WHERE KODEMENU = @p1 ORDER BY "DBMENU"\."KODEMENU" OFFSET 0 ROW FETCH NEXT 1 ROWS ONLY`).
			WithArgs("01").
			WillReturnRows(rows)

		menu, err := repo.FindByID("01")

		assert.NoError(t, err)
		assert.Equal(t, "01", menu.KODEMENU)
	})
}

func TestMenuRepository_FindPaginated(t *testing.T) {
	db, mock, err := setupTestDB()
	assert.NoError(t, err)

	repo := NewMenuRepository(db)

	t.Run("Success FindPaginated", func(t *testing.T) {
		mock.ExpectQuery(`SELECT count\(\*\) FROM "DBMENU"`).
			WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(2))

		rows := sqlmock.NewRows([]string{"KODEMENU", "Keterangan"}).
			AddRow("01", "Menu 1").AddRow("02", "Menu 2")

		mock.ExpectQuery(`SELECT \* FROM "DBMENU" ORDER BY KODEMENU ASC OFFSET 0 ROW FETCH NEXT 10 ROWS ONLY`).
			WillReturnRows(rows)

		menus, total, err := repo.FindPaginated(1, 10, "")
		assert.NoError(t, err)
		assert.Equal(t, int64(2), total)
		assert.Len(t, menus, 2)
	})

	t.Run("Success FindPaginated with search", func(t *testing.T) {
		mock.ExpectQuery(`SELECT count\(\*\) FROM "DBMENU" WHERE KODEMENU LIKE @p1 OR Keterangan LIKE @p2`).
			WithArgs("%Menu%", "%Menu%").
			WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))

		rows := sqlmock.NewRows([]string{"KODEMENU", "Keterangan"}).
			AddRow("01", "Menu 1")

		mock.ExpectQuery(`SELECT \* FROM "DBMENU" WHERE KODEMENU LIKE @p1 OR Keterangan LIKE @p2 ORDER BY KODEMENU ASC OFFSET 0 ROW FETCH NEXT 10 ROWS ONLY`).
			WithArgs("%Menu%", "%Menu%").
			WillReturnRows(rows)

		menus, total, err := repo.FindPaginated(1, 10, "Menu")
		assert.NoError(t, err)
		assert.Equal(t, int64(1), total)
		assert.Len(t, menus, 1)
	})
}

func TestMenuRepository_FindParentsByLevel(t *testing.T) {
	db, mock, err := setupTestDB()
	assert.NoError(t, err)

	repo := NewMenuRepository(db)

	t.Run("Success FindParentsByLevel", func(t *testing.T) {
		rows := sqlmock.NewRows([]string{"KODEMENU", "L0"}).
			AddRow("01", 1)

		mock.ExpectQuery(`SELECT \* FROM "DBMENU" WHERE L0 = @p1 ORDER BY KODEMENU ASC`).
			WithArgs(1).
			WillReturnRows(rows)

		menus, err := repo.FindParentsByLevel(1)
		assert.NoError(t, err)
		assert.Len(t, menus, 1)
	})
}

func TestMenuRepository_CreateUpdateDelete(t *testing.T) {
	db, mock, err := setupTestDB()
	assert.NoError(t, err)

	repo := NewMenuRepository(db)

	t.Run("Create", func(t *testing.T) {
		menu := &models.SDbMenu{KODEMENU: "01"}
		mock.ExpectBegin()
		mock.ExpectExec(`INSERT INTO "DBMENU"`).WillReturnResult(sqlmock.NewResult(1, 1))
		mock.ExpectCommit()

		err := repo.Create(menu)
		assert.NoError(t, err)
	})

	t.Run("Update", func(t *testing.T) {
		menu := &models.SDbMenu{KODEMENU: "01"}
		mock.ExpectBegin()
		mock.ExpectExec(`UPDATE "DBMENU"`).WillReturnResult(sqlmock.NewResult(1, 1))
		mock.ExpectCommit()

		err := repo.Update(menu)
		assert.NoError(t, err)
	})

	t.Run("Delete", func(t *testing.T) {
		mock.ExpectBegin()
		mock.ExpectExec(`DELETE FROM "DBMENU" WHERE KODEMENU = @p1`).
			WithArgs("01").
			WillReturnResult(sqlmock.NewResult(1, 1))
		mock.ExpectCommit()

		err := repo.Delete("01")
		assert.NoError(t, err)
	})
}
