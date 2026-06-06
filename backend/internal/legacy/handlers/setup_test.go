package handlers

import (
	"os"
	"testing"

	"github.com/masza1/dapen-backend/tests/testhelper"
	"gorm.io/gorm"
)

var testDB *gorm.DB

// TestMain initializes the test database once for all handler tests in this package.
func TestMain(m *testing.M) {
	db := testhelper.InitTestDB(&testing.T{})
	testDB = db
	testhelper.SetTestDB(testDB)
	code := m.Run()
	os.Exit(code)
}
