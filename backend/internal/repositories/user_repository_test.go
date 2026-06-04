package repositories

import (
	"testing"

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

	t.Run("Success Create DBFLPASS", func(t *testing.T) {
		user := &models.SDBFLPASS{
			USERID:   "SA",
			UID:      "superadmin",
			FullName: "Super Admin",
			TINGKAT:  "2",
			STATUS:   "1",
			UID2:     "pwd",
		}

		mock.ExpectBegin()
		mock.ExpectExec(`INSERT INTO "DBFLPASS"`).WillReturnResult(sqlmock.NewResult(1, 1))
		// Expect the permission table pre-population checks/inserts (from Laravel logic duplicate menus)
		mock.ExpectQuery(`SELECT count\(\*\) FROM sys\.tables WHERE name = @p1`).WithArgs("dbmenu").WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))
		mock.ExpectExec(`INSERT INTO dbmenu`).WithArgs("SA").WillReturnResult(sqlmock.NewResult(1, 1))

		mock.ExpectQuery(`SELECT count\(\*\) FROM sys\.tables WHERE name = @p1`).WithArgs("dbmenureport").WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))
		mock.ExpectExec(`INSERT INTO dbmenureport`).WithArgs("SA").WillReturnResult(sqlmock.NewResult(1, 1))

		mock.ExpectQuery(`SELECT count\(\*\) FROM sys\.tables WHERE name = @p1`).WithArgs("dbaksesperkiraan").WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))
		mock.ExpectExec(`INSERT INTO dbaksesperkiraan`).WithArgs("SA", "SA").WillReturnResult(sqlmock.NewResult(1, 1))

		mock.ExpectCommit()

		err := repo.CreateDBFLPASS(user)

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
	t.Run("Success Update DBFLPASS", func(t *testing.T) {
		db, mock, err := setupTestDB()
		assert.NoError(t, err)
		repo := NewUserRepository(db)

		user := &models.SDBFLPASS{
			USERID:   "ADMIN",
			FullName: "Administrator",
			TINGKAT:  "2",
		}

		mock.ExpectBegin()
		mock.ExpectExec(`UPDATE "DBFLPASS"`).
			WillReturnResult(sqlmock.NewResult(1, 1))
		mock.ExpectCommit()

		err = repo.UpdateDBFLPASS(user)
		assert.NoError(t, err)
	})
}

func TestUserRepository_GetPaginated(t *testing.T) {
	db, mock, err := setupTestDB()
	assert.NoError(t, err)
	repo := NewUserRepository(db)

	t.Run("Success GetPaginated DBFLPASS", func(t *testing.T) {
		mock.ExpectQuery(`SELECT count\(\*\) FROM "DBFLPASS"`).
			WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))

		mock.ExpectQuery(`SELECT \* FROM "DBFLPASS"`).
			WillReturnRows(sqlmock.NewRows([]string{"USERID", "FullName"}).AddRow("ADMIN", "Administrator"))

		users, total, err := repo.GetPaginatedDBFLPASS(1, 10, "", "")
		assert.NoError(t, err)
		assert.Equal(t, int64(1), total)
		assert.Len(t, users, 1)
	})

	t.Run("Success GetPaginated DBFLPASS with search", func(t *testing.T) {
		mock.ExpectQuery(`SELECT count\(\*\) FROM "DBFLPASS" WHERE USERID LIKE @p1 OR FullName LIKE @p2`).
			WithArgs("%ADM%", "%ADM%").
			WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))

		mock.ExpectQuery(`SELECT \* FROM "DBFLPASS" WHERE USERID LIKE @p1 OR FullName LIKE @p2`).
			WithArgs("%ADM%", "%ADM%").
			WillReturnRows(sqlmock.NewRows([]string{"USERID", "FullName"}).AddRow("ADMIN", "Administrator"))

		users, total, err := repo.GetPaginatedDBFLPASS(1, 10, "adm", "")
		assert.NoError(t, err)
		assert.Equal(t, int64(1), total)
		assert.Len(t, users, 1)
	})
}

