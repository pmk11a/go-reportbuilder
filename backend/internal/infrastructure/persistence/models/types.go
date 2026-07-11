package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
)

// StringSlice is a []string stored as JSON in the DB.
// Handles '[]', '["a","b"]', and Laravel-style array strings like '[a,b]'.
type StringSlice []string

// Scan implements sql.Scanner.
func (s *StringSlice) Scan(value interface{}) error {
	if value == nil {
		*s = nil
		return nil
	}
	var raw string
	switch v := value.(type) {
	case string:
		raw = v
	case []byte:
		raw = string(v)
	default:
		return fmt.Errorf("cannot scan %T into StringSlice", value)
	}
	raw = strings.TrimSpace(raw)
	if raw == "" {
		*s = nil
		return nil
	}

	// Try JSON first
	var arr []string
	if err := json.Unmarshal([]byte(raw), &arr); err == nil {
		*s = arr
		return nil
	}

	// Laravel-style: [a,b,c] — strip brackets and split on commas
	if strings.HasPrefix(raw, "[") && strings.HasSuffix(raw, "]") {
		inner := strings.TrimSpace(raw[1 : len(raw)-1])
		if inner == "" {
			*s = []string{}
			return nil
		}
		parts := splitLaravelArray(inner)
		*s = parts
		return nil
	}

	// Fallback: treat as single-element
	*s = []string{raw}
	return nil
}

// Value implements driver.Valuer.
func (s StringSlice) Value() (driver.Value, error) {
	if s == nil {
		return nil, nil
	}
	if len(s) == 0 {
		return "[]", nil
	}
	b, err := json.Marshal(s)
	if err != nil {
		return nil, err
	}
	return string(b), nil
}

// MarshalJSON ensures null becomes [].
func (s StringSlice) MarshalJSON() ([]byte, error) {
	if s == nil {
		return []byte("[]"), nil
	}
	return json.Marshal([]string(s))
}

// JSONStringMap is a map[string]string stored as JSON.
type JSONStringMap map[string]string

// Scan implements sql.Scanner.
func (m *JSONStringMap) Scan(value interface{}) error {
	if value == nil {
		*m = nil
		return nil
	}
	var raw string
	switch v := value.(type) {
	case string:
		raw = v
	case []byte:
		raw = string(v)
	default:
		return fmt.Errorf("cannot scan %T into JSONStringMap", value)
	}
	raw = strings.TrimSpace(raw)
	if raw == "" || raw == "null" {
		*m = nil
		return nil
	}
	var mm map[string]string
	if err := json.Unmarshal([]byte(raw), &mm); err != nil {
		return errors.New("invalid JSON for JSONStringMap: " + err.Error())
	}
	*m = mm
	return nil
}

// Value implements driver.Valuer.
func (m JSONStringMap) Value() (driver.Value, error) {
	if m == nil {
		return nil, nil
	}
	if len(m) == 0 {
		return "{}", nil
	}
	b, err := json.Marshal(m)
	if err != nil {
		return nil, err
	}
	return string(b), nil
}

// MarshalJSON ensures null becomes {}.
func (m JSONStringMap) MarshalJSON() ([]byte, error) {
	if m == nil {
		return []byte("{}"), nil
	}
	return json.Marshal(map[string]string(m))
}

// ParentFilter defines a parent_filter entry from the dbbrowseconfigs table.
// Used by the JSONStringSlice scanner to validate structure.
type ParentFilter struct {
	SourceColumn string `json:"source_column"`
	Operator     string `json:"operator,omitempty"`
}

// JSONStringSlice is []ParentFilter stored as JSON (or array-of-objects JSON).
// Accepts either Laravel array form '[]' or JSON array of objects.
type JSONStringSlice []ParentFilter

// Scan implements sql.Scanner.
func (s *JSONStringSlice) Scan(value interface{}) error {
	if value == nil {
		*s = nil
		return nil
	}
	var raw string
	switch v := value.(type) {
	case string:
		raw = v
	case []byte:
		raw = string(v)
	default:
		return fmt.Errorf("cannot scan %T into JSONStringSlice", value)
	}
	raw = strings.TrimSpace(raw)
	if raw == "" || raw == "null" || raw == "[]" {
		*s = nil
		return nil
	}

	// Try JSON object form: [{"source_column":"...","operator":"="}]
	var arr []ParentFilter
	if err := json.Unmarshal([]byte(raw), &arr); err == nil {
		*s = arr
		return nil
	}

	// Try JSON object form: {"key":"val"}
	var mm map[string]string
	if err := json.Unmarshal([]byte(raw), &mm); err == nil {
		out := make([]ParentFilter, 0, len(mm))
		for k, v := range mm {
			_ = v
			out = append(out, ParentFilter{SourceColumn: k})
		}
		*s = out
		return nil
	}

	// Laravel-style: [a,b,c]
	if strings.HasPrefix(raw, "[") && strings.HasSuffix(raw, "]") {
		inner := strings.TrimSpace(raw[1 : len(raw)-1])
		if inner == "" {
			*s = nil
			return nil
		}
		parts := splitLaravelArray(inner)
		out := make([]ParentFilter, 0, len(parts))
		for _, p := range parts {
			out = append(out, ParentFilter{SourceColumn: p})
		}
		*s = out
		return nil
	}

	return fmt.Errorf("unrecognized parent_filters format: %s", raw)
}

// Value implements driver.Valuer.
func (s JSONStringSlice) Value() (driver.Value, error) {
	if s == nil {
		return nil, nil
	}
	if len(s) == 0 {
		return "[]", nil
	}
	b, err := json.Marshal(s)
	if err != nil {
		return nil, err
	}
	return string(b), nil
}

// MarshalJSON ensures null becomes [].
func (s JSONStringSlice) MarshalJSON() ([]byte, error) {
	if s == nil {
		return []byte("[]"), nil
	}
	return json.Marshal([]ParentFilter(s))
}

// splitLaravelArray splits "a,b,c" or "a,b' or quoted 'a','b'" on top-level commas.
func splitLaravelArray(s string) []string {
	var out []string
	var current strings.Builder
	inQuote := false
	for i := 0; i < len(s); i++ {
		ch := s[i]
		if ch == '\'' {
			inQuote = !inQuote
			continue
		}
		if ch == ',' && !inQuote {
			part := strings.TrimSpace(current.String())
			if part != "" {
				out = append(out, part)
			}
			current.Reset()
			continue
		}
		current.WriteByte(ch)
	}
	last := strings.TrimSpace(current.String())
	if last != "" {
		out = append(out, last)
	}
	return out
}