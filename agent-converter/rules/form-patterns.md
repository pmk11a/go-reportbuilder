# Form Patterns Catalog

Based on FrmUtama.pas analysis, there are 3 main form patterns:

## Pattern 1: Master Form (simple CRUD)
Used by: Perkiraan, Customer, Supplier, Barang, Gudang, Kota, Depart, etc.

### Delphi structure
- TcxGrid / dxDBGrid for master list (top)
- TcxDBTextEdit / TcxDBLookupComboBox / TcxDBDateEdit / TcxDBCheckBox for details (bottom)
- Action buttons: Tambah, Hapus, Koreksi, Cetak, Excel (5 buttons)
- Title property: NamaForm / display name

### Delphi methods
- FormShow -> init defaults
- btnTambahClick -> check otoris + insert
- btnHapusClick -> confirm + soft delete
- btnKoreksiClick -> enable edit mode
- btnCetakClick -> show preview
- btnExcelClick -> export
- TcxGrid focused row changed -> populate detail fields

### Laravel mapping
- Route: /master/{resource}
- Controller: MasterController@index/create/store/edit/update/destroy/print/export
- Service: MasterService with CRUD methods
- Policy: MasterPolicy with view/create/update/delete/print/export
- Views: index.blade.php, form.blade.php
- Frontend: Nuxt pages/master/{resource}/index.vue, form.vue

## Pattern 2: Master-Detail Transaction Form (most common)
Used by: Beli, Jual, PO, SPB, SO, SPK, InvoicePL, Produksi, Hasil Produksi, etc.

### Delphi structure
- Master panel (top): NoBukti, Tanggal, KodeCustSupp, Keterangan
- Detail grid (middle): KodeBrg, Qty, Harga, Disc, PPN, Subtotal
- Action buttons (top): Tambah, Hapus, Koreksi, Posting, Cetak, Excel
- Status panel (bottom): IsBatal, IsPosting, UserPosting, TglPosting

### Delphi methods (long forms, often 2000-5000 lines)
- FormShow -> init defaults, set active period
- btnTambahClick -> Daftar_Nomor + start new
- btnSimpanClick -> Save master + Save detail (insert/update)
- btnHapusClick -> Hapus_Daftar_Nomor + delete
- btnKoreksiClick -> Daftar_Nomor + load existing + edit
- btnBatalClick -> pembatalan(table, key, val, keyVal)
- btnCetakClick -> preview fr3 template
- dxDBGrid columnChanged -> recalc subtotal/ppn
- TcxDBLookupComboBox exit -> auto-fill related fields

### Laravel mapping
- Route: /transaksi/{resource}
- Controller: TransactionController (resource routes)
- Service: TransactionService with beginTransaction/commit/rollback
- NumberBookingService for Daftar_Nomor logic
- Models: MasterModel + DetailModel with hasMany relationship
- Policy: TransactionPolicy with same 6 permissions
- Events: TransactionCreated, TransactionPosted
- Jobs: PostToJournal job (async)

## Pattern 3: Browser/Lookup Form (universal)
FrmBrows.pas - the universal lookup dialog

### Delphi structure
- TcxGrid with search fields
- Filter rows at top
- Selected row returns primary key to caller

### Laravel mapping (already partially done in BrowseService.php)
- Route: GET /api/browse/{kodeBrowse}
- Service: BrowseService (already exists!)
- Frontend: <LookupPicker> component (Nuxt)

## Pattern 4: Setting/Configuration Form (simple)
Used by: Password, Konfigurasi, Lock Periode, Tutup Buku, Posting, etc.

### Delphi structure
- Form fields
- Save button
- Some have previews/reports

### Laravel mapping
- Route: /setting/{resource}
- Controller: SettingController (simplified)
- Models: Config, Periode, LockPeriode
- No Detail - master only

## Pattern 5: Report Form
Used by: FrmReportPreview, FrmMenuReport, ArusKas, Neraca, LR

### Delphi structure
- Parameter selection form (filter: period, range date, customer, etc.)
- Preview fr3 (FastReport)
- Print/Export buttons

### Laravel mapping
- Route: /report/{name}
- Controller: ReportController
- Service: ReportService (already exists partially)
- Frontend: <ReportBuilder> + <ReportViewer> Nuxt components
- Backend: maatwebsite/excel + barryvdh/dompdf + FastReport PHP

