package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/dto"
	"github.com/masza1/dapen-backend/internal/models"
	"github.com/masza1/dapen-backend/internal/utils"
	"gorm.io/gorm"
)

type SDashboardHandler struct {
	db *gorm.DB
}

func NewDashboardHandler(database *gorm.DB) *SDashboardHandler {
	return &SDashboardHandler{db: database}
}


func (h *SDashboardHandler) GetSidebarMenu(c *gin.Context) {
	userIDFloat, exists := c.Get("user_id")
	if !exists {
		utils.Unauthorized(c, "SUser not authenticated")
		return
	}

	userIDVal, ok := userIDFloat.(float64)
	if !ok {
		utils.BadRequest(c, "Invalid user ID type in token")
		return
	}
	userID := uint(userIDVal)

	var user models.SUser
	if err := h.db.Preload("SDBFLPASS").First(&user, userID).Error; err != nil {
		utils.BadRequest(c, "SUser not found")
		return
	}

	legacyUserID := user.UserID
	if legacyUserID == "" {
		legacyUserID = "SA" // Fallback if UserID link is empty
	}

	// Fetch all flmenu permissions for the user to optimize queries (O(1) lookup inside recursion)
	var flmenus []models.SDbFlmenu
	h.db.Where("USERID = ?", legacyUserID).Find(&flmenus)
	flmenuMap := make(map[string]models.SDbFlmenu)
	for _, fl := range flmenus {
		flmenuMap[fl.L1] = fl
	}

	// Build menu tree recursively starting at level 0
	menuTree := buildMenuTree(h.db, legacyUserID, "", 0, flmenuMap)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"user_info": gin.H{
				"name":       user.FullName,
				"level":      "SA",
				"avatar":     "fas fa-user-circle",
				"department": "N/A",
				"position":   "N/A",
			},
			"menu_items": menuTree,
			"timestamp":  time.Now().Format(time.RFC3339),
		},
	})
}

func buildMenuTree(database *gorm.DB, userID string, parentCode string, level int, flmenuMap map[string]models.SDbFlmenu) []dto.SMenuResponseItem {
	var dbMenus []models.SDbMenu
	query := database.Where("L0 = ?", level)
	if parentCode != "" {
		query = query.Where("KODEMENU LIKE ?", parentCode+"%")
	}

	if userID != "SA" {
		query = query.Joins("JOIN dbflmenu ON dbflmenu.L1 = dbmenu.KODEMENU").
			Where("dbflmenu.USERID = ? AND dbflmenu.HASACCESS = 1", userID)
	}

	if err := query.Order("KODEMENU").Find(&dbMenus).Error; err != nil {
		return nil
	}

	var items []dto.SMenuResponseItem
	for _, item := range dbMenus {
		// Get children recursively
		children := buildMenuTree(database, userID, item.KODEMENU, level+1, flmenuMap)

		menuItem := dto.SMenuResponseItem{
			Code:      item.KODEMENU,
			Icon:      item.Icon,
			Title:     item.Keterangan,
		}
		if item.Routename != nil {
			menuItem.Route = *item.Routename
		}
		if item.TipeTrans != nil {
			menuItem.TipeTrans = *item.TipeTrans
		}

		if len(children) > 0 {
			menuItem.Type = "group"
			menuItem.Items = children
		} else {
			menuItem.Type = "item"
			var permissions dto.SMenuPermissions
			if userID == "SA" {
				permissions = dto.SMenuPermissions{
					Access: true,
					Add:    true,
					Edit:   true,
					Delete: true,
					Print:  true,
					Export: true,
				}
			} else {
				if fl, ok := flmenuMap[item.KODEMENU]; ok {
					permissions = dto.SMenuPermissions{
						Access: fl.HASACCESS,
						Add:    fl.ISTAMBAH,
						Edit:   fl.ISKOREKSI,
						Delete: fl.ISHAPUS,
						Print:  fl.ISCETAK,
						Export: fl.ISEXPORT,
					}
				} else {
					permissions = dto.SMenuPermissions{
						Access: false,
						Add:    false,
						Edit:   false,
						Delete: false,
						Print:  false,
						Export: false,
					}
				}
			}
			menuItem.Permissions = &permissions
		}
		items = append(items, menuItem)
	}
	return items
}

