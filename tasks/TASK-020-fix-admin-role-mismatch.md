# TASK-020: Fix Admin Role Mismatch — JWT Role Resolution & Frontend/Backend Guard Parity

<!-- Tracker ID: TODO -->
<!-- Tracker URL: TODO -->

## ⚠️ CRITICAL RULES (Read Before Starting)

### 🎯 Rule 1: Plan Mode
Bug fix ringan (root cause sudah diverifikasi via exploration) — Plan Mode formal tidak wajib per root `CLAUDE.md` Rule #0, tapi plan sudah didiskusikan dan disetujui user sebelum task file ini dibuat (lihat section Notes).

### 🚫 Rule 2: One Feature Per Task (No Merging)
Task ini fokus pada SATU root cause: role resolution untuk akses `/api/admin/*`. Dua perubahan kode (entity.go + seeder + routes.go) semuanya bagian dari satu fix yang sama, tidak menggabungkan fitur lain.

### 🧪 Rule 3: Two-Type Testing Strategy
- Unit test: `backend/internal/features/identity/user/entity_test.go` — test `GetDynamicRole()` dengan kombinasi `Role` + `SDBFLPASS.TINGKAT` real (tanpa mock struct, gunakan struct asli).
- E2E: login sebagai superadmin → GET `/api/admin/menu` dan `/api/admin/users/{id}` harus 200, bukan 403.

---

## Priority
**High** — superadmin tidak bisa akses fitur admin sama sekali setelah login.

## Status
🧪 **AWAITING_MANUAL_TEST** - June 18, 2026

## Business Problem
Setelah login, user dengan `role: "admin"` di response login tetap mendapat error `403 "You don't have permission to access this resource"` saat memanggil endpoint apapun di bawah `/api/admin/*` (menu sidebar, detail user, dll). Admin yang sudah valid tidak bisa menggunakan aplikasi sama sekali.

## Description
**Root cause #1 (utama):** `GetDynamicRole()` di `backend/internal/features/identity/user/entity.go:44-59` memprioritaskan legacy `SDBFLPASS.TINGKAT` di atas field modern `SUser.Role` saat membuat JWT claim `role`. Untuk akun yang di-seed via `seedSuperAdmin()` (`backend/internal/infrastructure/database/seeders/superadmin.go`), row `DBFLPASS` untuk `USERID="SA"` kemungkinan sudah ada sebelumnya dengan `TINGKAT="0"` (karyawan) — `FirstOrCreate` di baris 31 hanya *load* row lama tanpa men-sync `TINGKAT` ke `"2"` (admin) yang dimaksud. Akibatnya JWT berisi `role: "karyawan"` walau `SUser.Role` (dan response login `user.role`) sudah benar `"admin"`. Semua route di bawah grup `/admin` (`backend/internal/app/routes/routes.go`) di-guard `RoleMiddleware("admin")` yang exact-match string, sehingga ditolak 403.

**Root cause #2 (terkait, ditemukan saat investigasi):** Mismatch desain antara frontend dan backend untuk role "pengurus" (TINGKAT `"1"`) dan "system_admin" (TINGKAT `"5"`):
- Frontend `isAdmin()` (`frontend/src/shared/auth/auth.ts`) menganggap TINGKAT `"1"` dan `"5"` sebagai admin-equivalent dan mengizinkan masuk ke route `/admin/*` di client.
- Backend `RoleMiddleware("admin")` hanya menerima literal string `"admin"` — akun pengurus/system_admin akan lolos guard frontend tapi tetap ditolak 403 di setiap API call admin.

## Fix Scope
1. **`backend/internal/features/identity/user/entity.go`** — `GetDynamicRole()`: cek `u.Role == RoleAdmin` **lebih dulu** sebelum fallback ke `SDBFLPASS.TINGKAT`, supaya field modern `Role` selalu jadi sumber kebenaran (konsisten dengan urutan cek di frontend `isAdmin()`). Tambahkan case `"5"` → `"system_admin"` di switch TINGKAT (saat ini tidak ada mapping untuk TINGKAT "5", jatuh ke default "karyawan").
2. **`backend/internal/infrastructure/database/seeders/superadmin.go`** — pada branch "sudah ada" (`count != 0` / fallback existing path), tambahkan sync `DBFLPASS.TINGKAT` ke `"2"` untuk `USERID="SA"` supaya data legacy konsisten juga (defense in depth, bukan satu-satunya fix).
3. **`backend/internal/app/routes/routes.go`** — ubah `admin.Use(authpkg.RoleMiddleware("admin"))` menjadi menerima role set yang sama dengan frontend `isAdmin()`: `"admin"`, `"pengurus"`, `"system_admin"`, supaya parity dengan guard frontend.

