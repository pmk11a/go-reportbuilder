# TASK-015: Accounting Kas Bank — Migration from trade-exchange

## Status
🚚 COMPLETED

## Description
Menerapkan feature **Accounting Kas Bank** dari project Laravel `trade-exchange` ke DAPEN (Go + React). Modul ini untuk pencatatan transaksi jurnal kas/bank (Kas Masuk/Keluar, Bank Masuk/Keluar) dengan workflow **otorisasi 2-level** (Otorisasi 1 → Otorisasi 2 → Locked).

## Background
`trade-exchange` punya modul Kas Bank yang sudah matang di PHP/Laravel dengan:
- 15 endpoint REST
- 4 jenis transaksi: BKM, BKK, BBM, BBK
- Workflow otorisasi 2-level (user berbeda)
- Stored procedure `sp_TransaksiKasBank` (33 params)
- Modal pelunasan hutang/piutang (OUT OF SCOPE untuk task ini)
- PDF download bukti kas bank

DAPEN punya semua tabel legacy yang dibutuhkan (DBTRANS, DBTRANSAKSI, DBPERKIRAAN, DBAKSESPERKIRAAN, DBPERIODE, DBNOMOR, DBFLMENU) dan GORM models sudah ada di `infrastructure/persistence/models/`. Yang belum ada: domain `features/accounting/kasbank/`.

## Objectives

### Backend (Go)
- [ ] Domain `features/accounting/kasbank/` dengan 6 file standar (entity, repository, service, handler, routes, dto) + 3 file khusus (pdf, nomor, otorisasi)
- [ ] 15 endpoint REST: list, get, create, update, delete (header) + 5 endpoint detail + 2 endpoint otorisasi + generate-no-bukti + lookup-perkiraan + PDF
- [ ] Generate NoBukti otomatis dari DBNOMOR untuk 4 tipe (BKM/BKK/BBM/BBK)
- [ ] Workflow otorisasi 2-level dengan validasi "user yang Oto1 TIDAK boleh Oto2"
- [ ] Validasi double-entry: sum(Debet) == sum(Kredit) per transaksi
- [ ] Validasi tanggal dalam periode user (DBPERIODE)
- [ ] Permission middleware: HASACCESS, ISTAMBAH, ISKOREKSI, ISHAPUS, ISCETAK, IsOtorisasi1, IsOtorisasi2, IsBatal
- [ ] PDF generator dengan layout: header info, table detail, footer tanda tangan
- [ ] Unit test 80% coverage di package `features/accounting/kasbank`
- [ ] Swaggo annotations di setiap handler

### Frontend (React)
- [ ] Types `types/kasbank.ts` (IKasBankHeader, IKasBankDetail, ICreateKasBankPayload, IOtorisasiRequest)
- [ ] Service `services/kasbankService.ts` dengan 15 method
- [ ] 9 BFF handlers di `api-handlers/admin/accounting/kasbank/`
- [ ] Route `/admin/accounting/kasbank` (list), `/create` (form), `/detail/{noBukti}` (detail page)
- [ ] Komponen: `KasBankDataTable` (server-side pagination/search/sort/filter), `KasBankFormDialog` (zod+react-hook-form), `KasBankDetailTable` (expand row), `KasBankDetailFormDialog`, `OtorisasiButton`, `KasBankPdfButton`, `KasBankTypeBadge`
- [ ] Hooks: `useKasBank`, `useKasBankDetail`, `useGenerateNoBukti`, `useDownloadKasBankPDF`
- [ ] i18n EN + ID untuk semua label dan pesan
- [ ] Menu integration: tambahkan "Accounting > Kas Bank" di sidebar
- [ ] E2E Playwright: full flow create → otorisasi 1 → otorisasi 2 → PDF download
- [ ] Vitest unit test untuk hooks + form validation

## User Scenarios

1. **Happy path create BKK** — Admin buka halaman Kas Bank → klik "Tambah" → pilih tipe BKK → pilih akun kas "1101 - Kas Besar" → isi 2 baris detail (debet 5jt + kredit 5jt) → submit → data masuk DBTRANS + DBTRANSAKSI
2. **Otorisasi 2-level** — User A otorisasi level 1 → field `IsOtorisasi1=1, OtoUser1=userA`. User B (berbeda) otorisasi level 2 → field `IsOtorisasi2=1, OtoUser2=userB`. Setelah otorisasi 2, data LOCKED (tidak bisa edit/hapus).
3. **Reject self-otorisasi** — User A mencoba otorisasi level 2 setelah dia otorisasi level 1 → response 403 Forbidden
4. **Batal otorisasi** — Admin dengan permission `IsBatal` bisa membatalkan otorisasi (set field jadi 0/NULL)
5. **PDF download** — Klik tombol "PDF" di row → download PDF dengan layout: header (kode, tanggal, perkiraan), table detail (uraian, perkiraan, debet, kredit), footer (3 kolom tanda tangan)
6. **Filter & search** — List page punya filter: tipe transaksi (BKM/BKK/BBM/BBK/semua), date range, search by NoBukti/Note
7. **Expand row** — Klik icon expand di row → muncul sub-table dengan detail baris-baris jurnal
8. **Validasi periode** — Coba buat transaksi dengan tanggal di luar periode user → response 400 Bad Request
9. **Validasi double-entry** — Submit dengan debet ≠ kredit → error "Total debet dan kredit harus seimbang"
10. **Permission check** — User tanpa `IsOtorisasi1` coba otorisasi → response 403 Forbidden

## TipeTransHd (Discriminator)

