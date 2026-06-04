package user

// IUserService is the business-logic entry point for user-related queries.
// It exists to keep handlers thin and to make unit-testing easy via mocks.
//
// Note: the permission-related service lives in internal/identity/permission
// (separate sub-domain). Per the Domain-Based + DDD-Lite architecture, the
// user service does NOT depend on the permission service and vice versa.
type IUserService interface {
}

type userService struct {
	repo IUserRepository
}

// NewUserService constructs a userService that delegates to the given repo.
func NewUserService(repo IUserRepository) IUserService {
	return &userService{repo: repo}
}
