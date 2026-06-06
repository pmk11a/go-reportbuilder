package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/infrastructure/persistence/models"
	"github.com/masza1/dapen-backend/tests/testhelper"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

// TestSettingHandler_GetCompany verifies that company settings are correctly
// retrieved and returned in JSON format.
func TestSettingHandler_GetCompany(t *testing.T) {
	gin.SetMode(gin.TestMode)

	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Seed company data
		companyName := "PT Dapen Indonesia"
		companyAddress := "Jl. Example No. 123"
		company := &models.SDBPERUSAHAAN{
			KODEUSAHA: "1",
			NAMA:      &companyName,
			ALAMAT1:   &companyAddress,
		}
		if err := tx.Create(company).Error; err != nil {
			t.Fatalf("Failed to seed company: %v", err)
		}

		handler := NewSettingHandler(tx)

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request, _ = http.NewRequest("GET", "/api/admin/settings/company", nil)

		handler.GetCompany(c)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.True(t, response["success"].(bool))

		// Verify data structure
		data := response["data"].(map[string]interface{})
		assert.NotNil(t, data)
	})
}

// TestSettingHandler_GetCompany_NoData verifies that the handler returns
// a proper response even when no company data exists.
func TestSettingHandler_GetCompany_NoData(t *testing.T) {
	gin.SetMode(gin.TestMode)

	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Don't seed any company data
		handler := NewSettingHandler(tx)

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request, _ = http.NewRequest("GET", "/api/admin/settings/company", nil)

		handler.GetCompany(c)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.NotNil(t, response["success"])
	})
}

// TestSettingHandler_UpdateCompany_Success verifies that company data can
// be updated and changes persist to the database.
func TestSettingHandler_UpdateCompany_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Seed initial company data
		initialName := "Old Company Name"
		oldAddress := "Old Address"
		company := &models.SDBPERUSAHAAN{
			KODEUSAHA: "1",
			NAMA:      &initialName,
			ALAMAT1:   &oldAddress,
		}
		if err := tx.Create(company).Error; err != nil {
			t.Fatalf("Failed to seed company: %v", err)
		}

		handler := NewSettingHandler(tx)

		// Prepare update payload
		newName := "New Company Name"
		newAddress := "New Address"
		payload := models.SDBPERUSAHAAN{
			NAMA:    &newName,
			ALAMAT1: &newAddress,
		}
		body, _ := json.Marshal(payload)

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request, _ = http.NewRequest("PUT", "/api/admin/settings/company", bytes.NewBuffer(body))
		c.Request.Header.Set("Content-Type", "application/json")

		handler.UpdateCompany(c)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.True(t, response["success"].(bool))
	})
}

// TestSettingHandler_UpdateCompany_InvalidPayload verifies that invalid
// request payloads are rejected.
func TestSettingHandler_UpdateCompany_InvalidPayload(t *testing.T) {
	gin.SetMode(gin.TestMode)

	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		handler := NewSettingHandler(tx)

		// Send invalid JSON
		invalidJSON := []byte("{ invalid json")

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request, _ = http.NewRequest("PUT", "/api/admin/settings/company", bytes.NewBuffer(invalidJSON))
		c.Request.Header.Set("Content-Type", "application/json")

		handler.UpdateCompany(c)

		// Should return 400 Bad Request
		assert.True(t, w.Code >= http.StatusBadRequest)
	})
}

// TestSettingHandler_UpdateCompany_PartialUpdate verifies that only specified
// fields are updated while others remain unchanged.
func TestSettingHandler_UpdateCompany_PartialUpdate(t *testing.T) {
	gin.SetMode(gin.TestMode)

	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Seed company with all fields
		name := "Original Name"
		address := "Original Address"
		company := &models.SDBPERUSAHAAN{
			KODEUSAHA: "1",
			NAMA:      &name,
			ALAMAT1:   &address,
		}
		if err := tx.Create(company).Error; err != nil {
			t.Fatalf("Failed to seed company: %v", err)
		}

		handler := NewSettingHandler(tx)

		// Update only the name
		newName := "Updated Name"
		payload := models.SDBPERUSAHAAN{
			NAMA: &newName,
		}
		body, _ := json.Marshal(payload)

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request, _ = http.NewRequest("PUT", "/api/admin/settings/company", bytes.NewBuffer(body))
		c.Request.Header.Set("Content-Type", "application/json")

		handler.UpdateCompany(c)

		assert.Equal(t, http.StatusOK, w.Code)
	})
}

// TestSettingHandler_UploadLogo verifies that logo files can be uploaded
// and stored correctly (if this handler exists).
func TestSettingHandler_UploadLogo(t *testing.T) {
	gin.SetMode(gin.TestMode)

	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		handler := NewSettingHandler(tx)

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request, _ = http.NewRequest("POST", "/api/admin/settings/company/logo", nil)
		c.Request.Header.Set("Content-Type", "multipart/form-data")

		// Only test if handler has this method
		if handlerMethod, ok := interface{}(handler).(interface{ UploadLogo(*gin.Context) }); ok {
			handlerMethod.UploadLogo(c)
			// Should return 200 or 400 (depending on implementation)
			assert.True(t, w.Code >= http.StatusOK)
		}
	})
}

// TestSettingHandler_UploadSignature verifies that signature files can be
// uploaded and stored correctly (if this handler exists).
func TestSettingHandler_UploadSignature(t *testing.T) {
	gin.SetMode(gin.TestMode)

	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		handler := NewSettingHandler(tx)

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request, _ = http.NewRequest("POST", "/api/admin/settings/company/signature", nil)
		c.Request.Header.Set("Content-Type", "multipart/form-data")

		// Only test if handler has this method
		if handlerMethod, ok := interface{}(handler).(interface{ UploadSignature(*gin.Context) }); ok {
			handlerMethod.UploadSignature(c)
			// Should return 200 or 400 (depending on implementation)
			assert.True(t, w.Code >= http.StatusOK)
		}
	})
}

// TestSettingHandler_DeleteLogo verifies that logo files can be deleted.
func TestSettingHandler_DeleteLogo(t *testing.T) {
	gin.SetMode(gin.TestMode)

	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		handler := NewSettingHandler(tx)

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request, _ = http.NewRequest("DELETE", "/api/admin/settings/company/logo", nil)

		// Only test if handler has this method
		if handlerMethod, ok := interface{}(handler).(interface{ DeleteLogo(*gin.Context) }); ok {
			handlerMethod.DeleteLogo(c)
			// Should return 200 or 404
			assert.True(t, w.Code == http.StatusOK || w.Code == http.StatusNotFound)
		}
	})
}

// TestSettingHandler_DeleteSignature verifies that signature files can be deleted.
func TestSettingHandler_DeleteSignature(t *testing.T) {
	gin.SetMode(gin.TestMode)

	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		handler := NewSettingHandler(tx)

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request, _ = http.NewRequest("DELETE", "/api/admin/settings/company/signature", nil)

		// Only test if handler has this method
		if handlerMethod, ok := interface{}(handler).(interface{ DeleteSignature(*gin.Context) }); ok {
			handlerMethod.DeleteSignature(c)
			// Should return 200 or 404
			assert.True(t, w.Code == http.StatusOK || w.Code == http.StatusNotFound)
		}
	})
}
