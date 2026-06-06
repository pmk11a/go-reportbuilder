package menu

// SMenuResponseItem is the JSON shape for a single node in the sidebar menu tree.
// Used by both the menu package (when building the tree) and the dashboard
// package (when caching and serving the response). Living in menu/ keeps the
// tree-building domain logic and its response shape co-located.
type SMenuResponseItem struct {
	Code        string                `json:"code"`
	Icon        string                `json:"icon"`
	Route       string                `json:"route"`
	TipeTrans   string                `json:"TipeTrans"`
	Title       string                `json:"title"`
	Type        string                `json:"type"`
	Items       []SMenuResponseItem   `json:"items,omitempty"`
	Permissions *SMenuPermissions     `json:"permissions,omitempty"`
}

// SMenuPermissions is the 6-flag granular permission set on a leaf menu node.
type SMenuPermissions struct {
	Access bool `json:"access"`
	Add    bool `json:"add"`
	Edit   bool `json:"edit"`
	Delete bool `json:"delete"`
	Print  bool `json:"print"`
	Export bool `json:"export"`
}
