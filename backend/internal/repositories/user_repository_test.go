package repositories

import (
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/masza1/dapen-backend/internal/models"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlserver"
	"gorm.io/gorm"
)

func setupTestDB() (*gorm.DB, sqlmock.Sqlmock, error) {
	sqlDB, mock, err := sqlmock.New()
	if err != nil {
		return nil, nil, err
	}
	db, err := gorm.Open(sqlserver.New(sqlserver.Config{
		Conn: sqlDB,
	}), &gorm.Config{})
	return db, mock, err
}

func TestUserRepository_GetByUsername(t *testing.T) {
	db, mock, err := setupTestDB()
	assert.NoError(t, err)

	repo := NewUserRepository(db)

	t.Run("Success GetByUsername", func(t *testing.T) {
		rows := sqlmock.NewRows([]string{"id", "username", "password", "name"}).
			AddRow(1, "admin", "hash", "Administrator")

		mock.ExpectQuery(`SELECT \* FROM "users" WHERE username = @p1 AND "users"\."deleted_at" IS NULL ORDER BY "users"\."id" OFFSET 0 ROW FETCH NEXT 1 ROWS ONLY`).
			WithArgs("admin").
			WillReturnRows(rows)

		user, err := repo.GetByUsername("admin")

		assert.NoError(t, err)
		if user != nil {
			assert.Equal(t, uint(1), user.ID)
			assert.Equal(t, "Administrator", user.Name)
		}
	})

	t.Run("Not Found", func(t *testing.T) {
		mock.ExpectQuery(`SELECT \* FROM "users" WHERE username = @p1 AND "users"\."deleted_at" IS NULL ORDER BY "users"\."id" OFFSET 0 ROW FETCH NEXT 1 ROWS ONLY`).
			WithArgs("wrong").
			WillReturnError(gorm.ErrRecordNotFound)

		user, err := repo.GetByUsername("wrong")

		assert.Error(t, err)
		assert.Nil(t, user)
		assert.Equal(t, gorm.ErrRecordNotFound, err)
	})
}

func TestUserRepository_Create(t *testing.T) {
	db, mock, err := setupTestDB()
	assert.NoError(t, err)

	repo := NewUserRepository(db)

	t.Run("Success Create", func(t *testing.T) {
		now := time.Now()
		user := &models.SUser{
			Username: "newuser",
			Password: "pwd",
			Name: "New User",
			CreatedAt: now,
			UpdatedAt: now,
		}

		mock.ExpectBegin()
		mock.ExpectQuery(`INSERT INTO "users"`).WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(2))
		mock.ExpectCommit()

		err := repo.Create(user)

		assert.NoError(t, err)
	})
}

func TestUserRepository_GetByID(t *testing.T) {
	db, mock, err := setupTestDB()
	assert.NoError(t, err)

	repo := NewUserRepository(db)

	t.Run("Success GetByID", func(t *testing.T) {
		rows := sqlmock.NewRows([]string{"id", "username", "password", "name"}).
			AddRow(1, "admin", "hash", "Administrator")

		mock.ExpectQuery(`SELECT \* FROM "users" WHERE "users"\."id" = @p1 AND "users"\."deleted_at" IS NULL ORDER BY "users"\."id" OFFSET 0 ROW FETCH NEXT 1 ROWS ONLY`).
			WithArgs(1).
			WillReturnRows(rows)

		user, err := repo.GetByID(1)

		assert.NoError(t, err)
		if user != nil {
			assert.Equal(t, uint(1), user.ID)
		}
	})

	t.Run("Not Found", func(t *testing.T) {
		mock.ExpectQuery(`SELECT \* FROM "users" WHERE "users"\."id" = @p1 AND "users"\."deleted_at" IS NULL ORDER BY "users"\."id" OFFSET 0 ROW FETCH NEXT 1 ROWS ONLY`).
			WithArgs(99).
			WillReturnError(gorm.ErrRecordNotFound)

		user, err := repo.GetByID(99)

		assert.Error(t, err)
		assert.Nil(t, user)
		assert.Equal(t, gorm.ErrRecordNotFound, err)
	})
}

func TestUserRepository_Update(t *testing.T) {
	t.Run("Success Update", func(t *testing.T) {
		db, mock, err := setupTestDB()
		assert.NoError(t, err)
		repo := NewUserRepository(db)

		now := time.Now()
		user := &models.SUser{
			ID: 1,
			Username: "admin",
			UpdatedAt: now,
		}

		mock.ExpectBegin()
		mock.ExpectExec(`(?i)UPDATE "users"`).
			WillReturnResult(sqlmock.NewResult(1, 1))
		mock.ExpectCommit()

		err = repo.Update(user)
		assert.NoError(t, err)
	})

	t.Run("Update with DBFLPASS", func(t *testing.T) {
		db, mock, err := setupTestDB()
		assert.NoError(t, err)
		repo := NewUserRepository(db)

		now := time.Now()
		user := &models.SUser{
			ID: 1,
			Username: "admin",
			UpdatedAt: now,
			SDBFLPASS: &models.SDBFLPASS{
				USERID: "admin",
			},
		}

		mock.ExpectBegin()
		mock.ExpectExec(`(?is)MERGE INTO "DBFLPASS"`).WillReturnResult(sqlmock.NewResult(1, 1))
		mock.ExpectExec(`(?i)UPDATE.*users`).WillReturnResult(sqlmock.NewResult(1, 1))
		mock.ExpectExec(`(?i)UPDATE.*DBFLPASS`).WillReturnResult(sqlmock.NewResult(1, 1))
		mock.ExpectCommit()

		err = repo.Update(user)
		assert.NoError(t, err)
	})
}
