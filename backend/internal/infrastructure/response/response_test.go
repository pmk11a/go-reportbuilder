package response

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestResponseHelpers(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name       string
		method     func(c *gin.Context, msg string, data interface{})
		msg        string
		data       interface{}
		wantStatus int
		wantSuccess bool
	}{
		{"Success", Success, "OK", "data", http.StatusOK, true},
		{"Created", Created, "Created", "data", http.StatusCreated, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			tt.method(c, tt.msg, tt.data)

			assert.Equal(t, tt.wantStatus, w.Code)

			var res SResponse
			err := json.Unmarshal(w.Body.Bytes(), &res)
			assert.NoError(t, err)
			assert.Equal(t, tt.wantSuccess, res.Success)
			assert.Equal(t, tt.msg, res.Message)
			assert.Equal(t, tt.data, res.Data)
		})
	}
}

func TestErrorHelpers(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name       string
		method     func(c *gin.Context, msg string)
		msg        string
		wantStatus int
	}{
		{"BadRequest", BadRequest, "Bad Request", http.StatusBadRequest},
		{"Unauthorized", Unauthorized, "Unauthorized", http.StatusUnauthorized},
		{"Forbidden", Forbidden, "Forbidden", http.StatusForbidden},
		{"NotFound", NotFound, "Not Found", http.StatusNotFound},
		{"InternalError", InternalError, "Internal Error", http.StatusInternalServerError},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			tt.method(c, tt.msg)

			assert.Equal(t, tt.wantStatus, w.Code)

			var res SResponse
			err := json.Unmarshal(w.Body.Bytes(), &res)
			assert.NoError(t, err)
			assert.False(t, res.Success)
			assert.Equal(t, tt.msg, res.Message)
			assert.Nil(t, res.Data)
		})
	}
}

func TestErrorWithMapHelpers(t *testing.T) {
	gin.SetMode(gin.TestMode)

	sampleMap := SErrorMap{
		Code:      "EID_NOT_FOUND",
		ErrorName: "User Tidak Ditemukan",
		Reason:    "User dengan ID tersebut tidak ada dalam sistem.",
		Action:    "Periksa kembali ID user atau muat ulang daftar user.",
	}

	tests := []struct {
		name       string
		method     func(c *gin.Context, msg string, em SErrorMap)
		wantStatus int
	}{
		{"BadRequest", BadRequestWithMap, http.StatusBadRequest},
		{"Unauthorized", UnauthorizedWithMap, http.StatusUnauthorized},
		{"Forbidden", ForbiddenWithMap, http.StatusForbidden},
		{"NotFound", NotFoundWithMap, http.StatusNotFound},
		{"Conflict", ConflictWithMap, http.StatusConflict},
		{"InternalError", InternalErrorWithMap, http.StatusInternalServerError},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			tt.method(c, "User not found", sampleMap)

			assert.Equal(t, tt.wantStatus, w.Code)

			var res SErrorResponse
			err := json.Unmarshal(w.Body.Bytes(), &res)
			assert.NoError(t, err)
			assert.False(t, res.Success)
			assert.Equal(t, "User not found", res.Message)
			assert.NotNil(t, res.ErrorMap)
			assert.Equal(t, "EID_NOT_FOUND", res.ErrorMap.Code)
			assert.Equal(t, "User Tidak Ditemukan", res.ErrorMap.ErrorName)
			assert.Equal(t, "User dengan ID tersebut tidak ada dalam sistem.", res.ErrorMap.Reason)
			assert.Equal(t, "Periksa kembali ID user atau muat ulang daftar user.", res.ErrorMap.Action)
		})
	}
}

func TestNewPaginatedResponse(t *testing.T) {
	t.Run("Normal calculation", func(t *testing.T) {
		data := []string{"a", "b"}
		total := int64(25)
		page := 2
		limit := 10

		res := NewPaginatedResponse(data, total, page, limit)

		assert.Equal(t, data, res.Data)
		assert.Equal(t, page, res.Pagination.CurrentPage)
		assert.Equal(t, limit, res.Pagination.PerPage)
		assert.Equal(t, total, res.Pagination.Total)
		assert.Equal(t, 3, res.Pagination.LastPage)
	})

	t.Run("Zero total", func(t *testing.T) {
		data := []string{}
		total := int64(0)
		page := 1
		limit := 10

		res := NewPaginatedResponse(data, total, page, limit)

		assert.Equal(t, 1, res.Pagination.LastPage)
	})
}
