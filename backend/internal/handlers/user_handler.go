package handlers

import (
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/dto"
	"github.com/masza1/dapen-backend/internal/models"
	"github.com/masza1/dapen-backend/internal/repositories"
	"github.com/masza1/dapen-backend/internal/utils"
	"golang.org/x/crypto/bcrypt"
)

// SUserHandler handles HTTP requests for user management
type SUserHandler struct {
	repo repositories.IUserRepository
}

// NewUserHandler constructs a SUserHandler with the given repository
func NewUserHandler(repo repositories.IUserRepository) *SUserHandler {
	return &SUserHandler{repo: repo}
}

// GetUsers godoc
// @Summary Get Users
// @Description Fetch a paginated list of legacy users from the DBFLPASS table
// @Tags User
// @Produce json
// @Param page query int false "Page Number" default(1)
// @Param limit query int false "Limit per page" default(10)
// @Param search query string false "Search query"
// @Param status query string false "Status filter"
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/admin/users [get]
func (h *SUserHandler) GetUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")
	status := c.Query("status")

	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	users, total, err := h.repo.GetPaginatedDBFLPASS(page, pageSize, search, status)
	if err != nil {
		utils.InternalError(c, "Failed to retrieve users: "+err.Error())
		return
	}

	utils.Success(c, "Users retrieved successfully", utils.NewPaginatedResponse(users, total, page, pageSize))
}

// CreateUser godoc
// @Summary Create User
// @Description Hashing password and storing a new user record inside the DBFLPASS table
// @Tags User
// @Accept json
// @Produce json
// @Param body body dto.SCreateUserPayload true "Create User Payload"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/admin/users [post]
func (h *SUserHandler) CreateUser(c *gin.Context) {
	var payload dto.SCreateUserPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		utils.BadRequest(c, "Invalid input: "+err.Error())
		return
	}

	// USERID is case-insensitive and stored in uppercase
	userID := strings.ToUpper(payload.Username)

	// Check if legacy user already exists in DBFLPASS
	existing, _ := h.repo.GetByUserIDDBFLPASS(userID)
	if existing != nil {
		utils.BadRequest(c, "Username already exists")
		return
	}

	// Hash password
	hashed, err := bcrypt.GenerateFromPassword([]byte(payload.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.InternalError(c, "Failed to secure password")
		return
	}

	// Map role to legacy tingkat level
	tingkat := "0" // employee/karyawan
	if payload.Role == "admin" {
		tingkat = "2" // admin
	}

	user := &models.SDBFLPASS{
		USERID:   userID,
		UID:      payload.Username,
		FullName: payload.FullName,
		TINGKAT:  tingkat,
		STATUS:   "1", // Active
		UID2:     string(hashed),
	}

	if err := h.repo.CreateDBFLPASS(user); err != nil {
		utils.InternalError(c, "Failed to store user: "+err.Error())
		return
	}

	utils.Created(c, "User created successfully", user)
}

// UpdateUser godoc
// @Summary Update User
// @Description Update legacy fields for a user inside the DBFLPASS table
// @Tags User
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Param body body dto.SUpdateUserPayload true "Update User Payload"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/admin/users/{id} [put]
func (h *SUserHandler) UpdateUser(c *gin.Context) {
	userID := c.Param("id") // The userID string (e.g. SA, ADMIN, MIA)
	if userID == "" {
		utils.BadRequest(c, "Invalid user ID")
		return
	}

	var payload dto.SUpdateUserPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		utils.BadRequest(c, "Invalid input: "+err.Error())
		return
	}

	user, err := h.repo.GetByUserIDDBFLPASS(userID)
	if err != nil {
		utils.NotFound(c, "User not found")
		return
	}

	tingkat := "0"
	if payload.Role == "admin" {
		tingkat = "2"
	}

	user.FullName = payload.FullName
	user.TINGKAT = tingkat
	if payload.Status != "" {
		if payload.Status == "0" || payload.Status == "1" {
			user.STATUS = payload.Status
		} else {
			utils.BadRequest(c, "Status must be '0' or '1'")
			return
		}
	}

	if payload.Password != "" {
		if len(payload.Password) < 6 {
			utils.BadRequest(c, "Password must be at least 6 characters")
			return
		}
		hashed, err := bcrypt.GenerateFromPassword([]byte(payload.Password), bcrypt.DefaultCost)
		if err != nil {
			utils.InternalError(c, "Failed to secure password")
			return
		}
		user.UID2 = string(hashed)
	}

	if err := h.repo.UpdateDBFLPASS(user); err != nil {
		utils.InternalError(c, "Failed to update user: "+err.Error())
		return
	}

	utils.Success(c, "User updated successfully", user)
}

