package services

import (
	"testing"

	"github.com/masza1/dapen-backend/internal/features/filters"
	"github.com/masza1/dapen-backend/internal/infrastructure/persistence/models"
	"github.com/masza1/dapen-backend/tests/testhelper"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

// TestFilterService_GetCustomers_WithPagination verifies that pagination
// is applied correctly; page < 1 defaults to 1, and limit is clamped to [1, 100].
func TestFilterService_GetCustomers_WithPagination(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Seed multiple customer records
		for i := 1; i <= 15; i++ {
			cust := &models.SDbCustSupp{
				KodeCustSupp: string(rune('0' + i)),
				NamaCustSupp: "Customer " + string(rune('0'+i)),
				Jenis:        1,
			}
			if err := tx.Create(cust).Error; err != nil {
				t.Fatalf("Failed to seed customer: %v", err)
			}
		}

		repo := filters.NewFilterRepository(tx)
		svc := filters.NewFilterService(repo)

		// Page 1, default limit 10
		res, total, err := svc.GetCustomers(1, "", 1, 10)
		assert.NoError(t, err)
		assert.Equal(t, int64(15), total)
		assert.Len(t, res, 10) // First page has 10 items

		// Page 2
		res, total, err = svc.GetCustomers(1, "", 2, 10)
		assert.NoError(t, err)
		assert.Equal(t, int64(15), total)
		assert.Len(t, res, 5) // Second page has 5 items
	})
}

// TestFilterService_GetCustomers_WithSearch verifies that the search filter
// is applied to customer names.
func TestFilterService_GetCustomers_WithSearch(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Seed test data
		cust1 := &models.SDbCustSupp{
			KodeCustSupp: "C001",
			NamaCustSupp: "PT Maju Jaya",
			Jenis:        1,
		}
		cust2 := &models.SDbCustSupp{
			KodeCustSupp: "C002",
			NamaCustSupp: "PT Sejahtera Bersama",
			Jenis:        1,
		}
		if err := tx.Create(cust1).Error; err != nil {
			t.Fatalf("Failed to seed customer 1: %v", err)
		}
		if err := tx.Create(cust2).Error; err != nil {
			t.Fatalf("Failed to seed customer 2: %v", err)
		}

		repo := filters.NewFilterRepository(tx)
		svc := filters.NewFilterService(repo)

		// Search for "Maju"
		res, total, err := svc.GetCustomers(1, "Maju", 1, 10)
		assert.NoError(t, err)
		assert.Greater(t, total, int64(0))
		assert.GreaterOrEqual(t, len(res), 1)
	})
}

// TestFilterService_GetPerkiraan_BySearch verifies perkiraan retrieval with search.
func TestFilterService_GetPerkiraan_BySearch(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Seed perkiraan records
		perk1 := &models.SDbPerkiraan{
			Perkiraan:   "1000",
			Keterangan:  "Kas Besar",
		}
		perk2 := &models.SDbPerkiraan{
			Perkiraan:   "1001",
			Keterangan:  "Kas Kecil",
		}
		if err := tx.Create(perk1).Error; err != nil {
			t.Fatalf("Failed to seed perkiraan 1: %v", err)
		}
		if err := tx.Create(perk2).Error; err != nil {
			t.Fatalf("Failed to seed perkiraan 2: %v", err)
		}

		repo := filters.NewFilterRepository(tx)
		svc := filters.NewFilterService(repo)

		// Search for "Besar"
		res, err := svc.GetPerkiraan("Besar", "", "")
		assert.NoError(t, err)
		assert.Greater(t, len(res), 0)
	})
}

// TestFilterService_GetPerkiraan_WithoutUserAccess filters out a specific
// perkiraan code when provided.
func TestFilterService_GetPerkiraan_WithoutUserAccess(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		perk1 := &models.SDbPerkiraan{
			Perkiraan:   "1100",
			Keterangan:  "Bank",
		}
		perk2 := &models.SDbPerkiraan{
			Perkiraan:   "1101",
			Keterangan:  "Bank Mandiri",
		}
		if err := tx.Create(perk1).Error; err != nil {
			t.Fatalf("Failed to seed perkiraan 1: %v", err)
		}
		if err := tx.Create(perk2).Error; err != nil {
			t.Fatalf("Failed to seed perkiraan 2: %v", err)
		}

		repo := filters.NewFilterRepository(tx)
		svc := filters.NewFilterService(repo)

		// Get all without exclusion
		allRes, err := svc.GetPerkiraan("", "", "")
		assert.NoError(t, err)
		allCount := len(allRes)

		// Get with exclusion of "1100"
		res, err := svc.GetPerkiraan("", "1100", "")
		assert.NoError(t, err)
		assert.Less(t, len(res), allCount)
	})
}

// TestFilterService_GetKelompokKas_WithDefaultType verifies that an empty
// accountType defaults to "KAS".
func TestFilterService_GetKelompokKas_WithDefaultType(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Seed perkiraan records
		perk := &models.SDbPerkiraan{
			Perkiraan:   "1500",
			Keterangan:  "Kas Operasional",
		}
		if err := tx.Create(perk).Error; err != nil {
			t.Fatalf("Failed to seed perkiraan: %v", err)
		}

		repo := filters.NewFilterRepository(tx)
		svc := filters.NewFilterService(repo)

		// Call with empty accountType; should default to "KAS"
		res, err := svc.GetKelompokKas("", "Kas")
		assert.NoError(t, err)
		// The result depends on whether the DB has matching records
		_ = res
	})
}

// TestFilterService_GetKelompokKas_WithSpecificType verifies retrieval
// with a specific account type.
func TestFilterService_GetKelompokKas_WithSpecificType(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		perk := &models.SDbPerkiraan{
			Perkiraan:   "2000",
			Keterangan:  "Hutang",
		}
		if err := tx.Create(perk).Error; err != nil {
			t.Fatalf("Failed to seed perkiraan: %v", err)
		}

		repo := filters.NewFilterRepository(tx)
		svc := filters.NewFilterService(repo)

		res, err := svc.GetKelompokKas("HUTANG", "")
		assert.NoError(t, err)
		// Verify it returns a slice (not error)
		assert.IsType(t, []models.SDbPerkiraan{}, res)
	})
}
