package dashboard

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/features/identity/permission"
	userdomain "github.com/masza1/dapen-backend/internal/features/identity/user"
	"github.com/masza1/dapen-backend/internal/features/menu"
	cachepkg "github.com/masza1/dapen-backend/internal/infrastructure/cache"
	"github.com/masza1/dapen-backend/internal/infrastructure/database"
	"github.com/masza1/dapen-backend/internal/infrastructure/response"
	"gorm.io/gorm"
)

type SDashboardHandler struct {
	db *gorm.DB
}

func NewDashboardHandler(database *gorm.DB) *SDashboardHandler {
	return &SDashboardHandler{db: database}
}


// GetSidebarMenu godoc
// @Summary Get Sidebar Menu
// @Description Fetch dynamic sidebar menu based on user permissions
// @Tags Dashboard
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Security BearerAuth
// @Router /menus/sidebar [get]
func (h *SDashboardHandler) GetSidebarMenu(c *gin.Context) {
	userIDFloat, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c, "SUser not authenticated")
		return
	}

	userIDVal, ok := userIDFloat.(float64)
	if !ok {
		response.BadRequest(c, "Invalid user ID type in token")
		return
	}
	userID := uint(userIDVal)

	var fetchedUser userdomain.SUser
	if err := h.db.Preload("SDBFLPASS").First(&fetchedUser, userID).Error; err != nil {
		response.BadRequest(c, "SUser not found")
		return
	}

	legacyUserID := fetchedUser.UserID
	if legacyUserID == "" {
		legacyUserID = "SA" // Fallback if UserID link is empty
	}

	// 1. Check if cache exists (Fail-Open cache check)
	cacheKey := fmt.Sprintf("cache:user:%s:menu:sidebar", legacyUserID)
	cacheManager := cachepkg.NewCacheManager(database.RedisClient)
	
	ctx := context.Background()
	bypassCache := false
	if c.Request != nil {
		ctx = c.Request.Context()
		bypassCache = c.GetHeader("X-Cache-Bypass") == "true"
	}

	type sSidebarResponse struct {
		UserInfo  map[string]interface{}  `json:"user_info"`
		MenuItems []menu.SMenuResponseItem `json:"menu_items"`
		Timestamp string                  `json:"timestamp"`
	}

	var cachedData sSidebarResponse
	if !bypassCache && cacheManager.Get(ctx, cacheKey, &cachedData) {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    cachedData,
		})
		return
	}

	// Fetch all flmenu permissions for the user to optimize queries (O(1) lookup inside recursion)
	var flmenus []permission.SDbFlmenu
	h.db.Where("USERID = ?", legacyUserID).Find(&flmenus)
	flmenuMap := make(map[string]permission.SDbFlmenu)
	for _, fl := range flmenus {
		flmenuMap[fl.L1] = fl
	}

	// Build menu tree recursively starting at level 0.
	// Domain logic lives in the menu package; dashboard just calls it.
	menuTree := menu.BuildSidebarTree(h.db, legacyUserID, "", 0, flmenuMap)

	responseData := sSidebarResponse{
		UserInfo: map[string]interface{}{
			"name":       fetchedUser.FullName,
			"level":      "SA",
			"avatar":     "fas fa-user-circle",
			"department": "N/A",
			"position":   "N/A",
		},
		MenuItems: menuTree,
		Timestamp: time.Now().Format(time.RFC3339),
	}

	// Cache in Redis for 1 Hour (Enterprise Rule #1)
	cacheManager.Set(ctx, cacheKey, responseData, 1*time.Hour)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    responseData,
	})
}


