// Package kasbank — HTTP handler for Accounting > Kas Bank.
//
// Every handler is a thin wrapper that:
//  1. Parses the request (path params, query string, JSON body).
//  2. Calls the service.
//  3. Translates the result (or error) into the standard envelope
//     { success, status, message, data } via response.* helpers.
//
// Permission checks live in routes.go (RequireMenuAccess middleware),
// not in the handler — the handler trusts that the middleware has
// already authorised the call.
package kasbank

import (
	"errors"
	"fmt"
	"io"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/infrastructure/response"
)

// UserIDContextKey is the typed key used to read the userID injected by
// middleware.InjectUserContext. We duplicate the constant here to avoid
// importing the middleware package (which would create a cycle via routes).
const userIDContextKey = "userID"

// SKasBankHandler is the HTTP layer for the kasbank sub-domain.
type SKasBankHandler struct {
	svc IKasBankService
}

// NewSKasBankHandler constructs the handler with its service dependency.
func NewSKasBankHandler(svc IKasBankService) *SKasBankHandler {
	return &SKasBankHandler{svc: svc}
}

// userIDFromContext extracts the userID injected by InjectUserContext.
// Returns empty string when missing — the service treats that as a 401.
func userIDFromContext(c *gin.Context) string {
	if v, ok := c.Get(userIDContextKey); ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	if v := c.Request.Context().Value(userIDContextKey); v != nil {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

// ListKasBank godoc
// @Summary List Kas/Bank Vouchers
// @Description Paginated list of journal headers with optional filters. When
// @Description dateFrom/dateTo are omitted, the list defaults to the caller's
// @Description active accounting period (DBPERIODE).
// @Tags AccountingKasBank
// @Produce json
// @Param tipe query string false "Filter by TipeTransHd (BKM/BKK/BBM/BBK)"
// @Param search query string false "Substring match on NoBukti or Note"
// @Param dateFrom query string false "Inclusive lower bound of Tanggal (YYYY-MM-DD)"
// @Param dateTo query string false "Inclusive upper bound of Tanggal (YYYY-MM-DD)"
// @Param page query int false "Page Number" default(1)
// @Param perPage query int false "Per page" default(10)
// @Param sortBy query string false "Sort column" default(Tanggal)
// @Param sortDir query string false "Sort direction" default(desc)
// @Success 200 {object} SListKasBankResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /api/accounting/kasbank [get]
func (h *SKasBankHandler) ListKasBank(c *gin.Context) {
	var q SListKasBankQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		response.BadRequest(c, "Invalid query parameters: "+err.Error())
		return
	}
	if q.Tipe != "" && !ValidTipeTrans(strings.ToUpper(q.Tipe)) {
		response.BadRequest(c, "Invalid tipe; expected BKM/BKK/BBM/BBK")
		return
	}
	q.Tipe = strings.ToUpper(q.Tipe)
	q.UserID = userIDFromContext(c)
	out, err := h.svc.List(c.Request.Context(), q)
	if err != nil {
		response.InternalError(c, "Failed to list kas bank: "+err.Error())
		return
	}
	response.Success(c, "Kas/Bank list retrieved successfully", out)
}

// GetKasBank godoc
// @Summary Get Kas/Bank Voucher
// @Description Fetch a single journal header with pre-computed totals
// @Tags AccountingKasBank
// @Produce json
// @Param noBukti path string true "Voucher number"
// @Success 200 {object} SKasBankHeader
// @Failure 404 {object} map[string]interface{}
// @Security BearerAuth
// @Router /api/accounting/kasbank/{noBukti} [get]
func (h *SKasBankHandler) GetKasBank(c *gin.Context) {
	noBukti := c.Query("noBukti")
	header, _, err := h.svc.GetByNoBukti(c.Request.Context(), noBukti)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			response.NotFound(c, "Kas/Bank voucher not found")
			return
		}
		response.InternalError(c, "Failed to fetch kas bank: "+err.Error())
		return
	}
	response.Success(c, "Kas/Bank voucher retrieved successfully", header)
}

// CreateKasBank godoc
// @Summary Create Kas/Bank Voucher
// @Description Create a new journal header with optional detail rows
// @Tags AccountingKasBank
// @Accept json
// @Produce json
// @Param request body SCreateKasBankRequest true "Voucher payload"
// @Success 201 {object} SDbTrans
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /api/accounting/kasbank [post]
func (h *SKasBankHandler) CreateKasBank(c *gin.Context) {
	var req SCreateKasBankRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body: "+err.Error())
		return
	}
	uid := userIDFromContext(c)
	header, err := h.svc.CreateHeader(c.Request.Context(), uid, req)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	response.Created(c, "Kas/Bank voucher created successfully", header)
}

