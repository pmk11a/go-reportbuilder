package session

// SListSessionsResponse wraps a list of sessions for the HTTP response.
type SListSessionsResponse struct {
	Sessions []SSessionInfo `json:"sessions"`
}

// SRevokeSessionResponse wraps the result of a session revocation.
type SRevokeSessionResponse struct {
	Message string `json:"message"`
}

// SRevokeAllSessionsResponse wraps the result of a bulk revocation.
type SRevokeAllSessionsResponse struct {
	Message      string `json:"message"`
	RevokedCount int    `json:"revoked_count"`
}
