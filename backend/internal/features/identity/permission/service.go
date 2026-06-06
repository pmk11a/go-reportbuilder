package permission

// IPermissionService defines the business-logic contract for user
// permissions. The service is a thin pass-through wrapper over the
// repository today; it exists to give the handler a stable interface
// and a natural place to grow business rules (e.g. role-based
// auto-revocation, audit logging, etc.).
type IPermissionService interface {
	GetUserMenuPermissions(userID string) ([]SUserPermission, error)
	GetUserReportPermissions(userID string) ([]SUserPermission, error)
	GetUserCoaAccess(userID string) ([]SUserCoaAccess, error)
	GetUserPermissions(userID string) ([]SUserPermission, []SUserPermission, []SUserCoaAccess, error)
	UpdateUserPermissions(userID string, menuPerms []SUserPermission, reportPerms []SUserPermission, coaPerms []SUserCoaAccess) error
	GetPermissionReportMatrix(userID, menuCode, menuType string, page, pageSize int) ([]SPermissionReportRow, int64, error)
}

type permissionService struct {
	repo IPermissionRepository
}

// NewPermissionService constructs the concrete permission service.
func NewPermissionService(repo IPermissionRepository) IPermissionService {
	return &permissionService{repo: repo}
}

// GetUserMenuPermissions delegates to the repository. The per-tab
// frontend cache (10-minute staleTime) reads through this method, so
// keeping it a thin wrapper is intentional — business rules here would
// bypass the cache and hit the database on every tab switch.
func (s *permissionService) GetUserMenuPermissions(userID string) ([]SUserPermission, error) {
	return s.repo.GetUserMenuPermissions(userID)
}

// GetUserReportPermissions delegates to the repository.
func (s *permissionService) GetUserReportPermissions(userID string) ([]SUserPermission, error) {
	return s.repo.GetUserReportPermissions(userID)
}

// GetUserCoaAccess delegates to the repository.
func (s *permissionService) GetUserCoaAccess(userID string) ([]SUserCoaAccess, error) {
	return s.repo.GetUserCoaAccess(userID)
}

// GetUserPermissions returns the combined menu+report+COA slice for the
// legacy combined endpoint.
func (s *permissionService) GetUserPermissions(userID string) ([]SUserPermission, []SUserPermission, []SUserCoaAccess, error) {
	return s.repo.GetUserPermissions(userID)
}

// UpdateUserPermissions applies the transactional update across menu,
// report, and COA tables. See IPermissionRepository.UpdateUserPermissions
// for the SQL details.
func (s *permissionService) UpdateUserPermissions(userID string, menuPerms []SUserPermission, reportPerms []SUserPermission, coaPerms []SUserCoaAccess) error {
	return s.repo.UpdateUserPermissions(userID, menuPerms, reportPerms, coaPerms)
}

// GetPermissionReportMatrix returns the rows for the standalone report page.
func (s *permissionService) GetPermissionReportMatrix(userID, menuCode, menuType string, page, pageSize int) ([]SPermissionReportRow, int64, error) {
	return s.repo.GetPermissionReportMatrix(userID, menuCode, menuType, page, pageSize)
}