// UpdateKasBank godoc
// @Summary Update Kas/Bank Voucher
// @Description Replace an existing journal header (and optionally its details)
// @Tags AccountingKasBank
// @Accept json
// @Produce json
// @Param noBukti path string true "Voucher number"
// @Param request body SUpdateKasBankRequest true "Updated voucher payload"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Security BearerAuth
// @Router /api/accounting/kasbank/{noBukti} [put]
func (h *SKasBankHandler) UpdateKasBank(c *gin.Context) {
	noBukti := c.Query("noBukti")
	var req SUpdateKasBankRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body: "+err.Error())
		return
	}
	if err := h.svc.UpdateHeader(c.Request.Context(), noBukti, req); err != nil {
		writeServiceError(c, err)
		return
	}
	response.Success(c, "Kas/Bank voucher updated successfully", gin.H{"nobukti": noBukti})
}

// DeleteKasBank godoc
// @Summary Delete Kas/Bank Voucher
// @Description Remove a journal header and cascade its detail rows
// @Tags AccountingKasBank
// @Produce json
// @Param noBukti path string true "Voucher number"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Security BearerAuth
// @Router /api/accounting/kasbank/{noBukti} [delete]
func (h *SKasBankHandler) DeleteKasBank(c *gin.Context) {
	noBukti := c.Query("noBukti")
	if err := h.svc.DeleteHeader(c.Request.Context(), noBukti); err != nil {
		writeServiceError(c, err)
		return
	}
	response.Success(c, "Kas/Bank voucher deleted successfully", nil)
}

// ListKasBankDetail godoc
// @Summary List Detail Rows
// @Description All DBTRANSAKSI rows for a given NoBukti, ordered by Urut
// @Tags AccountingKasBank
// @Produce json
// @Param noBukti path string true "Voucher number"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Security BearerAuth
// @Router /api/accounting/kasbank/{noBukti}/detail [get]
func (h *SKasBankHandler) ListKasBankDetail(c *gin.Context) {
	noBukti := c.Query("noBukti")
	header, details, err := h.svc.GetByNoBukti(c.Request.Context(), noBukti)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	response.Success(c, "Detail rows retrieved successfully", gin.H{
		"header":  header,
		"details": details,
	})
}

// GetKasBankDetail godoc
// @Summary Get Single Detail Row
// @Description Fetch a single detail row by Urut
// @Tags AccountingKasBank
// @Produce json
// @Param noBukti path string true "Voucher number"
// @Param urut path int true "Detail sequence number"
// @Success 200 {object} SDbTransaksi
// @Failure 404 {object} map[string]interface{}
// @Security BearerAuth
// @Router /api/accounting/kasbank/{noBukti}/detail/{urut} [get]
func (h *SKasBankHandler) GetKasBankDetail(c *gin.Context) {
	noBukti := c.Query("noBukti")
	urut, err := strconv.Atoi(c.Param("urut"))
	if err != nil {
		response.BadRequest(c, "Invalid urut parameter")
		return
	}
	// Reuse GetByNoBukti + filter to avoid a new service method just for
	// one row. The service already does the right thing.
	_, details, err := h.svc.GetByNoBukti(c.Request.Context(), noBukti)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	for i := range details {
		if details[i].Urut == urut {
			response.Success(c, "Detail row retrieved successfully", details[i])
			return
		}
	}
	response.NotFound(c, "Detail row not found")
}

// AddKasBankDetail godoc
// @Summary Add Detail Row
// @Description Append a journal line; auto-assigns Urut = max+1
// @Tags AccountingKasBank
// @Accept json
// @Produce json
// @Param noBukti path string true "Voucher number"
// @Param request body SDetailInput true "Detail row payload"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Security BearerAuth
// @Router /api/accounting/kasbank/{noBukti}/detail [post]
func (h *SKasBankHandler) AddKasBankDetail(c *gin.Context) {
	noBukti := c.Query("noBukti")
	var d SDetailInput
	if err := c.ShouldBindJSON(&d); err != nil {
		response.BadRequest(c, "Invalid detail body: "+err.Error())
		return
	}
	if err := h.svc.AddDetail(c.Request.Context(), noBukti, d); err != nil {
		writeServiceError(c, err)
		return
	}
	response.Created(c, "Detail row added successfully", gin.H{"nobukti": noBukti})
}