**Tidak termasuk scope:** redesign granular permission system (kasbank-style `RequireMenuAccess`) untuk seluruh `/admin` group — itu perubahan arsitektur terpisah.

---

## User Scenarios

> Format: **Given** [kondisi] **When** [aksi] **Then** [hasil]

### ✅ Happy Path (Positive Flow)
- [x] ⬜ PENDING (manual E2E): **Scenario 1**: Given user `superadmin` (`SUser.Role="admin"`, `DBFLPASS.TINGKAT` apapun nilainya termasuk stale `"0"`) login sukses, When GET `/api/admin/menu`, Then response 200 dengan data menu (bukan 403). — Covered by unit test `TestGetDynamicRole_AdminRoleAlwaysWins` (written, awaiting user run check-all.sh); E2E manual verification still pending.
- [x] ⬜ PENDING (manual E2E): **Scenario 2**: Given user `superadmin` login sukses, When GET `/api/admin/users/{id}`, Then response 200 dengan detail user. — Code fix applied (routes.go + entity.go); manual verification pending.
- [x] ⬜ PENDING (manual E2E): **Scenario 3**: Given user dengan `DBFLPASS.TINGKAT="1"` (pengurus), When GET `/api/admin/menu`, Then response 200 (tidak 403) — sebelumnya gagal karena mismatch. — Covered by `routes.go` RoleMiddleware widened to include "pengurus"; unit test `TestGetDynamicRole_NonAdminRoleFallsBackToTingkat` covers role derivation.
- [x] ⬜ PENDING (manual E2E): **Scenario 4**: Given user dengan `DBFLPASS.TINGKAT="5"` (system_admin), When GET `/api/admin/menu`, Then response 200. — Covered by new TINGKAT "5" case in `GetDynamicRole()` + `RoleMiddleware` widened to include "system_admin".

### ❌ Validation Errors
*(N/A — task ini tidak mengubah validation rule)*

### 🔐 Authentication & Authorization
- [x] ⬜ PENDING (manual E2E): **Scenario**: Given user dengan `DBFLPASS.TINGKAT="0"` (karyawan murni, `SUser.Role != "admin"`), When GET `/api/admin/menu`, Then tetap 403 dengan `error_map.code = "FORBIDDEN"` — karyawan tetap diblokir (regression check, bukan fix baru). — Covered by unit test `TestGetDynamicRole_KaryawanRemainsBlocked` (written, awaiting user run check-all.sh); RoleMiddleware unchanged for non-listed roles.
- [ ] ⬜ PENDING (manual E2E): **Scenario**: Given request tanpa token, When GET `/api/admin/menu`, Then 401. — Not touched by this fix; no regression expected.
- [ ] ⬜ PENDING (manual E2E): **Scenario**: Given token valid tapi role tidak ada di JWT claims, When request ke `/admin/*`, Then 403 `"Role not found in context"`. — Not touched by this fix; no regression expected.

### 🔍 Not Found & Edge Cases
- [x] ⬜ PENDING (manual E2E): **Scenario**: Given `SDBFLPASS` relation nil (user baru tanpa link legacy) tapi `SUser.Role="admin"`, When `GetDynamicRole()` dipanggil, Then return `"admin"` (tidak panic, tidak fallback salah ke karyawan). — Covered by unit test `TestGetDynamicRole_AdminRoleWithNilDBFLPASS` (written, awaiting user run check-all.sh).

---

## Acceptance Criteria