func TestUserRepository_Delete(t *testing.T) {
	db, mock, err := setupTestDB()
	assert.NoError(t, err)
	repo := NewUserRepository(db)

	t.Run("Success Delete DBFLPASS", func(t *testing.T) {
		mock.ExpectBegin()
		mock.ExpectExec(`DELETE FROM "DBFLPASS"`).
			WithArgs("MIA").
			WillReturnResult(sqlmock.NewResult(1, 1))

		// Expect permission cleanups
		mock.ExpectExec(`DELETE FROM dbmenu`).WithArgs("MIA").WillReturnResult(sqlmock.NewResult(0, 0))
		mock.ExpectExec(`DELETE FROM dbmenureport`).WithArgs("MIA").WillReturnResult(sqlmock.NewResult(0, 0))
		mock.ExpectExec(`DELETE FROM DBAKSESPERKIRAAN`).WithArgs("MIA").WillReturnResult(sqlmock.NewResult(0, 0))

		mock.ExpectCommit()

		err := repo.DeleteDBFLPASS("MIA")
		assert.NoError(t, err)
	})
}

// TestUserRepository_GetUserMenuPermissions covers the TASK-009 split-getter
// that returns only menu permissions for a user. It asserts the SQL targets
// dbmenu and that the actual permission columns are read.
func TestUserRepository_GetUserMenuPermissions(t *testing.T) {
	db, mock, err := setupTestDB()
	assert.NoError(t, err)
	repo := NewUserRepository(db)

	t.Run("Success", func(t *testing.T) {
		rows := sqlmock.NewRows([]string{
			"KODEMENU", "Keterangan", "L0", "Icon", "Routename",
			"checked", "aktif", "ACCESS",
			"HasAccess", "IsCreate", "IsUpdate", "IsDelete", "IsPrint", "IsExport",
			"IsApprove1", "IsApprove2", "IsApprove3", "IsApprove4", "IsApprove5", "IsCanceled",
		}).AddRow("M01", "Dashboard", 0, "home", "/dashboard",
			0, 0, 0,
			1, 1, 1, 0, 0, 0,
			0, 0, 0, 0, 0, 0,
		)

		mock.ExpectQuery(`SELECT p\.L1 AS KODEMENU, m\.Keterangan, m\.L0,
			m\.Icon, m\.Routename,
			0 AS checked, 0 AS aktif, 0 AS ACCESS,
			CASE WHEN p\.HASACCESS  = 1 THEN 1 ELSE 0 END AS HasAccess,
			CASE WHEN p\.ISTAMBAH   = 1 THEN 1 ELSE 0 END AS IsCreate,
			CASE WHEN p\.ISKOREKSI  = 1 THEN 1 ELSE 0 END AS IsUpdate,
			CASE WHEN p\.ISHAPUS    = 1 THEN 1 ELSE 0 END AS IsDelete,
			CASE WHEN p\.ISCETAK    = 1 THEN 1 ELSE 0 END AS IsPrint,
			CASE WHEN p\.ISEXPORT   = 1 THEN 1 ELSE 0 END AS IsExport,
			0 AS IsApprove1, 0 AS IsApprove2, 0 AS IsApprove3, 0 AS IsApprove4, 0 AS IsApprove5,
			0 AS IsCanceled
		FROM dbflmenu p
		LEFT JOIN DBMENU m ON m\.KODEMENU = p\.L1
		WHERE p\.USERID = @p1
		ORDER BY p\.L1 ASC`).
			WithArgs("ADMIN").
			WillReturnRows(rows)

		perms, err := repo.GetUserMenuPermissions("ADMIN")
		assert.NoError(t, err)
		assert.Len(t, perms, 1)
		assert.Equal(t, "M01", perms[0].KodeMenu)
		assert.Equal(t, 1, perms[0].HasAccess)
		assert.Equal(t, 1, perms[0].IsCreate)
		assert.Equal(t, 0, perms[0].IsApprove1) // hardcoded 0 in production
		assert.NoError(t, mock.ExpectationsWereMet())
	})
}

