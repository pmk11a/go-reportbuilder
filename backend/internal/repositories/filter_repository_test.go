package repositories

import (
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
)

func TestFilterRepository_GetPerkiraan(t *testing.T) {
	db, mock, err := setupTestDB()
	assert.NoError(t, err)

	repo := NewFilterRepository(db)

	t.Run("Success GetPerkiraan", func(t *testing.T) {
		rows := sqlmock.NewRows([]string{"Perkiraan", "NamaPerkiraan", "Level"}).
			AddRow("1000", "Kas", 1)

		mock.ExpectQuery(`SELECT \* FROM "DBPERKIRAAN" WHERE Tipe = @p1`).
			WithArgs(1).
			WillReturnRows(rows)

		perkiraans, err := repo.GetPerkiraan("", "", "")

		assert.NoError(t, err)
		assert.Len(t, perkiraans, 1)
		assert.Equal(t, "1000", perkiraans[0].Perkiraan)
	})
}

func TestFilterRepository_GetCustomers(t *testing.T) {
	db, mock, err := setupTestDB()
	assert.NoError(t, err)

	repo := NewFilterRepository(db)

	t.Run("Success GetCustomers", func(t *testing.T) {
		mock.ExpectQuery(`(?i)SELECT.*DBCUSTSUPP`).
			WithArgs(1).
			WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))

		rows := sqlmock.NewRows([]string{"KODECUSTSUPP", "NAMACUSTSUPP"}).
			AddRow("C001", "Customer 1")

		mock.ExpectQuery(`(?i)SELECT.*DBCUSTSUPP`).
			WillReturnRows(rows)

		customers, total, err := repo.GetCustomers(1, "", 0, 10)

		assert.NoError(t, err)
		assert.Equal(t, int64(1), total)
		assert.Len(t, customers, 1)
	})

	t.Run("Success GetCustomers with search", func(t *testing.T) {
		mock.ExpectQuery(`(?i)SELECT.*DBCUSTSUPP`).
			WithArgs(1, "%Cust%", "%Cust%").
			WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))

		rows := sqlmock.NewRows([]string{"KODECUSTSUPP", "NAMACUSTSUPP"}).
			AddRow("C001", "Customer 1")

		mock.ExpectQuery(`(?i)SELECT.*DBCUSTSUPP`).
			WillReturnRows(rows)

		customers, total, err := repo.GetCustomers(1, "Cust", 0, 10)

		assert.NoError(t, err)
		assert.Equal(t, int64(1), total)
		assert.Len(t, customers, 1)
	})
}

func TestFilterRepository_GetKelompokKas(t *testing.T) {
	db, mock, err := setupTestDB()
	assert.NoError(t, err)

	repo := NewFilterRepository(db)

	t.Run("Success GetKelompokKas", func(t *testing.T) {
		rows := sqlmock.NewRows([]string{"Perkiraan", "Keterangan"}).
			AddRow("1000", "Kas")

		mock.ExpectQuery(`(?is)SELECT.*DBPERKIRAAN.*DBPOSTHUTPIUT`).
			WithArgs("T1").
			WillReturnRows(rows)

		kelompokKas, err := repo.GetKelompokKas("T1", "")

		assert.NoError(t, err)
		assert.Len(t, kelompokKas, 1)
	})
}
