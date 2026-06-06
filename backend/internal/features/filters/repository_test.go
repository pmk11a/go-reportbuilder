package filters

import (
	"testing"

	"github.com/masza1/dapen-backend/internal/infrastructure/persistence/models"
	"github.com/masza1/dapen-backend/tests/testhelper"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

var testDB *gorm.DB

func init() {
	testDB = testhelper.InitTestDB(&testing.T{})
	testhelper.SetTestDB(testDB)
}

// TestFilterRepository_GetCustomers tests retrieving customers with pagination and search.
func TestFilterRepository_GetCustomers(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create test customers
		customers := []models.SDbCustSupp{
			{
				KodeCustSupp: "CUST001",
				NamaCustSupp: "Customer One",
				Jenis:        1, // Supplier type
			},
			{
				KodeCustSupp: "CUST002",
				NamaCustSupp: "Customer Two",
				Jenis:        1,
			},
			{
				KodeCustSupp: "CUST003",
				NamaCustSupp: "Other Type Customer",
				Jenis:        2, // Different type
			},
		}
		for _, c := range customers {
			assert.NoError(t, tx.Create(&c).Error)
		}

		repo := NewFilterRepository(tx)

		// Act: Get customers of type 1 with no search
		results, total, err := repo.GetCustomers(1, "", 0, 10)

		// Assert
		assert.NoError(t, err)
		assert.Equal(t, int64(2), total)
		assert.Equal(t, 2, len(results))
		assert.Equal(t, "CUST001", results[0].KodeCustSupp)
		assert.Equal(t, "Customer One", results[0].NamaCustSupp)
	})
}

// TestFilterRepository_GetCustomersWithSearch tests customer search functionality.
func TestFilterRepository_GetCustomersWithSearch(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create test customers
		customers := []models.SDbCustSupp{
			{
				KodeCustSupp: "CUST001",
				NamaCustSupp: "John Supplier",
				Jenis:        1,
			},
			{
				KodeCustSupp: "CUST002",
				NamaCustSupp: "Jane Supplier",
				Jenis:        1,
			},
			{
				KodeCustSupp: "XYZ001",
				NamaCustSupp: "Other Customer",
				Jenis:        1,
			},
		}
		for _, c := range customers {
			assert.NoError(t, tx.Create(&c).Error)
		}

		repo := NewFilterRepository(tx)

		// Act: Search for "Supplier"
		results, total, err := repo.GetCustomers(1, "Supplier", 0, 10)

		// Assert
		assert.NoError(t, err)
		assert.Equal(t, int64(2), total)
		assert.Equal(t, 2, len(results))
		// Both results should contain "Supplier" in name or code
		for _, c := range results {
			assert.True(t,
				c.KodeCustSupp == "CUST001" || c.KodeCustSupp == "CUST002",
				"Expected search to return CUST001 or CUST002",
			)
		}
	})
}

// TestFilterRepository_GetCustomersWithPagination tests pagination.
func TestFilterRepository_GetCustomersWithPagination(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create multiple customers
		for i := 1; i <= 5; i++ {
			c := models.SDbCustSupp{
				KodeCustSupp: "",
				NamaCustSupp: "Customer" + string(rune(48+i)),
				Jenis:        1,
			}
			c.KodeCustSupp = "CUST00" + string(rune(48+i))
			assert.NoError(t, tx.Create(&c).Error)
		}

		repo := NewFilterRepository(tx)

		// Act: Get first page (offset 0, limit 2)
		page1, total, err := repo.GetCustomers(1, "", 0, 2)

		// Assert first page
		assert.NoError(t, err)
		assert.Equal(t, int64(5), total)
		assert.Equal(t, 2, len(page1))

		// Act: Get second page (offset 2, limit 2)
		page2, total, err := repo.GetCustomers(1, "", 2, 2)

		// Assert second page
		assert.NoError(t, err)
		assert.Equal(t, int64(5), total)
		assert.Equal(t, 2, len(page2))

		// Ensure pages have different customers
		assert.NotEqual(t, page1[0].KodeCustSupp, page2[0].KodeCustSupp)
	})
}