// TestUserRepository_GetUserReportPermissions covers the TASK-009 split-getter
// for dbmenureport.
func TestUserRepository_GetUserReportPermissions(t *testing.T) {
	db, mock, err := setupTestDB()
	assert.NoError(t, err)
	repo := NewUserRepository(db)

	t.Run("Success", func(t *testing.T) {
		rows := sqlmock.NewRows([]string{
			"KODEMENU", "Keterangan", "L0", "Icon", "Routename",
			"checked", "aktif", "ACCESS",
			"HasAccess", "IsCreate", "IsUpdate", "IsDelete", "IsPrint", "IsExport",
			"IsApprove1", "IsApprove2", "IsApprove3", "IsApprove4", "IsApprove5", "IsCanceled",
		}).AddRow("R01", "Sales Report", 0, nil, nil,
			0, 0, 1, // ACCESS comes from DBMENUREPORT
			1, 0, 0, 0, 0, 1,
			0, 0, 0, 0, 0, 0,
		)

		mock.ExpectQuery(`SELECT p\.L1 AS KODEMENU, m\.Keterangan, m\.L0,
			NULL AS Icon, NULL AS Routename,
			0 AS checked, 0 AS aktif, m\.ACCESS AS ACCESS,
			CASE WHEN p\.Access    = 1 THEN 1 ELSE 0 END AS HasAccess,
			0 AS IsCreate, 0 AS IsUpdate, 0 AS IsDelete, 0 AS IsPrint,
			CASE WHEN p\.Isexport  = 1 THEN 1 ELSE 0 END AS IsExport,
			0 AS IsApprove1, 0 AS IsApprove2, 0 AS IsApprove3, 0 AS IsApprove4, 0 AS IsApprove5,
			0 AS IsCanceled
		FROM DBFLMENUREPORT p
		LEFT JOIN DBMENUREPORT m ON m\.KODEMENU = p\.L1
		WHERE p\.UserID = @p1
		ORDER BY p\.L1 ASC`).
			WithArgs("ADMIN").
			WillReturnRows(rows)

		perms, err := repo.GetUserReportPermissions("ADMIN")
		assert.NoError(t, err)
		assert.Len(t, perms, 1)
		assert.Equal(t, "R01", perms[0].KodeMenu)
		assert.Equal(t, 0, perms[0].IsPrint)  // hardcoded 0 (DBFLMENUREPORT has no ISCETAK)
		assert.Equal(t, 1, perms[0].IsExport) // maps from p.Isexport
		assert.NoError(t, mock.ExpectationsWereMet())
	})
}

// TestUserRepository_GetUserCoaAccess covers the TASK-009 COA access split-getter.
func TestUserRepository_GetUserCoaAccess(t *testing.T) {
	db, mock, err := setupTestDB()
	assert.NoError(t, err)
	repo := NewUserRepository(db)

	t.Run("Success", func(t *testing.T) {
		rows := sqlmock.NewRows([]string{"Perkiraan", "Keterangan", "checked"}).
			AddRow("1101", "Kas", 1).
			AddRow("1102", "Bank", 0)

		mock.ExpectQuery(`SELECT p\.Perkiraan, p\.Keterangan, CASE WHEN a\.UserID IS NOT NULL THEN 1 ELSE 0 END AS checked
		FROM DBPERKIRAAN p
		LEFT JOIN DBAKSESPERKIRAAN a ON a\.Perkiraan = p\.Perkiraan AND a\.UserID = @p1
		ORDER BY p\.Perkiraan ASC`).
			WithArgs("ADMIN").
			WillReturnRows(rows)

		coa, err := repo.GetUserCoaAccess("ADMIN")
		assert.NoError(t, err)
		assert.Len(t, coa, 2)
		assert.Equal(t, "1101", coa[0].Perkiraan)
		assert.Equal(t, 1, coa[0].Checked)
		assert.Equal(t, 0, coa[1].Checked)
		assert.NoError(t, mock.ExpectationsWereMet())
	})
}

