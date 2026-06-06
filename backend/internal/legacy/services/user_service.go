package services

import (
	"github.com/masza1/dapen-backend/internal/legacy/repositories"
)

// IUserService is the business-logic entry point for user-related queries.
// It exists to keep handlers thin and to make unit-testing easy via mocks.
//
// Note: permission-related methods have moved to the identity/permission
// sub-domain (see internal/features/identity/permission/service.go). Per the
// Domain-Based + DDD-Lite architecture, the user service does NOT depend
// on the permission service and vice versa.
type IUserService interface {
}

type userService struct {
	repo repositories.IUserRepository
}

// NewUserService constructs a userService that delegates to the given repo.
func NewUserService(repo repositories.IUserRepository) IUserService {
	return &userService{repo: repo}
}
