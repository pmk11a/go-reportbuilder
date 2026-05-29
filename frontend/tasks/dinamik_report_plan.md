# Rencana Implementasi: Dinamik Laporan Generator (React & Tanstack)

Berdasarkan konfirmasi bahwa proyek utama berada di `golang-next/frontend` (menggunakan React, Tanstack Router, dan Zustand), berikut adalah rencana implementasi arsitektur UI/UX yang disesuaikan untuk pembuatan laporan dinamis. Sistem ini nantinya akan menghasilkan payload JSON yang dapat di-*render* menjadi PDF oleh backend Golang.

## 1. Komponen Shared Tambahan (Prasyarat)
Sebelum membangun fitur Report Designer, kita akan menyiapkan beberapa komponen form khusus yang dapat digunakan kembali, termasuk sebagai filter laporan nantinya:

1. **CustomerPicker (`CustomerPicker.tsx`)**:
   - Berupa tombol (label & judul modal bisa dicustom).
   - Saat diklik, memunculkan modal Data Customer (mengambil data dari `DBCUSTSUPP`).
   - Modal memiliki fitur *Search* (berdasarkan nama dan kode) serta *Pagination*.
   - Filter parameter `jenis` (0 untuk Hutang, 1 untuk Piutang).
   - Menampilkan kolom: `KODECUSTSUPP`, `NAMACUSTSUPP`, `ALAMAT1`, `Kota`.
   - Mengembalikan data terpilih dan menampilkan Kode & Nama Customer di sebelah kiri tombol.

2. **PerkiraanSelect (`PerkiraanSelect.tsx`)**:
   - Komponen *Select Search* dinamis untuk mengambil data dari `dbperkiraan`.
   - Mendukung pencarian berdasar `Keterangan` atau `Perkiraan`.
   - Menerima parameter opsional seperti `without` dan `posthutpiut` sesuai dengan logic backend.

3. **KasBankSelect (`KasBankSelect.tsx`)**:
   - Komponen *Select Search* khusus untuk kelompok kas atau bank.
   - Mengambil data dari `dbperkiraan` yang direlasikan dengan `kelompok_kas` (`DBPOSTHUTPIUT`).
   - Menerima parameter `type` (misal 'KAS') dan parameter `query` untuk pencarian.

## 2. Analisis Kebutuhan & Struktur UI (Report Designer)

Kita akan membuat antarmuka "Report Designer" di dalam *route* `/admin/_layout/reports/$reportId/edit.tsx` (atau serupa). Antarmuka ini kemungkinan menggunakan layout *Tabs* (seperti Shadcn UI Tabs) yang berisi:
1. **General (Umum):** Nama laporan, Kodemenu (dari dbmenureport), deskripsi, status aktif.
2. **Filters:** CRUD filter laporan (akan menggunakan `CustomerPicker`, `PerkiraanSelect`, `KasBankSelect`, dll).
3. **Datasets:** Mendefinisikan Stored Procedure yang akan dipanggil (T1, T2, dst).
4. **Layout & Content (Fokus Utama):** Membangun header, body (multi-tabel), dan footer.

## 3. Desain Struktur Data JSON (`layout_config`)

Ini adalah payload yang akan disimpan di database dan di- *consume* oleh backend Golang untuk *generate* PDF.

```json
{
  "header": {
    "position": "center", // left, center, right
    "rows": [
      {
        "columns": [
          { "content": "Kop Surat", "colspan": 1, "width": "100%", "style": "font-weight: bold; text-align: center;" }
        ]
      }
    ]
  },
  "body": {
    "layout_type": "grid",
    "tables": [
      {
        "id": "table-1",
        "dataset_name": "T1", // Mengambil data dari SP T1
        "grid_span": 6, // Skala 1-12 (misal 6 = 50% / berdampingan)
        "header_rows": [
          [
            { "label": "No", "rowspan": 1, "colspan": 1, "width": "10%", "className": "text-center" },
            { "label": "Saldo", "rowspan": 1, "colspan": 1, "width": "90%", "className": "text-right" }
          ]
        ],
        "body_columns": [
          { "field": "nomor", "format": "text", "className": "text-center", "style": "" },
          { "field": "saldo", "format": "currency", "className": "text-right", "style": "" }
        ]
      }
    ]
  },
  "footer": {
    "signature_columns": 3, // Maksimal 3 kolom per baris horizontal
    "signatures": [
      { "name": "Budi Santoso", "title": "Direktur Utama", "order": 1 },
      { "name": "Andi Mulya", "title": "Manajer Keuangan", "order": 2 },
      { "name": "Cici", "title": "Staff", "order": 3 },
      { "name": "Dodi", "title": "Admin", "order": 4 } // Akan otomatis turun ke baris ke-2
    ]
  }
}
```

## 4. Desain Komponen React

