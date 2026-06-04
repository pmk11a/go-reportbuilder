package auth

// SLoginRequest is the authentication request payload
type SLoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// SLoginResponse is returned upon a successful login
type SLoginResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresAt    int64  `json:"expires_at"` // Unix timestamp (ms) when access_token expires
	SUser        SUser  `json:"user"`
}
