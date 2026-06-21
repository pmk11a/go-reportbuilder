package user

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestGetDynamicRole_AdminRoleAlwaysWins verifies that SUser.Role == RoleAdmin
// is the source of truth and short-circuits any SDBFLPASS.TINGKAT value,
// including a stale "0" (karyawan) row — the TASK-020 root cause.
func TestGetDynamicRole_AdminRoleAlwaysWins(t *testing.T) {
	tests := []struct {
		name    string
		tingkat string
	}{
		{"stale TINGKAT 0 (karyawan)", "0"},
		{"TINGKAT 1 (pengurus)", "1"},
		{"TINGKAT 2 (admin, matches)", "2"},
		{"TINGKAT 5 (system_admin)", "5"},
		{"unmapped/garbage TINGKAT", "99"},
		{"empty TINGKAT", ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			u := &SUser{
				Role: RoleAdmin,
				SDBFLPASS: &SDBFLPASS{
					USERID:  "SA",
					TINGKAT: tt.tingkat,
				},
			}

			assert.Equal(t, "admin", u.GetDynamicRole())
		})
	}
}

// TestGetDynamicRole_AdminRoleWithNilDBFLPASS verifies that a user with no
// linked legacy DBFLPASS record (e.g. a new account) still resolves to
// "admin" purely from the Role field, without panicking on the nil pointer.
func TestGetDynamicRole_AdminRoleWithNilDBFLPASS(t *testing.T) {
	u := &SUser{
		Role:      RoleAdmin,
		SDBFLPASS: nil,
	}

	assert.NotPanics(t, func() {
		assert.Equal(t, "admin", u.GetDynamicRole())
	})
}

// TestGetDynamicRole_NonAdminRoleFallsBackToTingkat verifies that when Role
// is NOT admin, the legacy TINGKAT mapping decides the dynamic role.
func TestGetDynamicRole_NonAdminRoleFallsBackToTingkat(t *testing.T) {
	tests := []struct {
		name         string
		tingkat      string
		expectedRole string
	}{
		{"TINGKAT 0 -> karyawan", "0", "karyawan"},
		{"TINGKAT 1 -> pengurus", "1", "pengurus"},
		{"TINGKAT 2 -> admin (legacy mapping)", "2", "admin"},
		{"TINGKAT 5 -> system_admin", "5", "system_admin"},
		{"unmapped TINGKAT -> karyawan default", "99", "karyawan"},
		{"empty TINGKAT -> karyawan default", "", "karyawan"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			u := &SUser{
				Role: RoleEmployee,
				SDBFLPASS: &SDBFLPASS{
					USERID:  "EMP001",
					TINGKAT: tt.tingkat,
				},
			}

			assert.Equal(t, tt.expectedRole, u.GetDynamicRole())
		})
	}
}

// TestGetDynamicRole_NonAdminRoleWithNilDBFLPASS verifies the final fallback:
// no SDBFLPASS relation and a non-admin Role resolves to "karyawan" without
// panicking on the nil pointer dereference.
func TestGetDynamicRole_NonAdminRoleWithNilDBFLPASS(t *testing.T) {
	u := &SUser{
		Role:      RoleEmployee,
		SDBFLPASS: nil,
	}

	assert.NotPanics(t, func() {
		assert.Equal(t, "karyawan", u.GetDynamicRole())
	})
}

// TestGetDynamicRole_KaryawanRemainsBlocked is a regression guard documenting
// the intentional behavior: a pure karyawan (TINGKAT "0", Role != admin)
// must NOT resolve to "admin" — this is by design, not a bug, and the
// /admin/* RoleMiddleware relies on this to keep blocking karyawan accounts.
func TestGetDynamicRole_KaryawanRemainsBlocked(t *testing.T) {
	u := &SUser{
		Role: RoleEmployee,
		SDBFLPASS: &SDBFLPASS{
			USERID:  "KAR001",
			TINGKAT: "0",
		},
	}

	role := u.GetDynamicRole()
	assert.Equal(t, "karyawan", role)
	assert.NotEqual(t, "admin", role)
	assert.NotEqual(t, "pengurus", role)
	assert.NotEqual(t, "system_admin", role)
}
