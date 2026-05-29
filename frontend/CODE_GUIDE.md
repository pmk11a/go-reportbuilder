# DAPEN Frontend Architecture & Code Patterns

## Overview
This frontend is built with **React**, **TypeScript**, and **Vite**. It leverages the **TanStack** ecosystem for routing and data fetching to provide a robust, type-safe development experience.

## Tech Stack
- **Framework**: React 18+
- **Routing**: TanStack Router (File-based routing)
- **Data Fetching**: TanStack Query (React Query)
- **State Management**: Zustand / React Context
- **Form Handling**: React Hook Form + Zod
- **Styling**: Vanilla CSS / CSS Modules / Tailwind (Atomic)
- **Testing**: Vitest + React Testing Library

## Project Structure
```text
frontend/
├── src/
│   ├── api-handlers/     # BFF (Backend For Frontend) API Handlers
│   ├── bff/              # BFF Core logic (Dispatcher, Utils, Logger)
│   ├── components/       
│   │   ├── dashboard/    # Specialized dashboard-only components
│   │   ├── ui/           # Generic, atomic UI components (Library)
│   │   └── layouts/      # Global layout components (Header, Sidebar, etc.)
│   ├── hooks/            # Reusable React Hooks (logic encapsulation)
│   ├── lib/              # Third-party lib configs (apiClient, queryClient)
│   ├── providers/        # Context Providers
│   ├── routes/           # TanStack Router UI routes (file-based)
│   ├── services/         # Client-side API services (interface to BFF)
│   ├── store/            # Global state (Zustand: auth, theme, etc.)
│   ├── types/            # Centralized TypeScript definitions
│   ├── schemas/          # Zod validation schemas
│   ├── utils/            # Shared helper functions
│   └── styles/           # Global styles and theme tokens
```

## Core Patterns

### 1. Design System & Aesthetics (MANDATORY)
- **Unified Background**: Semua halaman internal (Dashboard, Profil, dsb) **WAJIB** menggunakan komponen `AppBackground`. Ini memastikan konsistensi gradien radial dan efek gelembung (*blobs*) sesuai brand identity.
- **Standardized Page Layout**: Setiap halaman (baik Admin maupun Karyawan) **WAJIB** mengikuti hierarki layout horizontal seragam:
    1. **Header Area**: Berlatar belakang warna biru cerah (gradient/solid). Di sisi kiri memuat teks judul tebal dan subjudul yang **bersifat dinamis** mengikuti rute atau menu yang sedang aktif (contoh: Saat di beranda bertuliskan "Selamat Datang, [ROLE]", saat di menu Berkas bertuliskan "Menu Berkas", dsb.). Di sisi kanan memuat *Theme Toggle* dan *Avatar Profile* membulat.
    2. **Main Menu Bar (Horizontal)**: Sebuah *container* (Card) putih memanjang horizontal dengan sudut membulat (*rounded*) yang melayang di atas *background* biru. Berisi daftar *Parent Menu* berwujud ikon melingkar dengan teks label di bawahnya, dilengkapi dengan *badge* notifikasi angka.
    3. **Child Menu / Sub-Menu**: Ditampilkan tepat di bawah menu utama dengan gaya visual yang identik (desain seragam).
- **Glassmorphism**: Kontainer data utama (Card, Table, Modal) wajib menggunakan efek *glass*:
    - **Background**: `bg-white/80` (Light Mode) atau `bg-slate-900/60` (Dark Mode).
    - **Blur**: `backdrop-blur-xl`.
    - **Border**: Gunakan border tipis transparan (contoh: `border-white/50` atau `border-slate-800`).
- **Typography**: Gunakan `font-black` (900) untuk angka besar atau judul utama dashboard. Gunakan `font-bold` (700) untuk label data.
- **Color Tokens**: Gunakan variabel CSS yang sudah ada (misal: `text-primary-600`) alih-alih menggunakan kode warna HEX mentah.
- **Loading States**: WAJIB menggunakan skeleton loading component (`Skeleton` dari `src/components/ui/feedback/skeleton.tsx`) untuk setiap indikasi loading pada elemen data. Dilarang keras menggunakan teks loading statis seperti "Memuat data...".
- **Interactive Elements**: Setiap elemen interaktif (terutama Button) wajib memiliki `cursor-pointer`. Jika dalam kondisi _disabled_, wajib menggunakan `cursor-not-allowed` (bukan menghilangkan *pointer events* sepenuhnya agar kursor *blocked* bisa terlihat oleh pengguna).

### 2. Component Modularization & DRY UI
- **Check-Before-Create (MANDATORY)**: Sebelum membuat komponen baru, pengembang **WAJIB** mengecek folder `src/components/ui` atau `src/components/dashboard` untuk melihat apakah sudah ada komponen serupa. 
- **Dilarang Duplikasi**: Jika komponen serupa sudah ada, **GUNAKAN** atau **KEMBANGKAN** komponen tersebut menggunakan props (dinamis).
- **Atomic Design**: Pecah UI kompleks menjadi komponen kecil. Dashboard tidak boleh berisi ratusan baris JSX mentah.

### 3. Professional BFF Architecture (`src/api-handlers`)
- **BFF Role**: Berfungsi sebagai gateway, session manager, dan transformator data.
- **Standard Response**: Semua handler wajib menggunakan `BffResponseBuilder` untuk format `{ success, message, data }`.
- **Logger**: Gunakan `bffLogger` untuk memantau request dan response di sisi server development.
- **Cookie Security**: Simpan token sensitif hanya di HttpOnly Cookie via BFF.

