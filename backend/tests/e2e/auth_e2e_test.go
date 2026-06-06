package e2e

import (
	"bytes"
	"encoding/json"
	"net/http"
	"testing"

	"github.com/masza1/dapen-backend/internal/infrastructure/persistence/models"
	"github.com/stretchr/testify/assert"
)

func TestAuth_Login_E2E(t *testing.T) {
	// Setup the test server and database
	engine, _, _ := SetupTestServer()

	t.Run("Invalid Credentials", func(t *testing.T) {
		reqBody := models.SLoginRequest{
			Username: "nonexistent_user",
			Password: "wrong_password123",
		}

		jsonValue, _ := json.Marshal(reqBody)
		req, _ := http.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(jsonValue))
		req.Header.Set("Content-Type", "application/json")

		rr := ExecuteRequest(req, engine)

		// We expect 401 Unauthorized for bad credentials
		assert.Equal(t, http.StatusUnauthorized, rr.Code)

		var response map[string]interface{}
		err := json.Unmarshal(rr.Body.Bytes(), &response)
		assert.NoError(t, err)

		assert.False(t, response["success"].(bool))
	})

	t.Run("Empty Payload", func(t *testing.T) {
		req, _ := http.NewRequest("POST", "/api/auth/login", bytes.NewBuffer([]byte("{}")))
		req.Header.Set("Content-Type", "application/json")

		rr := ExecuteRequest(req, engine)

		// We expect 400 Bad Request because fields are required
		assert.Equal(t, http.StatusBadRequest, rr.Code)
	})
}
