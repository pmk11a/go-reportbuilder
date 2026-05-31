package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/models"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlserver"
	"gorm.io/gorm"
)

func setupSettingTestDB() (*gorm.DB, sqlmock.Sqlmock, error) {
	sqlDB, mock, err := sqlmock.New()
	if err != nil {
		return nil, nil, err
	}
	db, err := gorm.Open(sqlserver.New(sqlserver.Config{
		Conn: sqlDB,
	}), &gorm.Config{})
	return db, mock, err
}

func TestSettingHandler_GetCompany(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := setupSettingTestDB()
	assert.NoError(t, err)

	handler := NewSettingHandler(db)

	t.Run("Success GetCompany", func(t *testing.T) {
		rows := sqlmock.NewRows([]string{"KODEUSAHA", "NAMA", "ALAMAT1"}).
			AddRow("1", "Dapen", "Jl. Test")

		mock.ExpectQuery(`SELECT \* FROM "DBPERUSAHAAN" ORDER BY "DBPERUSAHAAN"\."KODEUSAHA" OFFSET 0 ROW FETCH NEXT 1 ROWS ONLY`).
			WillReturnRows(rows)

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request, _ = http.NewRequest("GET", "/api/admin/settings/company", nil)

		handler.GetCompany(c)

		assert.Equal(t, http.StatusOK, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		if data, ok := response["data"].(map[string]interface{}); ok {
			assert.Equal(t, "1", data["kodeusaha"])
			assert.Equal(t, "Dapen", data["nama"])
		} else {
			t.Fatalf("data is not a map")
		}
	})

	t.Run("Not Found", func(t *testing.T) {
		mock.ExpectQuery(`SELECT \* FROM "DBPERUSAHAAN"`).
			WillReturnError(gorm.ErrRecordNotFound)

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request, _ = http.NewRequest("GET", "/api/admin/settings/company", nil)

		handler.GetCompany(c)

		assert.Equal(t, http.StatusOK, w.Code)
	})
}

func TestSettingHandler_UpdateCompany(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := setupSettingTestDB()
	assert.NoError(t, err)

	handler := NewSettingHandler(db)

	t.Run("Success Update Existing", func(t *testing.T) {
		nama := "New Dapen"
		payload := models.SDBPERUSAHAAN{KODEUSAHA: "1", NAMA: &nama}
		body, _ := json.Marshal(payload)

		rows := sqlmock.NewRows([]string{"KODEUSAHA", "NAMA"}).AddRow("1", "Old Dapen")
		mock.ExpectQuery(`SELECT \* FROM "DBPERUSAHAAN"`).WillReturnRows(rows)

		mock.ExpectBegin()
		mock.ExpectExec(`UPDATE "DBPERUSAHAAN" SET`).WillReturnResult(sqlmock.NewResult(1, 1))
		mock.ExpectCommit()

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request, _ = http.NewRequest("PUT", "/api/admin/settings/company", bytes.NewBuffer(body))
		c.Request.Header.Set("Content-Type", "application/json")

		handler.UpdateCompany(c)

		assert.Equal(t, http.StatusOK, w.Code)
	})
}
