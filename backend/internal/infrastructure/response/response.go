package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// SResponse defines the standard JSON response structure for the enterprise.
type SResponse struct {
	Success bool        `json:"success"`
	Status  int         `json:"status"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

// JSON sends a standardized JSON response.
func JSON(c *gin.Context, status int, success bool, message string, data interface{}) {
	c.JSON(status, SResponse{
		Success: success,
		Status:  status,
		Message: message,
		Data:    data,
	})
}

// Success sends a 200 OK success response.
func Success(c *gin.Context, message string, data interface{}) {
	JSON(c, http.StatusOK, true, message, data)
}

// Created sends a 201 Created success response.
func Created(c *gin.Context, message string, data interface{}) {
	JSON(c, http.StatusCreated, true, message, data)
}

// Error sends a generic error response.
func Error(c *gin.Context, status int, message string) {
	JSON(c, status, false, message, nil)
}

// BadRequest sends a 400 Bad Request error response.
func BadRequest(c *gin.Context, message string) {
	Error(c, http.StatusBadRequest, message)
}

// Unauthorized sends a 401 Unauthorized error response.
func Unauthorized(c *gin.Context, message string) {
	Error(c, http.StatusUnauthorized, message)
}

// Forbidden sends a 403 Forbidden error response.
func Forbidden(c *gin.Context, message string) {
	Error(c, http.StatusForbidden, message)
}

// NotFound sends a 404 Not Found error response.
func NotFound(c *gin.Context, message string) {
	Error(c, http.StatusNotFound, message)
}

// InternalError sends a 500 Internal Server Error response.
func InternalError(c *gin.Context, message string) {
	Error(c, http.StatusInternalServerError, message)
}

// SErrorMap adalah struktur error_map standar Mamorasoft (4 field) yang WAJIB
// disertakan pada semua response error non-validasi. Bahasa: code English,
// error_name/reason/action Bahasa Indonesia.
//
// Contoh payload:
//
//	{
//	  "error_map": {
//	    "code": "EID_NOT_FOUND",
//	    "error_name": "User Tidak Ditemukan",
//	    "reason": "User dengan ID tersebut tidak ada dalam sistem.",
//	    "action": "Periksa kembali ID user atau muat ulang daftar user."
//	  }
//	}
type SErrorMap struct {
	Code      string `json:"code"`       // Identifier UPPER_SNAKE_CASE (English)
	ErrorName string `json:"error_name"` // Judul singkat untuk UI (Indonesia)
	Reason    string `json:"reason"`     // Penjelasan mengapa error terjadi (Indonesia)
	Action    string `json:"action"`     // Langkah konkret yang bisa dilakukan user (Indonesia)
}

// SErrorResponse memperluas SResponse dengan field error_map. Dipakai untuk
// semua error non-validasi sehingga frontend bisa menampilkan reason + action
// yang ramah pengguna (lihat RULES.md §3).
type SErrorResponse struct {
	Success  bool        `json:"success"`
	Status   int         `json:"status"`
	Message  string      `json:"message,omitempty"`
	Data     interface{} `json:"data,omitempty"`
	ErrorMap *SErrorMap  `json:"error_map,omitempty"`
}

// ErrorWithMap mengirim response error generic dengan 4-field error_map.
// message adalah ringkasan singkat (English) yang aman untuk logging, sedangkan
// ErrorMap memberikan reason + action yang user-facing (Indonesia).
func ErrorWithMap(c *gin.Context, status int, message string, em SErrorMap) {
	c.JSON(status, SErrorResponse{
		Success:  false,
		Status:   status,
		Message:  message,
		ErrorMap: &em,
	})
}

// BadRequestWithMap mengirim 400 + error_map untuk kesalahan input non-validasi
// (mis. resource state conflict yang tidak bisa ditangkap validator).
func BadRequestWithMap(c *gin.Context, message string, em SErrorMap) {
	ErrorWithMap(c, http.StatusBadRequest, message, em)
}

// UnauthorizedWithMap mengirim 401 + error_map untuk kesalahan autentikasi.
func UnauthorizedWithMap(c *gin.Context, message string, em SErrorMap) {
	ErrorWithMap(c, http.StatusUnauthorized, message, em)
}

// ForbiddenWithMap mengirim 403 + error_map untuk permission denial.
func ForbiddenWithMap(c *gin.Context, message string, em SErrorMap) {
	ErrorWithMap(c, http.StatusForbidden, message, em)
}

// NotFoundWithMap mengirim 404 + error_map. Contoh umum: user/resource dengan
// ID legacy (DBFLPASS.USERID) atau numeric ID tidak ditemukan.
func NotFoundWithMap(c *gin.Context, message string, em SErrorMap) {
	ErrorWithMap(c, http.StatusNotFound, message, em)
}

// ConflictWithMap mengirim 409 + error_map untuk duplicate entry / state conflict.
func ConflictWithMap(c *gin.Context, message string, em SErrorMap) {
	ErrorWithMap(c, http.StatusConflict, message, em)
}

// InternalErrorWithMap mengirim 500 + error_map untuk kesalahan server.
// reason + action diisi generic; pesan spesifik ditulis ke log (bukan ke user).
func InternalErrorWithMap(c *gin.Context, message string, em SErrorMap) {
	ErrorWithMap(c, http.StatusInternalServerError, message, em)
}

// SPaginationMeta represents pagination metadata
type SPaginationMeta struct {
	CurrentPage int   `json:"current_page"`
	PerPage     int   `json:"per_page"`
	Total       int64 `json:"total"`
	LastPage    int   `json:"last_page"`
}

// SPaginatedResponse wraps data with pagination metadata
type SPaginatedResponse struct {
	Data       interface{}    `json:"data"`
	Pagination SPaginationMeta `json:"pagination"`
}

// NewPaginatedResponse creates a new SPaginatedResponse
func NewPaginatedResponse(data interface{}, total int64, page, limit int) *SPaginatedResponse {
	lastPage := int((total + int64(limit) - 1) / int64(limit))
	if lastPage < 1 {
		lastPage = 1
	}

	return &SPaginatedResponse{
		Data: data,
		Pagination: SPaginationMeta{
			CurrentPage: page,
			PerPage:     limit,
			Total:       total,
			LastPage:    lastPage,
		},
	}
}
