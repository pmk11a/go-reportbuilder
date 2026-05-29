# Task: User Management, Access Menu & Menu CRUD

- `[x]` **Tahap 1: Persiapan Database & API Menu (Backend)**
  - `[x]` Menentukan struktur tabel `DBMENU` (Berdasarkan konfirmasi User).
  - `[x]` Membuat GORM Model `dbmenu.go` di `internal/models/`.
  - `[x]` Membuat `menu_repository.go` untuk akses tabel `DBMENU`.
  - `[x]` Membuat `menu_service.go` untuk menangani logika CRUD.
  - `[x]` Membuat `menu_handler.go` untuk menangkap HTTP Request.
  - `[x]` Mendaftarkan *routes* API ke `routes.go` (`/api/admin/menu`).

- `[x]` **Tahap 2: Halaman CRUD Menu (Frontend)**
  - `[x]` Menambahkan tipe data TypeScript untuk `Menu` di `src/types/`.
  - `[x]` Membuat service fungsi fetch API Axios di `src/services/`.
  - `[x]` Membuat Tanstack Route `/admin/berkas/menu`.
  - `[x]` Membangun komponen UI Data Table untuk menampilkan daftar Menu.
  - `[x]` Membangun komponen UI Form Dialog (Create & Edit).
  - `[x]` Menghubungkan Form UI dengan Backend API.

- `[ ]` **Tahap 3: Access Menu Management (Tahap Selanjutnya)**
  - `[ ]` Mempersiapkan model `DBFLMENU` (Hak akses menu per-user).
  - `[ ]` Membuat UI pengelolaan hak akses user ke menu (User Access Assignment).