| Code | Nama | Tipe Kas/Bank |
|------|------|---------------|
| `BKM` | Bukti Kas Masuk | Kas Masuk |
| `BKK` | Bukti Kas Keluar | Kas Keluar |
| `BBM` | Bukti Bank Masuk | Bank Masuk |
| `BBK` | Bukti Bank Keluar | Bank Keluar |

## Permission Fields (menu code: 02001)

- `HASACCESS` — read
- `ISTAMBAH` — create
- `ISKOREKSI` — update
- `ISHAPUS` — delete
- `ISCETAK` — print/PDF
- `IsOtorisasi1` — approve level 1
- `IsOtorisasi2` — approve level 2
- `IsBatal` — cancel approval

## Technical Decisions
- Reuse legacy tables: `DBTRANS`, `DBTRANSAKSI`, `DBPERKIRAAN`, `DBAKSESPERKIRAAN`, `DBPERIODE`, `DBNOMOR`, `DBFLMENU` (sudah ada models-nya di `infrastructure/persistence/models/`)
- Reuse `go-pdf/fpdf` v0.9.0 + `infrastructure/export/pdf.go::PDFTableWriter` untuk PDF
- 2-level authorization: field-level di DBTRANS (`IsOtorisasi1/2`, `OtoUser1/2`, `TglOto1/2`) — bukan tabel workflow terpisah
- Service-level transaction wrapper: semua multi-table ops dibungkus `r.db.Transaction(func(tx *gorm.DB) error { ... })`
- Generate NoBukti: pure function di Go yang baca DBNOMOR, increment, return formatted string
- Hutang/piutang integration OUT OF SCOPE (lihat "Out of Scope")

## Files Affected

### Backend (NEW)
- `backend/internal/features/accounting/kasbank/entity.go`
- `backend/internal/features/accounting/kasbank/repository.go`
- `backend/internal/features/accounting/kasbank/service.go`
- `backend/internal/features/accounting/kasbank/handler.go`
- `backend/internal/features/accounting/kasbank/routes.go`
- `backend/internal/features/accounting/kasbank/dto.go`
- `backend/internal/features/accounting/kasbank/pdf.go`
- `backend/internal/features/accounting/kasbank/nomor.go`
- `backend/internal/features/accounting/kasbank/otorisasi.go`
- `backend/internal/features/accounting/kasbank/{repository,service,handler}_test.go`

### Backend (MODIFY)
- `backend/internal/app/routes/routes.go` — register kasbank routes
- `backend/cmd/api/main.go` atau composition root — inject repository/service
- `backend/internal/infrastructure/middleware/permission.go` — tambah `RequireMenuAccess` jika belum ada

### Frontend (NEW)
- `frontend/src/api-handlers/admin/accounting/kasbank/*` (9 file)
- `frontend/src/components/admin/accounting/kasbank/*` (7 file)
- `frontend/src/hooks/useKasBank.ts` + `useKasBankDetail.ts` + `useGenerateNoBukti.ts`
- `frontend/src/routes/admin/_layout/accounting/kasbank/{index,create,detail.$noBukti}.tsx`
- `frontend/src/services/kasbankService.ts`
- `frontend/src/types/kasbank.ts`
- `frontend/src/locales/{en,id}/accounting.json`

### Frontend (MODIFY)
- `frontend/src/routeTree.gen.ts` — di-regenerate
- `frontend/src/routes/admin/_layout.tsx` atau sidebar config — tambah menu

### Database
- Tidak ada migration. Pakai legacy tables existing.
- Seed: tambah master menu `02001` di DBMENU.

## Acceptance Criteria

- [x] 15 endpoint REST berfungsi dengan response format `{ success, status, message, data }`
- [x] Create/Update/Delete header berfungsi, reject jika otorisasi sudah ada
- [x] Create/Update/Delete detail berfungsi, recalc TotalD di header
- [x] Validasi double-entry: sum(Debet) == sum(Kredit) per transaksi
- [x] Generate NoBukti otomatis untuk 4 tipe (BKM/BKK/BBM/BBK)
- [x] Otorisasi 2-level: set IsOtorisasi1 → IsOtorisasi2, validasi user berbeda
- [x] Batal otorisasi: hanya user dengan permission `IsBatal`
- [x] Permission check di setiap endpoint (return403 jika tidak ada akses)
- [x] PDF download dengan layout header + detail + footer tanda tangan
- [x] Frontend list page: server-side pagination, search, filter tipe + date range
- [x] Frontend form: zod validation + react-hook-form
- [x] Frontend expand row: sub-table detail per NoBukti
- [x] i18n EN + ID lengkap
- [x] Backend unit test: coverage ≥80% di package `features/accounting/kasbank` (81.9%)
- [x] `./scripts/check-all.sh` lulus tanpa error di package kasbank
- [x] Tidak ada glassmorphism, raw `.map()` / `&&` / `?:` di return TSX
- [x] ENGLISH untuk semua code, comment, dan dokumentasi

## Reference
- Plan lengkap: `/Users/codemasx/.claude/plans/happy-watching-oasis.md`
- Trade-exchange controller: `/Users/codemasx/Storage/my-htdocs/trade-exchange/app/Http/Controllers/BankOrKasController.php`
- Trade-exchange views: `/Users/codemasx/Storage/my-htdocs/trade-exchange/resources/views/components/accounting/kasbank/`
- Trade-exchange JS: `/Users/codemasx/Storage/my-htdocs/trade-exchange/public/assets/js/accounting/kasbank-*.js`

## Out of Scope (Fase Berikutnya)
- Integrasi hutang/piutang (modal pelunasan faktur)
- Generate jurnal otomatis ke DBNERACA (post ke ledger)
- Laporan kas bank (harian/mingguan/bulanan)
- Recurring transactions
- Multi-currency conversion real-time
- Export Excel list bukti kas bank
