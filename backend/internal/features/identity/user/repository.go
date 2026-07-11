package user

import (
	"context"
	"errors"
	"strings"

	"github.com/masza1/dapen-backend/internal/shared/pagination"
	"gorm.io/gorm"
)

type IUserRepository interface {
	// GORM users table (Auth / Website Login)
	GetByUsername(username string) (*SUser, error)
	GetByID(id uint) (*SUser, error)
	Create(user *SUser) error
	Update(user *SUser) error
	Delete(id uint) error
	// GetUserIDByLegacyUserID resolves a legacy string user_id (like "SA") to the numeric SUser.ID.
	// This bridges session endpoints that accept user IDs as path parameters.
	GetUserIDByLegacyUserID(ctx context.Context, legacyUserID string) (uint, error)

	// Legacy DBFLPASS table (Admin Panel User Management)
	GetPaginatedDBFLPASS(page, pageSize int, search string, status string) ([]SDBFLPASS, int64, error)
	GetByUserIDDBFLPASS(userID string) (*SDBFLPASS, error)
	CreateDBFLPASS(user *SDBFLPASS) error
	UpdateDBFLPASS(user *SDBFLPASS) error
	DeleteDBFLPASS(userID string) error

	// Note: permission-related methods have moved to the identity/permission
	// sub-domain (see internal/features/identity/permission/repository.go). Per the
	// Domain-Based + DDD-Lite architecture, the user repository does NOT
	// depend on the permission repository and vice versa.
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) IUserRepository {
	return &userRepository{db: db}
}

// ─── GORM USERS TABLE METHODS (Auth / Website Login) ───

func (r *userRepository) GetByUsername(username string) (*SUser, error) {
	var user SUser
	err := pagination.First2008(r.db, &user, "id", func(q *gorm.DB) *gorm.DB {
		return q.Where("username = ?", username)
	})
	if err != nil {
		return nil, err
	}
	// Step 2: manually fetch the optional SDBFLPASS relation (SQL Server 2008-compatible).
	if user.UserID != "" {
		var sdbflpass SDBFLPASS
		if errRel := pagination.First2008(r.db, &sdbflpass, "[USERID]", func(q *gorm.DB) *gorm.DB {
			return q.Where("USERID = ?", user.UserID)
		}); errRel == nil {
			user.SDBFLPASS = &sdbflpass
		} else if !errors.Is(errRel, gorm.ErrRecordNotFound) {
			return nil, errRel
		}
	}
	return &user, nil
}

func (r *userRepository) GetByID(id uint) (*SUser, error) {
	var user SUser
	err := pagination.First2008(r.db, &user, "id", func(q *gorm.DB) *gorm.DB {
		return q.Where("id = ?", id)
	})
	if err != nil {
		return nil, err
	}
	// Step 2: manually fetch the optional SDBFLPASS relation (SQL Server 2008-compatible).
	if user.UserID != "" {
		var sdbflpass SDBFLPASS
		if errRel := pagination.First2008(r.db, &sdbflpass, "[USERID]", func(q *gorm.DB) *gorm.DB {
			return q.Where("USERID = ?", user.UserID)
		}); errRel == nil {
			user.SDBFLPASS = &sdbflpass
		} else if !errors.Is(errRel, gorm.ErrRecordNotFound) {
			return nil, errRel
		}
	}
	return &user, nil
}

func (r *userRepository) GetUserIDByLegacyUserID(ctx context.Context, legacyUserID string) (uint, error) {
	var user SUser
	err := pagination.First2008(r.db.WithContext(ctx), &user, "id", func(q *gorm.DB) *gorm.DB {
		return q.Where("user_id = ?", legacyUserID)
	})
	if err != nil {
		return 0, err
	}
	return user.ID, nil
}

func (r *userRepository) Create(user *SUser) error {
	return r.db.Create(user).Error
}

func (r *userRepository) Update(user *SUser) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(user).Error; err != nil {
			return err
		}
		if user.SDBFLPASS != nil {
			if err := tx.Save(user.SDBFLPASS).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *userRepository) Delete(id uint) error {
	return r.db.Delete(&SUser{}, id).Error
}

