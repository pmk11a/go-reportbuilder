package repositories

import (
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/masza1/dapen-backend/internal/models"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

func TestPeriodeRepository_GetPeriodeByUserID(t *testing.T) {
	db, mock, err := setupTestDB()
	assert.NoError(t, err)

	repo := NewPeriodeRepository(db)

	t.Run("Success GetPeriodeByUserID", func(t *testing.T) {
		rows := sqlmock.NewRows([]string{"USERID", "BULAN", "TAHUN"}).
			AddRow("USR01", "01", "2024")

		mock.ExpectQuery(`SELECT \* FROM "DBPERIODE" WHERE USERID = @p1 ORDER BY "DBPERIODE"\."USERID" OFFSET 0 ROW FETCH NEXT 1 ROWS ONLY`).
			WithArgs("USR01").
			WillReturnRows(rows)

		periode, err := repo.GetPeriodeByUserID("USR01")

		assert.NoError(t, err)
		if periode != nil {
			assert.Equal(t, "USR01", periode.USERID)
			assert.Equal(t, "01", periode.BULAN)
		}
	})

	t.Run("Not Found GetPeriodeByUserID", func(t *testing.T) {
		mock.ExpectQuery(`SELECT \* FROM "DBPERIODE" WHERE USERID = @p1 ORDER BY "DBPERIODE"\."USERID" OFFSET 0 ROW FETCH NEXT 1 ROWS ONLY`).
			WithArgs("USR01").
			WillReturnError(gorm.ErrRecordNotFound)

		periode, err := repo.GetPeriodeByUserID("USR01")

		assert.NoError(t, err)
		assert.Nil(t, periode)
	})
}

func TestPeriodeRepository_UpsertPeriode(t *testing.T) {
	t.Run("Create new periode", func(t *testing.T) {
		db, mock, err := setupTestDB()
		assert.NoError(t, err)
		repo := NewPeriodeRepository(db)

		periode := &models.DBPeriode{
			USERID: "USR01",
			BULAN:  "01",
			TAHUN:  "2024",
		}

		mock.ExpectQuery(`SELECT \* FROM "DBPERIODE" WHERE USERID = @p1 ORDER BY "DBPERIODE"\."USERID" OFFSET 0 ROW FETCH NEXT 1 ROWS ONLY`).
			WithArgs("USR01").
			WillReturnError(gorm.ErrRecordNotFound)

		mock.ExpectBegin()
		mock.ExpectExec(`INSERT INTO "DBPERIODE"`).WillReturnResult(sqlmock.NewResult(1, 1))
		mock.ExpectCommit()

		err = repo.UpsertPeriode(periode)
		assert.NoError(t, err)
	})

	t.Run("Update existing periode", func(t *testing.T) {
		db, mock, err := setupTestDB()
		assert.NoError(t, err)
		repo := NewPeriodeRepository(db)

		periode := &models.DBPeriode{
			USERID: "USR01",
			BULAN:  "02",
			TAHUN:  "2024",
		}

		rows := sqlmock.NewRows([]string{"USERID", "BULAN", "TAHUN"}).
			AddRow("USR01", "01", "2024")

		mock.ExpectQuery(`SELECT \* FROM "DBPERIODE" WHERE USERID = @p1 ORDER BY "DBPERIODE"\."USERID" OFFSET 0 ROW FETCH NEXT 1 ROWS ONLY`).
			WithArgs("USR01").
			WillReturnRows(rows)

		mock.ExpectBegin()
		mock.ExpectExec(`UPDATE "DBPERIODE"`).
			WillReturnResult(sqlmock.NewResult(1, 1))
		mock.ExpectCommit()

		err = repo.UpsertPeriode(periode)
		assert.NoError(t, err)
	})
}