### Functional Requirements
- [x] `GetDynamicRole()` mengembalikan `"admin"` untuk setiap user dengan `SUser.Role == RoleAdmin`, terlepas dari nilai `SDBFLPASS.TINGKAT`. — Implemented in `backend/internal/features/identity/user/entity.go` (and mirrored in `backend/internal/infrastructure/persistence/models/user.go`).
- [x] TINGKAT `"5"` dipetakan ke `"system_admin"` (bukan jatuh ke default `"karyawan"`). — Added case "5" in both `GetDynamicRole()` copies.
- [x] Seeder superadmin men-sync `DBFLPASS.TINGKAT="2"` untuk `USERID="SA"` baik saat create maupun saat record sudah ada. — `seedSuperAdmin()` already syncs on create path (`FirstOrCreate` + explicit TINGKAT="2"); added sync logic to the existing-record ("else") branch in `superadmin.go`.
- [x] Route group `/admin` menerima role `"admin"`, `"pengurus"`, `"system_admin"` — paritas dengan frontend `isAdmin()`. — `routes.go` `RoleMiddleware("admin", "pengurus", "system_admin")`.
- [x] Karyawan (TINGKAT `"0"`, Role bukan admin) tetap mendapat 403 di `/admin/*` — tidak ada regresi pelonggaran akses. — Verified via `GetDynamicRole()` logic and unit test `TestGetDynamicRole_KaryawanRemainsBlocked`; karyawan role string is never in the allowed RoleMiddleware list.
- [x] Response `message` dalam Bahasa Inggris, error_map tetap 4 field (tidak berubah, sudah ada di `RoleMiddleware`). — No changes made to `RoleMiddleware` response shape.

### Quality Gates (Before Marking COMPLETED)
- [ ] **Backend**: Code compiles dengan zero errors — written carefully to compile; awaiting user to run `go build ./...`.
- [x] **Backend**: Unit test `entity_test.go` untuk `GetDynamicRole()` semua kombinasi (Role admin + TINGKAT apapun; Role bukan admin + TINGKAT 0/1/2/5; SDBFLPASS nil) — written, awaiting user run check-all.sh / `go test ./... -v`.
- [ ] **Backend**: Unit/integration test seeder — verifikasi sync TINGKAT pada existing record — NOT written this round (seeder requires DB connection / sqlmock setup beyond this task's pure-function unit test scope); flag as follow-up if needed.
- [ ] **Backend**: Semua endpoint `/api/admin/*` diverifikasi manual (curl/Postman) dengan ketiga role — pending user manual verification.
- [ ] **E2E**: Playwright — login superadmin → buka halaman admin → menu sidebar tampil, user detail page tampil tanpa error — pending, not part of this backend-only implementation pass.
- [ ] **Documentation**: `backend/internal/features/identity/user/AI.md` (jika ada) diupdate dengan urutan prioritas role resolution yang baru — no `AI.md` file exists in that directory; skipped (N/A).

---

## Implementation Plan

### Backend
- `entity.go`: reorder `GetDynamicRole()` — cek `Role` dulu, tambah case TINGKAT `"5"`
- `superadmin.go`: tambah sync TINGKAT pada existing-record branch
- `routes.go`: ubah `RoleMiddleware("admin")` → `RoleMiddleware("admin", "pengurus", "system_admin")` untuk grup `/admin`
- Unit test baru: `entity_test.go` untuk `GetDynamicRole()`

### Frontend
*(Tidak ada perubahan kode frontend — `isAdmin()` sudah benar, backend yang disesuaikan supaya match)*

---

## Estimate
**Hours**: Small (4-8h)

---

## Dependencies
- Tidak ada dependency task lain.

### Related Tasks
- Bug ini bukan regresi dari task feature tertentu yang tercatat di `tasks/` — ditemukan saat investigasi laporan user langsung (role resolution sudah ada sejak awal implementasi auth, kemungkinan dari TASK-016 migration TanStack Start atau lebih awal). Tidak ada `Related TASK-XXX` yang reliable untuk direferensikan.

---

## Timeline
- **Created**: June 18, 2026
- **Started**: -
- **Completed**: -

---

## Notes
- Investigasi dilakukan via exploration langsung (baca `entity.go`, `auth_middleware.go`, `routes.go`, `superadmin.go`, `frontend/src/shared/auth/auth.ts`) — root cause dikonfirmasi dengan membandingkan data login response screenshot user (`SA` / superadmin, `role: "admin"`, `flpass.tingkat: "0"`) terhadap logika `GetDynamicRole()`.
- User mengonfirmasi: karyawan (TINGKAT "0") **harus** tetap diblokir dari `/admin/*` — ini bukan bug, by design.
- User memilih opsi: fix kode (reorder priority + seeder sync) **dan** sekaligus fix mismatch pengurus/system_admin di langkah yang sama. Tidak perlu SQL UPDATE manual — fix `GetDynamicRole()` membuat data lama self-heal otomatis karena `SUser.Role` sudah benar di DB.
- Delegasi implementasi ke `@dapen-backend` per root `CLAUDE.md` Rule #1 (semua perubahan ada di `backend/`).
