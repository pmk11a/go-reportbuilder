package repositories

import (
	"strings"

	"github.com/masza1/dapen-backend/internal/models"
	"gorm.io/gorm"
)

type IUserRepository interface {
	// GORM users table (Auth / Website Login)
	GetByUsername(username string) (*models.SUser, error)
	GetByID(id uint) (*models.SUser, error)
	Create(user *models.SUser) error
	Update(user *models.SUser) error
	Delete(id uint) error

	// Legacy DBFLPASS table (Admin Panel User Management)
	GetPaginatedDBFLPASS(page, pageSize int, search string, status string) ([]models.SDBFLPASS, int64, error)
	GetByUserIDDBFLPASS(userID string) (*models.SDBFLPASS, error)
	CreateDBFLPASS(user *models.SDBFLPASS) error
	UpdateDBFLPASS(user *models.SDBFLPASS) error
	DeleteDBFLPASS(userID string) error

	// Note: permission-related methods have moved to the identity/permission
	// sub-domain (see internal/identity/permission/repository.go). Per the
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

func (r *userRepository) GetByUsername(username string) (*models.SUser, error) {
	var user models.SUser
	err := r.db.Preload("SDBFLPASS").Where("username = ?", username).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) GetByID(id uint) (*models.SUser, error) {
	var user models.SUser
	err := r.db.Preload("SDBFLPASS").First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) Create(user *models.SUser) error {
	return r.db.Create(user).Error
}

func (r *userRepository) Update(user *models.SUser) error {
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
	return r.db.Delete(&models.SUser{}, id).Error
}

// ─── LEGACY DBFLPASS TABLE METHODS (Admin Panel User Management) ───

func (r *userRepository) GetByUserIDDBFLPASS(userID string) (*models.SDBFLPASS, error) {
	var user models.SDBFLPASS
	err := r.db.Where("USERID = ?", userID).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) CreateDBFLPASS(user *models.SDBFLPASS) error {
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

func (r *userRepository) UpdateDBFLPASS(user *models.SDBFLPASS) error {
	return r.db.Save(user).Error
}

func (r *userRepository) GetPaginatedDBFLPASS(page, pageSize int, search string, status string) ([]models.SDBFLPASS, int64, error) {
	var users []models.SDBFLPASS
	var total int64

	query := r.db.Model(&models.SDBFLPASS{})
	if search != "" {
		searchTerm := "%" + strings.ToUpper(search) + "%"
		query = query.Where("USERID LIKE ? OR FullName LIKE ?", searchTerm, searchTerm)
	}
	if status != "" {
		query = query.Where("STATUS = ?", status)
	}

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	err = query.Offset(offset).Limit(pageSize).Find(&users).Error
	if err != nil {
		return nil, 0, err
	}

	return users, total, nil
}

func (r *userRepository) DeleteDBFLPASS(userID string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Delete DBFLPASS record
		if err := tx.Where("USERID = ?", userID).Delete(&models.SDBFLPASS{}).Error; err != nil {
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
