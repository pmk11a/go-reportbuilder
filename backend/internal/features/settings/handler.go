package settings

import (
	"errors"

	"github.com/masza1/dapen-backend/internal/infrastructure/response"
	"github.com/masza1/dapen-backend/internal/infrastructure/config"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// SSettingHandler is the HTTP front for the settings feature. It is
// intentionally thin — the actual business logic lives in *Service.
type SSettingHandler struct {
	db      *gorm.DB
	service *Service
	cfg     *config.SConfig
}

func NewSettingHandler(db *gorm.DB, cfg *config.SConfig) *SSettingHandler {
	return &SSettingHandler{
		db:      db,
		service: NewService(db),
		cfg:     cfg,
	}
}

func (h *SSettingHandler) DB() *gorm.DB { return h.db }
func (h *SSettingHandler) Service() *Service { return h.service }

// GenerateNoBukti godoc
// @Summary Preview next document number for a transaction type
// @Description Returns the next BKK/BKM/etc. number composed from DBNOMOR's
// @Description FORMAT1..4, PEMISAH and Reset settings. The counter is NOT
// @Description committed unless /commit-counter is called afterwards.
// @Tags Admin Settings
// @Accept json
// @Produce json
// @Param jns query string true "Transaction type code (BKK, BKM, BBM, BBK, BMM, BJK, PJL, PBL, ...)"
// @Param tahun query int true "Accounting year (e.g. 2026)"
// @Param bulan query int true "Accounting month 1–12"
// @Success 200 {object} GenerateNoBuktiResult
// @Router /api/admin/settings/generate-no-bukti [get]
func (h *SSettingHandler) GenerateNoBukti(c *gin.Context) {
	jns := c.Query("jns")
	tahunStr := c.Query("tahun")
	bulanStr := c.Query("bulan")

	if jns == "" || tahunStr == "" || bulanStr == "" {
		response.BadRequest(c, "jns, tahun and bulan are required")
		return
	}

	tahun, err := parseInt(tahunStr)
	if err != nil {
		response.BadRequest(c, "tahun must be numeric")
		return
	}
	bulan, err := parseInt(bulanStr)
	if err != nil {
		response.BadRequest(c, "bulan must be numeric")
		return
	}
	if bulan < 1 || bulan > 12 {
		response.BadRequest(c, "bulan must be 1..12")
		return
	}

	res, err := h.service.GenerateNoBukti(jns, tahun, bulan)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, "Success", res)
}

// CommitCounter godoc
// @Summary Persist a new counter after a document has been saved
// @Tags Admin Settings
// @Accept json
// @Produce json
// @Param body body CommitCounterRequest true "Counter update"
// @Success 200 {object} map[string]interface{}
// @Router /api/admin/settings/commit-counter [post]
func (h *SSettingHandler) CommitCounter(c *gin.Context) {
	var body CommitCounterRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	if body.Jns == "" || body.NewCounter == "" {
		response.BadRequest(c, "jns and newCounter are required")
		return
	}
	if err := h.service.CommitCounter(body.Jns, body.NewCounter); err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, "Counter committed", nil)
}

type CommitCounterRequest struct {
	Jns        string `json:"jns"`
	NewCounter string `json:"newCounter"`
}

// GetFeatures godoc
// @Summary Get application feature flags
// @Tags Admin Settings
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/admin/settings/features [get]
func (h *SSettingHandler) GetFeatures(c *gin.Context) {
	response.Success(c, "Success", gin.H{
		"enableGiro":     h.cfg.EnableGiroFeature,
		"enableDeposito": h.cfg.EnableDepositoFeature,
	})
}

// Helper kept here (not exported) to avoid pulling strconv into the
// feature's surface area.
func parseInt(s string) (int, error) {
	n := 0
	for _, r := range s {
		if r < '0' || r > '9' {
			if n == 0 && r == '-' {
				return 0, errors.New("negative not allowed")
			}
			return 0, errors.New("not a number")
		}
		n = n*10 + int(r-'0')
	}
	return n, nil
}
