package repositories

import (
	"github.com/masza1/dapen-backend/internal/models"
	"gorm.io/gorm"
)

type IUserRepository interface {
	GetByUsername(username string) (*models.SUser, error)
	GetByID(id uint) (*models.SUser, error)
	Create(user *models.SUser) error
	Update(user *models.SUser) error
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) IUserRepository {
	return &userRepository{db: db}
}

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