#### Contoh Implementasi BFF Login (`src/api-handlers/auth/login.ts`)
```typescript
import { makeBackendRequest, BffResponseBuilder } from '@/bff/utils'

export const APIRoute = {
  POST: async ({ request }: { request: Request }) => {
    const result = await makeBackendRequest('/api/auth/login', {
      method: 'POST',
      body: (request as any)._body,
    }, request)

    const builder = new BffResponseBuilder(result.status)
    if (result.success && result.data?.token) {
      builder.setCookie('access_token', result.data.token, 86400)
      delete result.data.token
    }
    return builder.send(result.success, result.message, result.data)
  },
}
```

### 4. Centralized Type Safety (Strict SoC)
- **MANDATORY**: Please read `frontend/ARCHITECTURE.md` for strict Separation of Concerns rules.
- **Single Source of Truth**: Semua interface API, model data, dan `Props` komponen WAJIB berada di `src/types/`. Tidak boleh ada `interface Props` yang terdefinisi di dalam file komponen `.tsx`.
- **Centralized Files**:
  - `src/types/components.ts`: Untuk Props komponen UI.
  - `src/types/api.ts`: Untuk respons API dan model data umum.
  - `src/types/auth.ts`: Untuk tipe terkait otentikasi.
- **Strict Naming Convention (MANDATORY)**:
  - **Interface**: Wajib diawali huruf `I` kapital (contoh: `interface IUser`, `interface IAPIResponse`).
  - **Type**: Wajib diawali huruf `T` kapital (contoh: `type TThemeName`).
  - **Props**: Wajib diawali huruf `P` kapital (contoh: `interface PMenuFormDialog`, `interface PButtonProps`).
- **No `any` Policy**: Dilarang menggunakan `any`. Gunakan generics jika tipe data fleksibel.

### 5. Client-Side Services & Hooks
- **Services**: Berada di `src/services/`. Bertanggung jawab memanggil BFF via `apiClient`.
- **Hooks**: Berada di `src/hooks/`. Menggunakan TanStack Query untuk caching dan state management data.
- **Separation**: Komponen UI tidak boleh memanggil `apiClient` secara langsung; gunakan hook.

### 6. Theme & Global Styling
- **Theme Store**: Gunakan `useThemeStore` (Zustand) untuk mengelola mode dark/light.
- **Tokens**: Gunakan CSS Variables (`--primary`, `--background`) yang didefinisikan di `styles/globals.css`.
- **Glassmorphism**: Gunakan kombinasi `backdrop-blur` dan border transparan untuk elemen UI premium.

### 7. Automation Testing
- **Mandatory Tests (Wajib)**: 
  - **Flow Bisnis & Transaksional**: Fitur dengan input, perhitungan, dan state kompleks (contoh: *Login*, *Create Menu*, *Transaksi*).
  - **Layer Services & Custom Hooks**: Semua file yang berinteraksi dengan API BFF (seperti `src/services/` dan `src/hooks/`) **wajib** memiliki `.test.ts` untuk memastikan pengolahan payload dan *error handling* dari jaringan tertangani dengan aman.
  - **Komponen Kalkulatif / Dinamis**: Tabel interaktif, Form dengan logika dependensi (*watch*), dan komponen dashboard yang melakukan manipulasi *state*.
- **Optional Tests (Tidak Wajib)**:
  - **Halaman Statis/Presentation Component**: Halaman informasi murni tanpa interaksi state yang kompleks (contoh: *Static Report*, *Footer*).
  - **Komponen UI Atomic Base**: File di `src/components/ui/` yang murni meneruskan properti (*wrappers*), asalkan berasal dari library stabil seperti Radix UI / Shadcn.
- **Tools**: Vitest untuk unit test dan React Testing Library untuk component testing.
- **Coverage**: Test harus mencakup *happy path* (sukses) dan *error handling* (validasi gagal, server 500/timeout).

### 8. Security & Resilience
- **BFF Rate Limiting**: BFF wajib membatasi request per IP menggunakan mekanisme **Sliding Window** atau **Token Bucket** (default: 100 req/min).
- **BFF Timeout**: Setiap request ke backend wajib memiliki timeout (default: 30 detik) menggunakan `AbortController`.
- **Error Handling**: Tangani status code `408` (Timeout) dan `429` (Rate Limit) dengan pesan yang ramah pengguna.

## Role-Based Navigation
- **Prefix Path**: `/admin` untuk area administrator dan `/karyawan` untuk area staff.
- **Redirection**: Handle redirect berdasarkan role di `index.tsx` dan saat login berhasil.
- **Guard**: Gunakan `beforeLoad` di TanStack Router untuk memvalidasi akses user secara real-time.

## Development Workflow
1. **Cek Komponen**: Cek ketersediaan komponen di `src/components/ui`.
2. **Definisikan Tipe**: Tambahkan interface di `src/types/`.
3. **BFF Handler**: Buat handler di `api-handlers/` jika butuh endpoint baru.
4. **Service**: Implementasi fungsi pemanggil di `services/`.
5. **Hook**: Buat custom hook dengan TanStack Query di `hooks/`.
6. **UI & Route**: Implementasi rute di `routes/`.
7. **Test**: Buat unit/integration test untuk fitur tersebut.

