# Task: Architecture Audit & Refactor (SoC)

- `[x]` **Tahap 1: Refaktor Backend (Golang)**
  - `[x]` Buat direktori `internal/dto/`.
  - `[x]` Pindahkan `MenuResponseItem` dan `MenuPermissions` dari `dashboard_handler.go` ke `dto/dashboard_dto.go`.
  - `[x]` Pindahkan `PensiunanWithoutFiles` dan `RawPensiunan` dari `dashboard_handler.go` ke `dto/dashboard_dto.go`.
  - `[x]` Pindahkan `PerkiraanResponse` dari `filter_handler.go` ke `dto/filter_dto.go`.
  - `[x]` Perbarui semua deklarasi *import* di `handlers/*.go`.
  - `[x]` Perbarui `backend/CODE_GUIDE.md` untuk menegakkan aturan layer DTO.

- `[x]` **Tahap 2: Refaktor Frontend (React)**
  - `[x]` *Scan* file di `src/components/` untuk mencari Tipe Data (bukan Props) yang tercampur.
  - `[x]` Pindahkan tipe-tipe tersebut ke `src/types/` (Telah dipusatkan ke `src/types/components.ts`).
  - `[x]` Pastikan tidak ada `axios` atau *data fetching* langsung di level komponen (Pindahkan ke `src/services/`).

- `[x]` **Tahap 3: Pembuatan Dokumentasi Frontend**
  - `[x]` Buat file `frontend/ARCHITECTURE.md` yang menjelaskan alur *Component -> Hook/Store -> Service -> API*.
  - `[x]` Masukkan referensi `ARCHITECTURE.md` ke dalam `frontend/CODE_GUIDE.md`.