// ─── LEGACY DBFLPASS TABLE METHODS (Admin Panel User Management) ───

func (r *userRepository) GetByUserIDDBFLPASS(userID string) (*SDBFLPASS, error) {
	var user SDBFLPASS
	err := pagination.First2008(r.db, &user, "[USERID]", func(q *gorm.DB) *gorm.DB {
		return q.Where("USERID = ?", userID)
	})
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) CreateDBFLPASS(user *SDBFLPASS) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// 1. Create the legacy SDBFLPASS record directly
		if err := tx.Create(user).Error; err != nil {
			return err
		}

		// 2. Duplicate master rows for this user in dbmenu, dbmenureport, dbaksesperkiraan (from Laravel logic)
		tables := []string{"dbmenu", "dbmenureport", "dbaksesperkiraan"}
		for _, table := range tables {
			// Check if table exists & USERID column exists
			var hasTable int
			tx.Raw("SELECT count(*) FROM sys.tables WHERE name = ?", table).Scan(&hasTable)
			if hasTable > 0 {
				if table == "dbaksesperkiraan" {
					// COA uses different columns (UserID, Perkiraan) - copy all COA entries
					tx.Exec("INSERT INTO "+table+" (UserID, Perkiraan) "+
						"SELECT ?, Perkiraan FROM DBPERKIRAAN WHERE Perkiraan NOT IN "+
						"(SELECT Perkiraan FROM "+table+" WHERE UserID = ?)", user.USERID, user.USERID)
				} else {
					// Menu and report tables - duplicate master permissions where USERID is NULL or empty
					tx.Exec("INSERT INTO "+table+" (KODEMENU, L0, L1, L2, L3, Keterangan, Icon, Routename, checked, aktif, ACCESS, USERID) "+
						"SELECT KODEMENU, L0, L1, L2, L3, Keterangan, Icon, Routename, 0, 0, 0, ? "+
						"FROM "+table+" WHERE USERID IS NULL OR USERID = ''", user.USERID)
				}
			}
		}

		return nil
	})
}

func (r *userRepository) UpdateDBFLPASS(user *SDBFLPASS) error {
	return r.db.Save(user).Error
}

func (r *userRepository) GetPaginatedDBFLPASS(page, pageSize int, search string, status string) ([]SDBFLPASS, int64, error) {
	// SQL Server 2008-compatible path: build baseSQL + args, then delegate to
	// pagination.PaginatedFind which wraps a ROW_NUMBER() CTE.
	//
	// Placeholders use `?` rather than SQL Server native `@pN` — see
	// menu repository for the rationale (mssql driver doesn't bind `@p`
	// through db.Raw reliably).
	var users []SDBFLPASS
	baseSQL := "SELECT * FROM DBFLPASS"
	var args []any
	if search != "" {
		searchTerm := "%" + strings.ToUpper(strings.TrimSpace(search)) + "%"
		baseSQL += " WHERE (USERID LIKE ? OR FullName LIKE ?)"
		args = append(args, searchTerm, searchTerm)
		if status != "" {
			baseSQL += " AND STATUS = ?"
			args = append(args, status)
		}
	} else if status != "" {
		baseSQL += " WHERE STATUS = ?"
		args = append(args, status)
	}

	total, err := pagination.PaginatedFind(r.db, &users, baseSQL, "[USERID] ASC", page, pageSize, args...)
	if err != nil {
		return nil, 0, err
	}
	return users, total, err
}

func (r *userRepository) DeleteDBFLPASS(userID string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Delete DBFLPASS record
		if err := tx.Where("USERID = ?", userID).Delete(&SDBFLPASS{}).Error; err != nil {
			return err
		}

		// Clean up permissions from other tables
		tables := []string{"dbmenu", "dbmenureport"}
		for _, table := range tables {
			tx.Exec("DELETE FROM "+table+" WHERE USERID = ?", userID)
		}

		// Clean up COA access
		tx.Exec("DELETE FROM DBAKSESPERKIRAAN WHERE UserID = ?", userID)

		return nil
	})
}
