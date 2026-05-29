# React Frontend Architecture (Separation of Concerns)

Proyek ini sangat ketat dalam menegakkan **Separation of Concerns (SoC)**. Frontend React tidak boleh mencampur adukkan antarmuka pengguna (UI), logika pengambilan data (Fetching), logika state global, dan tipe data.

## Struktur Direktori
```text
frontend/src/
├── components/   # Murni komponen UI. Tidak boleh ada definisi tipe data (interface) atau Axios di sini.
├── services/     # Tempat semua pemanggilan Axios/Fetch API berada.
├── store/        # State Management Global (Zustand).
├── types/        # Sentralisasi SEMUA antarmuka (Interface) dan Tipe Data.
├── utils/        # Fungsi helper murni.
└── routes/       # Definisi rute menggunakan TanStack Router.
```

## Aturan Ketat (CRITICAL RULES)

1. **Sentralisasi Tipe Data (Types)**
   Semua `interface` dan `type` (termasuk `Props` komponen) WAJIB diletakkan di dalam folder `src/types/`. 
   - `src/types/components.ts`: Untuk *Props* antarmuka UI.
   - `src/types/domain.ts`: Untuk struktur data utama (User, Menu, dsb).
   Komponen `*.tsx` hanya boleh melakukan *import* tipe tersebut, bukan mendefinisikannya secara lokal.

2. **Dilarang Fetching di Komponen**
   Pemanggilan `axios.get()` atau `fetch()` dilarang keras ditulis langsung di dalam file `*.tsx` di folder `components/`. Semua operasi I/O jaringan harus dibungkus dalam fungsi di `src/services/` dan dipanggil oleh komponen.

3. **Komponen Bersih (Clean UI)**
   File `.tsx` hanya boleh berisi JSX dan *hook* yang mengatur *state* lokal (UI). Logika bisnis berat harus diekstrak ke *Store* (Zustand) atau *Hooks* terpisah.