// TestUserRepository_GetPermissionReportMatrix exercises the count + page query
// for the standalone Permission Report page.
func TestUserRepository_GetPermissionReportMatrix(t *testing.T) {
	db, mock, err := setupTestDB()
	assert.NoError(t, err)
	repo := NewUserRepository(db)

	t.Run("Filtered by user", func(t *testing.T) {
		// Count
		mock.ExpectQuery(`SELECT COUNT\(\*\) FROM dbflmenu p WHERE p\.USERID IS NOT NULL AND p\.USERID <> '' AND p\.USERID = @p1`).
			WithArgs("ADMIN").
			WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(2))

		// Page
		rows := sqlmock.NewRows([]string{
			"USERID", "FullName", "TINGKAT", "KODEMENU", "Keterangan",
			"HasAccess", "IsCreate", "IsUpdate", "IsDelete", "IsPrint", "IsExport",
			"IsApprove1", "IsApprove2", "IsApprove3", "IsApprove4", "IsApprove5", "IsCanceled",
		}).
			AddRow("ADMIN", "Administrator", "2", "M01", "Dashboard", 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0).
			AddRow("ADMIN", "Administrator", "2", "M02", "Users", 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0)

		mock.ExpectQuery(`SELECT p\.USERID AS USERID, u\.FullName, u\.TINGKAT, p\.L1 AS KODEMENU, m\.Keterangan,
			CASE WHEN p\.HASACCESS  = 1 THEN 1 ELSE 0 END AS HasAccess,
			CASE WHEN p\.ISTAMBAH   = 1 THEN 1 ELSE 0 END AS IsCreate,
			CASE WHEN p\.ISKOREKSI  = 1 THEN 1 ELSE 0 END AS IsUpdate,
			CASE WHEN p\.ISHAPUS    = 1 THEN 1 ELSE 0 END AS IsDelete,
			CASE WHEN p\.ISCETAK    = 1 THEN 1 ELSE 0 END AS IsPrint,
			CASE WHEN p\.ISEXPORT   = 1 THEN 1 ELSE 0 END AS IsExport,
			0 AS IsApprove1, 0 AS IsApprove2, 0 AS IsApprove3, 0 AS IsApprove4, 0 AS IsApprove5,
			0 AS IsCanceled
		FROM dbflmenu p
		LEFT JOIN DBMENU m ON m\.KODEMENU = p\.L1
		LEFT JOIN DBFLPASS u ON u\.USERID = p\.USERID
		WHERE p\.USERID IS NOT NULL AND p\.USERID <> '' AND p\.USERID = @p1 ORDER BY p\.USERID ASC, p\.L1 ASC OFFSET @p2 ROWS FETCH NEXT @p3 ROWS ONLY`).
			WithArgs("ADMIN", 0, 10).
			WillReturnRows(rows)

		matrix, total, err := repo.GetPermissionReportMatrix("ADMIN", "", "menu", 1, 10)
		assert.NoError(t, err)
		assert.Equal(t, int64(2), total)
		assert.Len(t, matrix, 2)
		assert.Equal(t, "ADMIN", matrix[0].UserID)
		assert.Equal(t, "admin", matrix[0].Role)
		assert.Equal(t, "menu", matrix[0].MenuType)
		assert.Equal(t, 0, matrix[0].IsApprove1) // hardcoded 0 (no IsOtorisasi in production)
		assert.Equal(t, 0, matrix[1].IsApprove2)
		assert.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("menuType=report switches to DBFLMENUREPORT", func(t *testing.T) {
		mock.ExpectQuery(`SELECT COUNT\(\*\) FROM DBFLMENUREPORT p WHERE p\.UserID IS NOT NULL AND p\.UserID <> ''`).
			WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))
		mock.ExpectQuery(`SELECT p\.UserID AS USERID, u\.FullName, u\.TINGKAT, p\.L1 AS KODEMENU, m\.Keterangan,
			CASE WHEN p\.Access    = 1 THEN 1 ELSE 0 END AS HasAccess,
			0 AS IsCreate, 0 AS IsUpdate, 0 AS IsDelete, 0 AS IsPrint,
			CASE WHEN p\.Isexport  = 1 THEN 1 ELSE 0 END AS IsExport,
			0 AS IsApprove1, 0 AS IsApprove2, 0 AS IsApprove3, 0 AS IsApprove4, 0 AS IsApprove5,
			0 AS IsCanceled
		FROM DBFLMENUREPORT p
		LEFT JOIN DBMENUREPORT m ON m\.KODEMENU = p\.L1
		LEFT JOIN DBFLPASS u ON u\.USERID = p\.UserID
		WHERE p\.UserID IS NOT NULL AND p\.UserID <> '' ORDER BY p\.UserID ASC, p\.L1 ASC`).
			WillReturnRows(sqlmock.NewRows([]string{
				"USERID", "FullName", "TINGKAT", "KODEMENU", "Keterangan",
				"HasAccess", "IsCreate", "IsUpdate", "IsDelete", "IsPrint", "IsExport",
				"IsApprove1", "IsApprove2", "IsApprove3", "IsApprove4", "IsApprove5", "IsCanceled",
			}))

		_, total, err := repo.GetPermissionReportMatrix("", "", "report", 0, 0)
		assert.NoError(t, err)
		assert.Equal(t, int64(0), total)
		assert.NoError(t, mock.ExpectationsWereMet())
	})
}