// GetStats godoc
// @Summary Get Dashboard Statistics
// @Description Fetch various statistics for the dashboard
// @Tags Dashboard
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /dashboard/stats [get]
func (h *SDashboardHandler) GetStats(c *gin.Context) {
	cacheKey := "cache:global:dashboard:stats"
	cacheManager := cachepkg.NewCacheManager(database.RedisClient)
	
	ctx := context.Background()
	bypassCache := false
	if c.Request != nil {
		ctx = c.Request.Context()
		bypassCache = c.GetHeader("X-Cache-Bypass") == "true"
	}

	type sStatsResponse struct {
		TotalActive         int64 `json:"total_active"`
		TotalRetired        int64 `json:"total_retired"`
		ActiveCurrentYear   int64 `json:"active_current_year"`
		ActiveLastYear      int64 `json:"active_last_year"`
		ActiveNextYear      int64 `json:"active_next_year"`
		RetiringCurrentYear int64 `json:"retiring_current_year"`
		RetiringLastYear    int64 `json:"retiring_last_year"`
		RetiringNextYear    int64 `json:"retiring_next_year"`
		CurrentYear         int   `json:"current_year"`
		LastYear            int   `json:"last_year"`
		NextYear            int   `json:"next_year"`
	}

	var cachedStats sStatsResponse
	if !bypassCache && cacheManager.Get(ctx, cacheKey, &cachedStats) {
		response.Success(c, "Main statistics retrieved successfully", cachedStats)
		return
	}

	currentYear := time.Now().Year()
	lastYear := currentYear - 1
	nextYear := currentYear + 1

	// Note: TglLahir does not exist in DBCUSTSUPP legacy table, so retiring stats cannot be accurately calculated.
	var retiringThisYear int64 = 0
	var retiringLastYear int64 = 0
	var retiringNextYear int64 = 0

	// 4. Total active (JENIS = 3)
	var totalActive int64
	if err := h.db.Raw("SELECT COUNT(*) FROM DBCUSTSUPP WHERE JENIS = 3").Scan(&totalActive).Error; err != nil {
		response.InternalError(c, fmt.Sprintf("Query active current year failed: %v", err))
		return
	}
	totalActiveLastYear := totalActive
	totalActiveNextYear := totalActive

	// 7. Total retired (JENIS = 2)
	var totalRetired int64
	if err := h.db.Raw("SELECT COUNT(*) FROM DBCUSTSUPP WHERE JENIS = 2").Scan(&totalRetired).Error; err != nil {
		response.InternalError(c, fmt.Sprintf("Query total retired failed: %v", err))
		return
	}

	statsResponse := sStatsResponse{
		TotalActive:         totalActive,
		TotalRetired:        totalRetired,
		ActiveCurrentYear:   totalActive,
		ActiveLastYear:      totalActiveLastYear,
		ActiveNextYear:      totalActiveNextYear,
		RetiringCurrentYear: retiringThisYear,
		RetiringLastYear:    retiringLastYear,
		RetiringNextYear:    retiringNextYear,
		CurrentYear:         currentYear,
		LastYear:            lastYear,
		NextYear:            nextYear,
	}

	// Cache in Redis for 5 Minutes (Enterprise Rule #2)
	cacheManager.Set(ctx, cacheKey, statsResponse, 5*time.Minute)

	response.Success(c, "Main statistics retrieved successfully", statsResponse)
}

// GetPensiunanWithoutFiles godoc
// @Summary Get Pensiunan Without Files
// @Description Fetch list of retired customers without uploaded files
// @Tags Dashboard
// @Produce json
// @Param page query int false "Page Number" default(1)
// @Param limit query int false "Limit per page" default(10)
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /dashboard/pensiunan-without-files [get]
func (h *SDashboardHandler) GetPensiunanWithoutFiles(c *gin.Context) {
	// 1. Get total count for pagination
	// Note: dbemployeefile does not exist in legacy schema, so we just return all pensiunan for now.
	var total int64
	countQuery := `
		SELECT COUNT(*)
		FROM DBCUSTSUPP c
		WHERE c.JENIS = 2
	`
	if err := h.db.Raw(countQuery).Scan(&total).Error; err != nil {
		response.InternalError(c, fmt.Sprintf("Query total pensiunan without files failed: %v", err))
		return
	}

	// 2. Parse pagination parameters
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "10")

	page := 1
	limit := 10
	fmt.Sscanf(pageStr, "%d", &page)
	fmt.Sscanf(limitStr, "%d", &limit)
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	offset := (page - 1) * limit

	// 3. Fetch paginated data
	var rawData []SRawPensiunan
	query := `
		SELECT
			c.KODECUSTSUPP,
			c.NAMACUSTSUPP,
			NULL AS NoPegawai,
			NULL AS TglLahir,
			NULL AS TglPensiun,
			NULL AS TglKepersertaan
		FROM DBCUSTSUPP c
		WHERE c.JENIS = 2
		ORDER BY c.NAMACUSTSUPP ASC
		OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
	`

	if err := h.db.Raw(query, offset, limit).Scan(&rawData).Error; err != nil {
		response.InternalError(c, fmt.Sprintf("Query pensiunan without files failed: %v", err))
		return
	}

	// Format dates properly to YYYY-MM-DD
	formattedData := make([]SPensiunanWithoutFiles, len(rawData))
	for i, item := range rawData {
		formattedData[i] = SPensiunanWithoutFiles{
			KODECUSTSUPP: item.KODECUSTSUPP,
			NAMACUSTSUPP: item.NAMACUSTSUPP,
			NoPegawai:    item.NoPegawai,
		}

		if item.TglLahir != nil {
			str := item.TglLahir.Format("2006-01-02")
			formattedData[i].TglLahir = &str
		}
		if item.TglPensiun != nil {
			str := item.TglPensiun.Format("2006-01-02")
			formattedData[i].TglPensiun = &str
		}
		if item.TglKepersertaan != nil {
			str := item.TglKepersertaan.Format("2006-01-02")
			formattedData[i].TglKepersertaan = &str
		}
	}

	lastPage := (total + int64(limit) - 1) / int64(limit)

	response.Success(c, "Pensiunan without files retrieved successfully", gin.H{
		"total": total,
		"data":  formattedData,
		"pagination": gin.H{
			"current_page": page,
			"per_page":     limit,
			"total":        total,
			"last_page":    lastPage,
		},
	})
}
