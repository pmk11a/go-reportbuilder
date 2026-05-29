# Rencana Audit & Refactor: Separation of Concerns (SoC)

Berdasarkan permintaan Anda untuk menerapkan standar *Clean Architecture* dan *Separation of Concerns* (SoC) yang sangat ketat (baik di Backend maupun Frontend), saya telah melakukan pemindaian awal pada basis kode. Berikut adalah rencana refaktor yang akan dilakukan:

## 1. Backend (Golang)
Meskipun struktur utama (`models`) sudah dipisahkan dari `handlers`, saat ini masih terdapat struktur data transfer (DTO / *Request & Response*) yang tertinggal di dalam file *handler*.
- **Masalah Ditemukan**: 
  - `dashboard_handler.go` memuat `MenuResponseItem`, `MenuPermissions`, `PensiunanWithoutFiles`, dan `RawPensiunan`.
  - `filter_handler.go` memuat `PerkiraanResponse`.
- **Rencana Tindakan**:
  - Membuat direktori baru: `internal/dto/` (Data Transfer Object).
  - Memindahkan semua struktur *request* dan *response* ke dalam `dto` agar *handler* 100% murni hanya memuat logika *controller*.

## 2. Frontend (React)
Di frontend, SoC berarti memisahkan antara **UI (View)**, **Logika API (Services)**, **State Global (Store)**, dan **Definisi Tipe (Types)**.
- **Rencana Tindakan**:
  - Mengecek semua file `.tsx` di `src/components/` dan memindahkan tipe data *Domain* (seperti `User`, `Menu`, `Customer`) yang terdefinisi lokal ke dalam `src/types/`.
  - Memastikan tidak ada pemanggilan `axios.get` atau `fetch` langsung di dalam komponen UI (semua harus melalui `src/services/`).

## 3. Dokumentasi
- **Frontend**: Akan dibuatkan file `frontend/ARCHITECTURE.md` yang merinci standar folder (Components, Hooks, Services, Store, Types, Utils) dan alur kerjanya. Aturan ini juga akan disisipkan ke `frontend/CODE_GUIDE.md`.
- **Backend**: `backend/CODE_GUIDE.md` akan diperbarui untuk mewajibkan penggunaan folder `dto/` untuk *Request/Response*.

---

## 4. User Review Required (Pertanyaan Penting)

> [!WARNING]
> **Mengenai `interface Props` di Frontend React:**
> Dari pemindaian, saya menemukan banyak `interface Props` (misal: `interface HeaderProps`, `interface SidebarProps`) yang terdefinisi di dalam file komponen `.tsx` masing-masing. 
> **Pertanyaan:** Di dunia React *enterprise*, definisi `Props` khusus untuk satu komponen **sangat lazim dan disarankan** untuk dibiarkan berada di file yang sama dengan komponennya (Colocation), karena `Props` tersebut tidak dipakai oleh file lain. 
> 
> **Apakah Anda ingin saya memisahkan *semua* `interface Props` ini ke folder `src/types/` juga, atau *interface Props* diperbolehkan tetap menyatu di file `.tsx` asalkan Tipe Domain/Data-nya dipisah?**

---

Setelah Anda memberikan konfirmasi untuk bagian (4), saya akan langsung mengeksekusi semua refaktor di atas secara bertahap sesuai *checklist* di `tasks/architecture_audit_task.md`.