// TestFilterRepository_GetPerkiraan tests retrieving account/perkiraan records.
func TestFilterRepository_GetPerkiraan(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create test perkiraan records
		perkiraans := []models.SDbPerkiraan{
			{
				Perkiraan:   "1001",
				Keterangan:  "Asset Account",
				Tipe:        1,
			},
			{
				Perkiraan:   "2001",
				Keterangan:  "Liability Account",
				Tipe:        1,
			},
			{
				Perkiraan:   "5001",
				Keterangan:  "Revenue Account",
				Tipe:        2, // Different type
			},
		}
		for _, p := range perkiraans {
			assert.NoError(t, tx.Create(&p).Error)
		}

		repo := NewFilterRepository(tx)

		// Act: Get perkiraan with Tipe = 1
		results, err := repo.GetPerkiraan("", "", "")

		// Assert
		assert.NoError(t, err)
		assert.GreaterOrEqual(t, len(results), 2)
		// Check that at least the created records of type 1 are present
		found := false
		for _, p := range results {
			if p.Perkiraan == "1001" {
				found = true
				assert.Equal(t, "Asset Account", p.Keterangan)
				break
			}
		}
		assert.True(t, found, "Expected to find perkiraan 1001")
	})
}

// TestFilterRepository_GetPerkiraanWithSearch tests account search functionality.
func TestFilterRepository_GetPerkiraanWithSearch(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create test perkiraan records
		perkiraans := []models.SDbPerkiraan{
			{
				Perkiraan:   "1001",
				Keterangan:  "Bank Account",
				Tipe:        1,
			},
			{
				Perkiraan:   "1002",
				Keterangan:  "Cash Account",
				Tipe:        1,
			},
			{
				Perkiraan:   "2001",
				Keterangan:  "Debt Account",
				Tipe:        1,
			},
		}
		for _, p := range perkiraans {
			assert.NoError(t, tx.Create(&p).Error)
		}

		repo := NewFilterRepository(tx)

		// Act: Search for "Account" in Tipe 1
		results, err := repo.GetPerkiraan("Account", "", "")

		// Assert: Should find multiple accounts
		assert.NoError(t, err)
		assert.GreaterOrEqual(t, len(results), 3)
	})
}

// TestFilterRepository_GetKelompokKas tests retrieving accounts by post type (KelompokKas).
func TestFilterRepository_GetKelompokKas(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create test perkiraan and post hutpiut records
		perkiraan := models.SDbPerkiraan{
			Perkiraan:   "1100",
			Keterangan:  "Test Account",
			Tipe:        1,
		}
		assert.NoError(t, tx.Create(&perkiraan).Error)

		postHutPiut := models.SDbPostHutPiut{
			NoFaktur:  "FK001",
			Perkiraan: "1100",
			Kode:      "BANK",
		}
		assert.NoError(t, tx.Create(&postHutPiut).Error)

		repo := NewFilterRepository(tx)

		// Act: Get accounts by KelompokKas "BANK"
		results, err := repo.GetKelompokKas("BANK", "")

		// Assert
		assert.NoError(t, err)
		assert.GreaterOrEqual(t, len(results), 1)
		// Check if we found the created account
		found := false
		for _, p := range results {
			if p.Perkiraan == "1100" {
				found = true
				assert.Equal(t, "Test Account", p.Keterangan)
				break
			}
		}
		assert.True(t, found, "Expected to find perkiraan 1100 in KelompokKas BANK")
	})
}

// TestFilterRepository_GetKelompokKasWithSearch tests KelompokKas search functionality.
func TestFilterRepository_GetKelompokKasWithSearch(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create test records
		perkiraans := []models.SDbPerkiraan{
			{
				Perkiraan:   "1100",
				Keterangan:  "Primary Bank Account",
				Tipe:        1,
			},
			{
				Perkiraan:   "1101",
				Keterangan:  "Secondary Bank Account",
				Tipe:        1,
			},
		}
		for _, p := range perkiraans {
			assert.NoError(t, tx.Create(&p).Error)
		}

		// Create post hutpiut records linking to the accounts
		posts := []models.SDbPostHutPiut{
			{
				NoFaktur:  "FK001",
				Perkiraan: "1100",
				Kode:      "BANK",
			},
			{
				NoFaktur:  "FK002",
				Perkiraan: "1101",
				Kode:      "BANK",
			},
		}
		for _, p := range posts {
			assert.NoError(t, tx.Create(&p).Error)
		}

		repo := NewFilterRepository(tx)

		// Act: Search for "Primary" in BANK accounts
		results, err := repo.GetKelompokKas("BANK", "Primary")

		// Assert
		assert.NoError(t, err)
		// Should find at least the Primary account
		assert.Greater(t, len(results), 0)
	})
}
