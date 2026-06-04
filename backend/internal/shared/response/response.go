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