### A. Store Management (Zustand)
Kita akan membuat/memperbarui `src/store/adminReportStore.ts` untuk mengelola *state* yang kompleks selama pengguna melakukan desain laporan sebelum di- *save*.
- `activeReport`: Objek yang berisi semua relasi (filters, datasets, layout_config).
- Fungsi mutasi seperti `updateLayoutHeader`, `addBodyTable`, `updateFooterSignature`.

### B. Komponen Visual Builder (`src/components/admin/reports/builder/`)
- `LayoutHeaderBuilder.tsx`: UI *form array* dinamis untuk menambah baris dan kolom header. Dilengkapi input text untuk konten, angka untuk colspan, dan adjust lebar.
- `LayoutBodyBuilder.tsx`: UI Grid (menggunakan Tailwind Grid `grid-cols-12`). Pengguna bisa menambah "Table Block", lalu menyetel ukuran blok (contoh: `col-span-6`). Di dalam blok, terdapat *Nested Builder* untuk menambah baris `<th>` dan mapping `<td>`.
- `LayoutFooterBuilder.tsx`: Konfigurasi dropdown jumlah kolom (1, 2, atau 3), dan *form array* untuk input data para penandatangan.

## 5. Rencana Arsitektur Database Backend (Golang)

Berdasarkan analisis fitur *Dynamic Report Generator*, pendekatan terbaik adalah menggunakan struktur **Hybrid Relasional & JSON** dengan usulan 4 tabel:

1. **`DB_DYNAMIC_REPORTS` (Tabel Utama)**: 
   - `ID` (PK)
   - `KodeMenu` (Foreign Key ke tabel legacy `DBMENUREPORT`)
   - `ReportName` (VARCHAR)
   - `Description` (TEXT)
   - `IsActive` (BOOLEAN)
2. **`DB_DYNAMIC_FILTERS` (Tabel Filter / *One-to-Many*)**: 
   - `ID` (PK), `ReportID` (FK ke `DB_DYNAMIC_REPORTS`)
   - `Label` (misal: "Pilih Customer")
   - `ParamName` (Variabel ke SP, misal: `@CustID`)
   - `ComponentType` (`customer_picker`, `perkiraan_select`, dll)
   - `OrderIndex` (Urutan filter di layar)
3. **`DB_DYNAMIC_DATASETS` (Tabel Dataset / *One-to-Many*)**: 
   - `ID` (PK), `ReportID` (FK ke `DB_DYNAMIC_REPORTS`)
   - `DatasetName` (Alias, misal: `T1`, `T2`)
   - `StoredProcedure` (Nama SP di SQL Server)
   - `ParamMapping` (JSON untuk map Filter ke Param SP)
4. **`DB_DYNAMIC_LAYOUTS` (Tabel Tata Letak Visual / *One-to-One*)**: 
   - `ID` (PK), `ReportID` (FK ke `DB_DYNAMIC_REPORTS` - Unique)
   - `HeaderConfig` (JSON/NVARCHAR(MAX))
   - `BodyConfig` (JSON/NVARCHAR(MAX))
   - `FooterConfig` (JSON/NVARCHAR(MAX))

> [!IMPORTANT]
> **Tipe Data JSON di SQL Server:** Karena kompleksitas grid visual (colspan, width, table blocks), penggunaan kolom `NVARCHAR(MAX)` untuk menampung JSON layout di `DB_DYNAMIC_LAYOUTS` adalah cara *enterprise* terbaik agar struktur tidak terlalu kaku.

## 6. Open Questions

> [!WARNING]
> 1. Apakah penamaan tabel mengikuti standar tabel legacy (huruf kapital semua, misal `DBDYNAMICREPORTS`), atau gaya modern (`dynamic_reports`)?
> 2. Apakah pemecahan 4 tabel ini sudah sesuai, atau Anda lebih memilih seluruh konfigurasi disatukan menjadi 1 tabel dengan 1 kolom JSON raksasa?

## 7. Rencana Eksekusi (Setelah Approval)

1. **Tahap 1 (Backend Database & API):**
   - Pembuatan 4 struct Model GORM (`DbDynamicReport`, `DbDynamicFilter`, dll).
   - Repositori, Service, dan Handler untuk menyimpan dan menarik skema JSON laporan.
2. **Tahap 2 (Frontend State & Routing):** 
   - Menyesuaikan `src/types/report.ts` dengan struktur 4 tabel di atas.
   - Setup Zustand `adminReportStore.ts`.
   - Setup route Tanstack.
3. **Tahap 3 (Frontend Builder Components):** 
   - Membangun *Layout Tab*, `HeaderBuilder`, `BodyGridBuilder`, dan `FooterBuilder`.
4. **Tahap 4 (Integrasi):** Menghubungkan form UI ke API Backend Golang.

## 8. Verification Plan
1. Mengakses halaman pembuatan laporan.
2. Mencoba menambahkan 2 tabel berdampingan melalui BodyBuilder.
3. Mencoba mengatur Header dengan *colspan*.
4. Melihat *state* JSON di Console untuk memastikan struktur data benar-benar *ready* untuk dikirim ke Backend Golang.
