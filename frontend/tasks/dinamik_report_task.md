# Task: Dynamic Report Generator (React)

- `[x]` Phase 0: Shared Components
  - `[x]` Create API service for `Customer`, `Perkiraan`, `KasBank`
  - `[x]` Create `CustomerPicker` component (Modal with search/pagination)
  - `[x]` Create `PerkiraanSelect` component (Select with search & filters)
  - `[x]` Create `KasBankSelect` component (Select for KAS/BANK groups)

- `[ ]` Phase 1: Backend Database & API Report Builder
  - `[ ]` Model GORM untuk 4 Tabel (DB_DYNAMIC_REPORTS, DB_DYNAMIC_FILTERS, DB_DYNAMIC_DATASETS, DB_DYNAMIC_LAYOUTS)
  - `[ ]` Repository, Service, dan Handler untuk API Master Laporan
  - `[ ]` Routing API untuk CRUD Laporan

- `[ ]` Phase 2: Frontend State & Routing
  - `[ ]` Update tipe data `src/types/report.ts` menyesuaikan 4 tabel.
  - `[ ]` Update Zustand Store `src/store/adminReportStore.ts`.
  - `[ ]` Setup Tanstack Route: `/admin/reports/create` dan `/admin/reports/$reportId/edit`.

- `[ ]` Phase 3: Frontend UI Builder Components
  - `[ ]` Komponen Tab Utama (General, Filters, Datasets, Layouts).
  - `[ ]` Build/Integrate `LayoutHeaderBuilder`.
  - `[ ]` Build/Integrate `LayoutBodyBuilder` (Grid System).
  - `[ ]` Build/Integrate `LayoutFooterBuilder`.

- `[ ]` Phase 4: Integration & Verification
  - `[ ]` Connect Save/Publish actions to API layer (simulated or real endpoints)
  - `[ ]` Verify JSON structure output generation
  - `[ ]` Test UI interactions (Grid resizing, column span, row span)