// DeleteUser godoc
// @Summary Delete User
// @Description Delete a user from the DBFLPASS table and prevent self-deletion
// @Tags User
// @Produce json
// @Param id path string true "User ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/admin/users/{id} [delete]
func (h *SUserHandler) DeleteUser(c *gin.Context) {
	userID := c.Param("id")
	if userID == "" {
		utils.BadRequest(c, "Invalid user ID")
		return
	}

	// Fetch active user ID from JWT context (e.g. legacy_user_id)
	activeUserVal, exists := c.Get("legacy_user_id")
	if exists {
		activeUID, ok := activeUserVal.(string)
		if ok && strings.ToUpper(activeUID) == strings.ToUpper(userID) {
			utils.BadRequest(c, "You cannot delete your own account")
			return
		}
	}

	if err := h.repo.DeleteDBFLPASS(userID); err != nil {
		utils.InternalError(c, "Failed to delete user: "+err.Error())
		return
	}

	utils.Success(c, "User deleted successfully", nil)
}

// GetUserPermissions godoc
// @Summary Get User Permissions
// @Description Fetch legacy menu, report, and COA access permissions for a given user
// @Tags User
// @Produce json
// @Param id path string true "User ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/admin/users/{id}/permissions [get]
func (h *SUserHandler) GetUserPermissions(c *gin.Context) {
	userID := c.Param("id")
	if userID == "" {
		utils.BadRequest(c, "Invalid user ID")
		return
	}

	menuPerms, reportPerms, coaAccess, err := h.repo.GetUserPermissions(userID)
	if err != nil {
		utils.InternalError(c, "Failed to retrieve permissions: "+err.Error())
		return
	}

	utils.Success(c, "User permissions retrieved successfully", gin.H{
		"menu":   menuPerms,
		"report": reportPerms,
		"coa":    coaAccess,
	})
}

// UpdateUserPermissions godoc
// @Summary Update User Permissions
// @Description Update checked, aktif, and ACCESS values for dbmenu, dbmenureport, and DBAKSESPERKIRAAN for a given user
// @Tags User
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Param body body dto.SUpdateUserPermissionsPayload true "Update User Permissions Payload"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/admin/users/{id}/permissions [put]
func (h *SUserHandler) UpdateUserPermissions(c *gin.Context) {
	userID := c.Param("id")
	if userID == "" {
		utils.BadRequest(c, "Invalid user ID")
		return
	}

	var payload dto.SUpdateUserPermissionsPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		utils.BadRequest(c, "Invalid input: "+err.Error())
		return
	}

	// Map DTO payload to model structs for the repository layer
	menuPerms := make([]models.SUserPermission, len(payload.Menu))
	for i, p := range payload.Menu {
		menuPerms[i] = models.SUserPermission{
			KodeMenu:   p.KodeMenu,
			Keterangan: p.Keterangan,
			L0:         p.L0,
			L1:         p.L1,
			L2:         p.L2,
			L3:         p.L3,
			Checked:    p.Checked,
			Aktif:      p.Aktif,
			Access:     p.Access,
			Icon:       p.Icon,
			Routename:  p.Routename,
		}
	}

	reportPerms := make([]models.SUserPermission, len(payload.Report))
	for i, p := range payload.Report {
		reportPerms[i] = models.SUserPermission{
			KodeMenu:   p.KodeMenu,
			Keterangan: p.Keterangan,
			L0:         p.L0,
			L1:         p.L1,
			L2:         p.L2,
			L3:         p.L3,
			Checked:    p.Checked,
			Aktif:      p.Aktif,
			Access:     p.Access,
			Icon:       p.Icon,
			Routename:  p.Routename,
		}
	}

	coaPerms := make([]models.SUserCoaAccess, len(payload.Coa))
	for i, c := range payload.Coa {
		coaPerms[i] = models.SUserCoaAccess{
			Perkiraan:  c.Perkiraan,
			Keterangan: c.Keterangan,
			Checked:    c.Checked,
		}
	}

	err := h.repo.UpdateUserPermissions(userID, menuPerms, reportPerms, coaPerms)
	if err != nil {
		utils.InternalError(c, "Failed to update permissions: "+err.Error())
		return
	}

	utils.Success(c, "User permissions updated successfully", nil)
}