// UpdateKasBankDetail godoc
// @Summary Update Detail Row
// @Description Replace a single detail row and re-validate double-entry
// @Tags AccountingKasBank
// @Accept json
// @Produce json
// @Param noBukti path string true "Voucher number"
// @Param urut path int true "Detail sequence number"
// @Param request body SDetailInput true "Updated detail row payload"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Security BearerAuth
// @Router /api/accounting/kasbank/{noBukti}/detail/{urut} [put]
func (h *SKasBankHandler) UpdateKasBankDetail(c *gin.Context) {
	noBukti := c.Query("noBukti")
	urut, err := strconv.Atoi(c.Param("urut"))
	if err != nil {
		response.BadRequest(c, "Invalid urut parameter")
		return
	}
	var d SDetailInput
	if err := c.ShouldBindJSON(&d); err != nil {
		response.BadRequest(c, "Invalid detail body: "+err.Error())
		return
	}
	if err := h.svc.UpdateDetail(c.Request.Context(), noBukti, urut, d); err != nil {
		writeServiceError(c, err)
		return
	}
	response.Success(c, "Detail row updated successfully", gin.H{"nobukti": noBukti, "urut": urut})
}

// DeleteKasBankDetail godoc
// @Summary Delete Detail Row
// @Description Remove a single detail row
// @Tags AccountingKasBank
// @Produce json
// @Param noBukti path string true "Voucher number"
// @Param urut path int true "Detail sequence number"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Security BearerAuth
// @Router /api/accounting/kasbank/{noBukti}/detail/{urut} [delete]
func (h *SKasBankHandler) DeleteKasBankDetail(c *gin.Context) {
	noBukti := c.Query("noBukti")
	urut, err := strconv.Atoi(c.Param("urut"))
	if err != nil {
		response.BadRequest(c, "Invalid urut parameter")
		return
	}
	if err := h.svc.DeleteDetail(c.Request.Context(), noBukti, urut); err != nil {
		writeServiceError(c, err)
		return
	}
	response.Success(c, "Detail row deleted successfully", gin.H{"nobukti": noBukti, "urut": urut})
}

// SetOtorisasiKasBank godoc
// @Summary Set Otorisasi
// @Description Set IsOtorisasiN=1 for the given level (1 to 5). Level N
// @Description requires level N-1 already approved, and the approver of
// @Description level N must differ from the approver of level N-1.
// @Tags AccountingKasBank
// @Accept json
// @Produce json
// @Param noBukti path string true "Voucher number"
// @Param request body SOtorisasiRequest true "Authorization payload"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Security BearerAuth
// @Router /api/accounting/kasbank/{noBukti}/otorisasi [post]
func (h *SKasBankHandler) SetOtorisasiKasBank(c *gin.Context) {
	noBukti := c.Query("noBukti")
	var req SOtorisasiRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body: "+err.Error())
		return
	}
	uid := userIDFromContext(c)
	if err := h.svc.SetOtorisasi(c.Request.Context(), noBukti, req.Level, uid); err != nil {
		writeServiceError(c, err)
		return
	}
	response.Success(c, "Otorisasi set successfully", gin.H{"nobukti": noBukti, "level": req.Level})
}

// BatalOtorisasiKasBank godoc
// @Summary Cancel Otorisasi
// @Description Clear IsOtorisasiN for the given level (1 to 5). Rejected
// @Description when level N+1 is already approved.
// @Tags AccountingKasBank
// @Accept json
// @Produce json
// @Param noBukti path string true "Voucher number"
// @Param request body SOtorisasiRequest true "Authorization payload"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Security BearerAuth
// @Router /api/accounting/kasbank/{noBukti}/batal-otorisasi [post]
func (h *SKasBankHandler) BatalOtorisasiKasBank(c *gin.Context) {
	noBukti := c.Query("noBukti")
	var req SOtorisasiRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body: "+err.Error())
		return
	}
	if err := h.svc.CancelOtorisasi(c.Request.Context(), noBukti, req.Level); err != nil {
		writeServiceError(c, err)
		return
	}
	response.Success(c, "Otorisasi cancelled successfully", gin.H{"nobukti": noBukti, "level": req.Level})
}

