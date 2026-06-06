package user

import (
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	
				"github.com/masza1/dapen-backend/internal/infrastructure/response"
	"golang.org/x/crypto/bcrypt"
)

// SUserHandler handles HTTP requests for user management
type SUserHandler struct {
	repo IUserRepository
	svc  IUserService
}

// NewUserHandler constructs a SUserHandler with the given repository and service.
// svc may be nil for legacy code paths that only use the repo (the existing
// CRUD handlers still do); the new split-getter / report handlers will
// require a service.
func NewUserHandler(repo IUserRepository, svc IUserService) *SUserHandler {
	return &SUserHandler{repo: repo, svc: svc}
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
		response.InternalError(c, "Failed to retrieve users: "+err.Error())
		return
	}

	response.Success(c, "Users retrieved successfully", response.NewPaginatedResponse(users, total, page, pageSize))
}

// CreateUser godoc
// @Summary Create User
// @Description Hashing password and storing a new user record inside the DBFLPASS table
// @Tags User
// @Accept json
// @Produce json
// @Param body body SCreateUserPayload true "Create User Payload"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/admin/users [post]
func (h *SUserHandler) CreateUser(c *gin.Context) {
	var payload SCreateUserPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		response.BadRequest(c, "Invalid input: "+err.Error())
		return
	}

	// USERID is case-insensitive and stored in uppercase
	userID := strings.ToUpper(payload.Username)

	// Check if legacy user already exists in DBFLPASS
	existing, _ := h.repo.GetByUserIDDBFLPASS(userID)
	if existing != nil {
		response.BadRequest(c, "Username already exists")
		return
	}

	// Hash password
	hashed, err := bcrypt.GenerateFromPassword([]byte(payload.Password), bcrypt.DefaultCost)
	if err != nil {
		response.InternalError(c, "Failed to secure password")
		return
	}

	// Map role to legacy access level
	// The legacy DBFLPASS.TINGKAT column uses '0' for regular employees and '2' for admin
	legacyAccessLevel := "0"
	if payload.Role == "admin" {
		legacyAccessLevel = "2"
	}

	newUser := &SDBFLPASS{
		USERID:   userID,
		UID:      payload.Username,
		FullName: payload.FullName,
		TINGKAT:  legacyAccessLevel,
		STATUS:   "1", // Active
		UID2:     string(hashed),
	}

	if err := h.repo.CreateDBFLPASS(newUser); err != nil {
		response.InternalError(c, "Failed to store user: "+err.Error())
		return
	}

	response.Created(c, "User created successfully", newUser)
}

// UpdateUser godoc
// @Summary Update User
// @Description Update legacy fields for a user inside the DBFLPASS table
// @Tags User
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Param body body SUpdateUserPayload true "Update User Payload"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/admin/users/{id} [put]
func (h *SUserHandler) UpdateUser(c *gin.Context) {
	userID := c.Param("id") // The userID string (e.g. SA, ADMIN, MIA)
	if userID == "" {
		response.BadRequest(c, "Invalid user ID")
		return
	}

	var payload SUpdateUserPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		response.BadRequest(c, "Invalid input: "+err.Error())
		return
	}

	user, err := h.repo.GetByUserIDDBFLPASS(userID)
	if err != nil {
		response.NotFound(c, "User not found")
		return
	}
	existingUser := user

	legacyAccessLevel := "0"
	if payload.Role == "admin" {
		legacyAccessLevel = "2"
	}

	existingUser.FullName = payload.FullName
	existingUser.TINGKAT = legacyAccessLevel
	if payload.Status != "" {
		if payload.Status == "0" || payload.Status == "1" {
			existingUser.STATUS = payload.Status
		} else {
			response.BadRequest(c, "Status must be '0' or '1'")
			return
		}
	}

	if payload.Password != "" {
		if len(payload.Password) < 6 {
			response.BadRequest(c, "Password must be at least 6 characters")
			return
		}
		hashed, err := bcrypt.GenerateFromPassword([]byte(payload.Password), bcrypt.DefaultCost)
		if err != nil {
			response.InternalError(c, "Failed to secure password")
			return
		}
		existingUser.UID2 = string(hashed)
	}

	if err := h.repo.UpdateDBFLPASS(existingUser); err != nil {
		response.InternalError(c, "Failed to update user: "+err.Error())
		return
	}

	response.Success(c, "User updated successfully", existingUser)
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
		response.BadRequest(c, "Invalid user ID")
		return
	}

	// Fetch active user ID from JWT context (e.g. legacy_user_id)
	activeUserVal, exists := c.Get("legacy_user_id")
	if exists {
		activeUID, ok := activeUserVal.(string)
		if ok && strings.ToUpper(activeUID) == strings.ToUpper(userID) {
			response.BadRequest(c, "You cannot delete your own account")
			return
		}
	}

	if err := h.repo.DeleteDBFLPASS(userID); err != nil {
		response.InternalError(c, "Failed to delete user: "+err.Error())
		return
	}

	response.Success(c, "User deleted successfully", nil)
}