func (h *SDashboardHandler) GetStats(c *gin.Context) {
	currentYear := time.Now().Year()
	lastYear := currentYear - 1
	nextYear := currentYear + 1

	// 1. Retiring current year (55 years old)
	var retiringThisYear int64
	if err := h.db.Raw("SELECT COUNT(*) FROM DBCUSTSUPP WHERE YEAR(DATEADD(YEAR, 55, TglLahir)) = ?", currentYear).Scan(&retiringThisYear).Error; err != nil {
		utils.InternalError(c, fmt.Sprintf("Query retiring current year failed: %v", err))
		return
	}

	// 2. Retiring last year
	var retiringLastYear int64
	if err := h.db.Raw("SELECT COUNT(*) FROM DBCUSTSUPP WHERE YEAR(DATEADD(YEAR, 55, TglLahir)) = ?", lastYear).Scan(&retiringLastYear).Error; err != nil {
		utils.InternalError(c, fmt.Sprintf("Query retiring last year failed: %v", err))
		return
	}

	// 3. Retiring next year
	var retiringNextYear int64
	if err := h.db.Raw("SELECT COUNT(*) FROM DBCUSTSUPP WHERE YEAR(DATEADD(YEAR, 55, TglLahir)) = ?", nextYear).Scan(&retiringNextYear).Error; err != nil {
		utils.InternalError(c, fmt.Sprintf("Query retiring next year failed: %v", err))
		return
	}

	// 4. Total active (haven't reached 55 and JENIS = 3)
	var totalActive int64
	if err := h.db.Raw("SELECT COUNT(*) FROM DBCUSTSUPP WHERE YEAR(DATEADD(YEAR, 55, TglLahir)) > ? AND JENIS = 3", currentYear).Scan(&totalActive).Error; err != nil {
		utils.InternalError(c, fmt.Sprintf("Query active current year failed: %v", err))
		return
	}

	// 5. Total active last year
	var totalActiveLastYear int64
	if err := h.db.Raw("SELECT COUNT(*) FROM DBCUSTSUPP WHERE YEAR(DATEADD(YEAR, 55, TglLahir)) > ? AND JENIS = 3", lastYear).Scan(&totalActiveLastYear).Error; err != nil {
		utils.InternalError(c, fmt.Sprintf("Query active last year failed: %v", err))
		return
	}

	// 6. Total active next year
	var totalActiveNextYear int64
	if err := h.db.Raw("SELECT COUNT(*) FROM DBCUSTSUPP WHERE YEAR(DATEADD(YEAR, 55, TglLahir)) > ? AND JENIS = 3", nextYear).Scan(&totalActiveNextYear).Error; err != nil {
		utils.InternalError(c, fmt.Sprintf("Query active next year failed: %v", err))
		return
	}

	// 7. Total retired (JENIS = 2)
	var totalRetired int64
	if err := h.db.Raw("SELECT COUNT(*) FROM DBCUSTSUPP WHERE JENIS = 2").Scan(&totalRetired).Error; err != nil {
		utils.InternalError(c, fmt.Sprintf("Query total retired failed: %v", err))
		return
	}

	utils.Success(c, "Main statistics retrieved successfully", gin.H{
		"total_active":          totalActive,
		"total_retired":         totalRetired,
		"active_current_year":   totalActive,
		"active_last_year":      totalActiveLastYear,
		"active_next_year":      totalActiveNextYear,
		"retiring_current_year": retiringThisYear,
		"retiring_last_year":    retiringLastYear,
		"retiring_next_year":    retiringNextYear,
		"current_year":          currentYear,
		"last_year":             lastYear,
		"next_year":             nextYear,
	})
}

func (h *SDashboardHandler) GetPensiunanWithoutFiles(c *gin.Context) {
	// 1. Get total count for pagination
	var total int64
	countQuery := `
		SELECT COUNT(*)
		FROM DBCUSTSUPP c
		LEFT JOIN dbemployeefile f ON f.KodeCustSupp = c.KODECUSTSUPP
		WHERE c.JENIS = 2
		AND f.id IS NULL
	`
	if err := h.db.Raw(countQuery).Scan(&total).Error; err != nil {
		utils.InternalError(c, fmt.Sprintf("Query total pensiunan without files failed: %v", err))
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
	var rawData []dto.SRawPensiunan
	query := `
		SELECT
			c.KODECUSTSUPP,
			c.NAMACUSTSUPP,
			NULL AS NoPegawai,
			c.TglLahir,
			c.TglPensiun,
			c.TglKepersertaan
		FROM DBCUSTSUPP c
		LEFT JOIN dbemployeefile f ON f.KodeCustSupp = c.KODECUSTSUPP
		WHERE c.JENIS = 2
		AND f.id IS NULL
		ORDER BY c.NAMACUSTSUPP ASC
		OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
	`

	if err := h.db.Raw(query, offset, limit).Scan(&rawData).Error; err != nil {
		utils.InternalError(c, fmt.Sprintf("Query pensiunan without files failed: %v", err))
		return
	}

	// Format dates properly to YYYY-MM-DD
	formattedData := make([]dto.SPensiunanWithoutFiles, len(rawData))
	for i, item := range rawData {
		formattedData[i] = dto.SPensiunanWithoutFiles{
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

	utils.Success(c, "Pensiunan without files retrieved successfully", gin.H{
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