// GenerateNoBukti godoc
// @Summary Generate NoBukti
// @Description Atomically generate a fresh voucher number for the given tipe
// @Tags AccountingKasBank
// @Produce json
// @Param tipe query string true "Tipe voucher (BKM/BKK/BBM/BBK)"
// @Success 200 {object} SGenerateNoBuktiResponse
// @Failure 400 {object} map[string]interface{}
// @Security BearerAuth
// @Router /api/accounting/kasbank/generate-no-bukti [get]
func (h *SKasBankHandler) GenerateNoBukti(c *gin.Context) {
	tipe := strings.ToUpper(c.Query("tipe"))
	if !ValidTipeTrans(tipe) {
		response.BadRequest(c, "Invalid tipe; expected BKM/BKK/BBM/BBK")
		return
	}
	uid := userIDFromContext(c)
	out, err := h.svc.GenerateNoBukti(c.Request.Context(), tipe, uid)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	response.Success(c, "NoBukti generated successfully", out)
}

// LookupPerkiraan godoc
// @Summary Lookup Perkiraan
// @Description Substring autocomplete over DBPERKIRAAN (used by the detail form)
// @Tags AccountingKasBank
// @Produce json
// @Param q query string false "Substring match on Perkiraan or Keterangan"
// @Param kelompokKas query bool false "Restrict to cash/bank groups"
// @Param limit query int false "Max rows" default(50)
// @Success 200 {object} SKasBankLookupPerkiraanResponse
// @Security BearerAuth
// @Router /api/accounting/kasbank/lookup-perkiraan [get]
func (h *SKasBankHandler) LookupPerkiraan(c *gin.Context) {
	var q SLookupPerkiraanQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		response.BadRequest(c, "Invalid query parameters: "+err.Error())
		return
	}
	out, err := h.svc.LookupPerkiraan(c.Request.Context(), q)
	if err != nil {
		response.InternalError(c, "Lookup failed: "+err.Error())
		return
	}
	response.Success(c, "Lookup perkiraan retrieved successfully", out)
}

// DownloadPDF godoc
// @Summary Download PDF Voucher
// @Description Render the voucher to PDF and stream the bytes back
// @Tags AccountingKasBank
// @Produce application/pdf
// @Param noBukti path string true "Voucher number"
// @Success 200 {file} file
// @Failure 404 {object} map[string]interface{}
// @Security BearerAuth
// @Router /api/accounting/kasbank/{noBukti}/pdf [get]
func (h *SKasBankHandler) DownloadPDF(c *gin.Context) {
	noBukti := c.Query("noBukti")
	header, details, err := h.svc.GetByNoBukti(c.Request.Context(), noBukti)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	reader, err := GenerateKasBankPDF(header, details)
	if err != nil {
		response.InternalError(c, "Failed to render PDF: "+err.Error())
		return
	}
	filename := fmt.Sprintf("kasbank-%s.pdf", time.Now().Format("20060102-150405"))
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Header("Content-Type", "application/pdf")
	// Stream the PDF bytes back to the client via io.Copy.
	if _, err := io.Copy(c.Writer, reader); err != nil {
		response.InternalError(c, "Failed to stream PDF: "+err.Error())
		return
	}
}

// writeServiceError maps a service-level sentinel to the right HTTP code.
// Anything not matched is treated as 500 Internal Error.
func writeServiceError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, ErrNotFound):
		response.NotFound(c, err.Error())
	case errors.Is(err, ErrTanggalDiLuarPeriode),
		errors.Is(err, ErrTanggalInvalid),
		errors.Is(err, ErrTipeInvalid),
		errors.Is(err, ErrNoBuktiEmpty),
		errors.Is(err, ErrPeriodeNotSet),
		errors.Is(err, ErrLockedByOtorisasi1),
		errors.Is(err, ErrLockedByOtorisasi2),
		errors.Is(err, ErrDoubleEntryUnbalanced),
		errors.Is(err, ErrSelfOtorisasi),
		errors.Is(err, ErrDetailRequired),
		errors.Is(err, ErrDetailUrutConflict),
		errors.Is(err, ErrOtorisasiLevelInvalid),
		errors.Is(err, ErrOtorisasiPrevLevelMissing),
		errors.Is(err, ErrOtorisasiNextLevelSet):
		response.BadRequest(c, err.Error())
	default:
		response.InternalError(c, err.Error())
	}
}
