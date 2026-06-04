# TASK-003: Company Settings & Numbering

## Description
Adapt `DbPERUSAHAAN` and `DbNOMOR` from the reference project (Laravel) to be displayed as Tabs (Company & Numbering) at `/admin/berkas/perusahaan`.

## Status
✅ **COMPLETED** - May 31, 2026

## Backend
- [x] Create `backend/internal/models/perusahaan.go`
- [x] Create `backend/internal/models/nomor.go`
- [x] Create `backend/internal/handlers/setting_handler.go`
- [x] Register routes in `backend/internal/routes/routes.go`

## Frontend
- [x] Create `frontend/src/routes/admin/_layout/berkas/perusahaan.tsx` with Tabs
- [x] Create `CompanyForm.tsx`
- [x] Create `NumberingForm.tsx`
- [x] Create `frontend/src/services/settingService.ts`
- [x] Create `frontend/src/hooks/useSettings.ts`

## User Scenarios
- [x] ✅ PASS: **[Positive] Initial Load**: User navigates to Company Settings; the form successfully fetches and displays the current company profile data and numbering formats from the backend.
- [x] ✅ PASS: **[Positive] Update Company Profile**: User edits the company 'Name' and 'Address', clicks Save, and a success toast appears. The API responds with 200 OK and data is updated.
- [x] ✅ PASS: **[Negative] Update Failure (Network)**: User clicks Save while offline; the system displays an error toast mapping to the appropriate network error from `errorMapper.ts`.
- [x] ✅ PASS: **[Positive] Numbering Format Update**: User switches to the Numbering tab, inputs a valid numeric separator (e.g., 1), clicks Save. The UI shows a success toast and correctly passes numbers (not strings) to the API.
- [x] ✅ PASS: **[Edge Case] Empty/Null Data Handling**: If the database is empty (first time setup), the UI form should load with empty defaults without crashing, allowing the user to create the initial settings record.
