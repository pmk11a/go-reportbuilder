# Rencana Implementasi: User Management, Access Menu & Menu CRUD

Berdasarkan permintaan untuk mengubah haluan dari Laporan Dinamis, kita akan berfokus pada pembuatan fitur **Manajemen Pengguna, Hak Akses, dan Pengelolaan Menu Dinamis**. Tabel yang akan digunakan adalah tabel legacy `DBMENU` dan `DBFLMENU` (serta `DBFLPASS` untuk user).

## 1. Tujuan Utama
Membuat halaman dan fungsi pengelolaan (CRUD) untuk mengatur struktur menu aplikasi secara dinamis pada prefix URL `/admin`, yang nantinya akan dihubungkan dengan *Access Menu* per-user atau per-role.

## 2. Fase 1: CRUD Menu (`/admin/berkas/menu`)
Sebagai langkah awal, kita akan berfokus **hanya pada CRUD Menu**.
- **URL Frontend**: `/admin/berkas/menu`
- **Tabel Target**: `DBMENU`

### A. Arsitektur Backend (Golang)
1. **Model `DbMenu`**: Memetakan *primary key* `KODEMENU` dan field lainnya.
2. **Layer Clean Architecture**: 
   - `MenuRepository` (Akses GORM ke `DBMENU`).
   - `MenuService` (Validasi logika bisnis).
   - `MenuHandler` (Menangkap HTTP Request dari frontend).
3. **Routing**: Membuat grup endpoint baru di `routes.go` khusus untuk master menu (misal: `GET /api/admin/menu`, `POST /api/admin/menu`, dst).

### B. Arsitektur Frontend (React & Tanstack)
1. **Pembuatan Route**: Setup route Tanstack untuk `/admin/berkas/menu`.
2. **Data Table**: Menggunakan *shadcn/ui* Table (atau *Tanstack Table*) untuk menampilkan daftar menu beserta pagination dan pencarian.
3. **Form Dialog (Modal)**: Form dinamis untuk membuat menu baru (Create) atau mengubah menu yang ada (Update). Form kemungkinan akan membutuhkan input seperti: Kode Menu, Nama Menu, URL/Path, Ikon, dll.

---

## 3. Resolusi Skema & Form Dinamis (Terkonfirmasi)

Berdasarkan gambar skema `DBMENU` dan kode di `GetSidebarMenu`, berikut adalah detail yang akan diimplementasikan:

1. **Model `DbMenu`**: 
   Akan dipindahkan dari `dashboard_handler.go` ke `internal/models/dbmenu.go` secara terpusat. Kolom yang digunakan: `KODEMENU`, `Keterangan`, `L0`, `ACCESS`, `OL`, `TipeTrans`, `routename`, `icon`, `PlatformMask`.
2. **Hierarki Parent-Child (L0)**:
   - Jika pengguna memilih/mengisi Level (`L0`) misal `2`, maka form akan memunculkan komponen *Select Search* untuk memilih "Menu Parent" dari Level `1` (`L0 = 1`).
   - Kode Menu anak (`KODEMENU`) akan menyesuaikan / merupakan prefix dari Parent-nya (sesuai logika `KODEMENU LIKE parentCode+"%"`).
3. **Pilihan Ikon**:
   - Kolom `icon` akan dirender menggunakan komponen *Select Search* yang memuat daftar ikon yang didukung oleh `lucide-react` (sesuai dengan fungsi `DynamicLucideIcon` di `MenuListCard.tsx`).

---

## 4. Langkah Selanjutnya
Mengeksekusi backend (Refactor Model, Pembuatan API) lalu dilanjutkan ke Frontend (Halaman Data Table Menu & Form Dialog). Checklist tugas dapat dipantau di `tasks/menu_management_task.md`.
