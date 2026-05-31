package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
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

func TestDashboardHandler_GetStats(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := setupTestDB()
	assert.NoError(t, err)

	handler := NewDashboardHandler(db)

	t.Run("Success GetStats", func(t *testing.T) {
		// Mock the queries for active and retired
		mock.ExpectQuery(`SELECT COUNT\(\*\) FROM DBCUSTSUPP WHERE JENIS = 3`).
			WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(150))
		mock.ExpectQuery(`SELECT COUNT\(\*\) FROM DBCUSTSUPP WHERE JENIS = 2`).
			WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(50))

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		handler.GetStats(c)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)

		data := response["data"].(map[string]interface{})
		assert.Equal(t, float64(150), data["total_active"])
		assert.Equal(t, float64(50), data["total_retired"])
	})

	t.Run("Error Query Active", func(t *testing.T) {
		mock.ExpectQuery(`SELECT COUNT\(\*\) FROM DBCUSTSUPP WHERE JENIS = 3`).
			WillReturnError(gorm.ErrInvalidDB)

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		handler.GetStats(c)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

func TestDashboardHandler_GetPensiunanWithoutFiles(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := setupTestDB()
	assert.NoError(t, err)

	handler := NewDashboardHandler(db)

	t.Run("Success GetPensiunanWithoutFiles", func(t *testing.T) {
		// Expected COUNT(*)
		mock.ExpectQuery(`SELECT COUNT\(\*\) FROM DBCUSTSUPP`).
			WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))

		// Expected SELECT data
		rows := sqlmock.NewRows([]string{"KODECUSTSUPP", "NAMACUSTSUPP", "NoPegawai", "TglLahir", "TglPensiun", "TglKepersertaan"}).
			AddRow("P001", "John Doe", "EMP01", time.Now(), time.Now(), time.Now())
		
		mock.ExpectQuery(`SELECT c.KODECUSTSUPP, c.NAMACUSTSUPP, NULL AS NoPegawai, NULL AS TglLahir, NULL AS TglPensiun, NULL AS TglKepersertaan FROM DBCUSTSUPP c WHERE c.JENIS = 2 ORDER BY c.NAMACUSTSUPP ASC OFFSET @p1 ROWS FETCH NEXT @p2 ROWS ONLY`).
			WithArgs(0, 10).
			WillReturnRows(rows)

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		// Set query parameters
		c.Request, _ = http.NewRequest("GET", "/?page=1&limit=10", nil)

		handler.GetPensiunanWithoutFiles(c)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)

		if data, ok := response["data"].(map[string]interface{}); ok {
			assert.Equal(t, float64(1), data["total"])
		} else {
			t.Fatalf("data is not a map")
		}
	})
}
