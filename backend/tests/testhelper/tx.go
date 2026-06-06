package testhelper

import (
	"testing"

	"gorm.io/gorm"
)

// WithTestTx wraps a test function in a SQL transaction that is always rolled back.
// This provides per-test isolation without the overhead of DROP/CREATE database.
//
// Usage:
//
//	func TestMyHandler(t *testing.T) {
//		WithTestTx(t, testDB, func(tx *gorm.DB) {
//			// Create test data in tx
//			tx.Create(&models.SUser{...})
//
//			// Run test using tx instead of testDB
//			repo := NewUserRepository(tx)
//			user, err := repo.GetByID(1)
//			// Assert...
//		})
//		// After the test, tx is automatically rolled back
//	}
func WithTestTx(t *testing.T, db *gorm.DB, fn func(tx *gorm.DB)) {
	tx := db.Begin()
	if tx.Error != nil {
		t.Fatalf("Failed to begin transaction: %v", tx.Error)
	}

	// Register cleanup to rollback the transaction when the test ends
	t.Cleanup(func() {
		if err := tx.Rollback().Error; err != nil {
			t.Logf("Warning: Failed to rollback transaction: %v", err)
		}
	})

	// Execute the test function with the transaction
	fn(tx)
}

// WithTestTxNoRollback is like WithTestTx but does not rollback after the test.
// Use only for debugging or when you need to inspect database state after test failure.
// WARNING: This will pollute the test database with test data — cleanup manually!
func WithTestTxNoRollback(t *testing.T, db *gorm.DB, fn func(tx *gorm.DB)) {
	tx := db.Begin()
	if tx.Error != nil {
		t.Fatalf("Failed to begin transaction: %v", tx.Error)
	}

	fn(tx)
	// Note: transaction is NOT rolled back here
}

// WithNestedTx creates a nested savepoint within a transaction for more granular isolation.
// Useful for testing transaction rollback behavior or nested transactions.
func WithNestedTx(t *testing.T, tx *gorm.DB, fn func(nestedTx *gorm.DB)) {
	nestedTx := tx.SavePoint("sp_" + t.Name())
	if nestedTx.Error != nil {
		t.Fatalf("Failed to create savepoint: %v", nestedTx.Error)
	}

	t.Cleanup(func() {
		if err := nestedTx.RollbackTo("sp_" + t.Name()).Error; err != nil {
			t.Logf("Warning: Failed to rollback savepoint: %v", err)
		}
	})

	fn(nestedTx)
}
