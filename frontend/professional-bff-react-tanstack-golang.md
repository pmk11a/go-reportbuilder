# Dokumen Arsitektur BFF — Konsep, Redis Session, Silent Refresh & Concurrency Lock

> Panduan enterprise untuk implementasi **Backend-for-Frontend (BFF) Pattern** dengan Redis-backed session, Refresh Token Rotation (RTR), dan Concurrency Lock untuk mencegah race condition.

---

## Daftar Isi

- [Bagian 1: Konsep Dasar BFF, Activity Diagram, dan Setup Redis](#bagian-1-konsep-dasar-bff-activity-diagram-dan-setup-redis)
  - [1.1 Latar Belakang & Masalah](#11-latar-belakang--masalah-problem-statement)
  - [1.2 Solusi: Backend-for-Frontend (BFF) Pattern](#12-solusi-backend-for-frontend-bff-pattern)
  - [1.3 Activity Diagram (Alur Autentikasi)](#13-activity-diagram-alur-autentikasi)
  - [1.4 Setup Redis untuk Penyimpanan Token](#14-setup-redis-untuk-penyimpanan-token)
- [Bagian 2: Silent Refresh Token, RTR, dan Concurrency Lock](#bagian-2-implementasi-silent-refresh-token-rtr-dan-concurrency-lock)
  - [2.1 Konsep Refresh Token Rotation (RTR)](#21-konsep-refresh-token-rotation-rtr)
  - [2.2 Bahaya Race Condition](#22-bahaya-race-condition-penyebab-force-logout)
  - [2.3 Solusi: Concurrency Lock Menggunakan Redis](#23-solusi-concurrency-lock-menggunakan-redis)

---

## Bagian 1: Konsep Dasar BFF, Activity Diagram, dan Setup Redis

### 1.1 Latar Belakang & Masalah (Problem Statement)

Pada arsitektur **Single Page Application (SPA)** tradisional, token autentikasi (seperti JWT Access Token dan Refresh Token) sering kali dikirim langsung ke browser dan disimpan di `localStorage` atau `sessionStorage`.

Pendekatan ini memiliki **risiko keamanan krusial** di tingkat enterprise:

| Risiko | Penjelasan |
| ------ | ---------- |
| **XSS (Cross-Site Scripting)** | Skrip pihak ketiga yang korup dapat mengakses `localStorage` / `sessionStorage` dan mencuri token |
| **Token Theft** | Attacker yang berhasil meng-inject script bisa langsung mengambil JWT dan menggunakannya |
| **No Server Control** | Tidak ada cara untuk mencabut (revoke) token yang sudah ada di browser secara instan |

---

### 1.2 Solusi: Backend-for-Frontend (BFF) Pattern

Arsitektur BFF memecahkan masalah ini dengan menjadikan **server frontend** (misalnya Next.js) sebagai **Confidential Client** (Klien Rahasia).

**Prinsip utama:**

1. **Browser tidak pernah melihat atau memegang JWT asli.**
   Browser hanya diberikan **Session ID** dalam bentuk Cookie yang dikunci (`httpOnly`, `Secure`, `SameSite=Lax/Strict`).

2. **Next.js (BFF Layer) bertindak sebagai perantara aman** yang:
   - Memegang JWT asli
   - Menyimpannya di tempat terpusat (Redis)
   - Menyuntikkannya (inject) ke header `Authorization` setiap kali browser meminta data ke Microservices

```
┌───────────────┐         ┌───────────────────┐         ┌──────────────────────┐
│    Browser    │         │  Next.js BFF Layer │         │  Backend / IdP       │
│               │         │                   │         │                      │
│  Hanya tahu:  │         │  Memegang:        │         │  Memegang:           │
│  Session ID   │  ◄───►  │  JWT asli di Redis │  ◄───►  │  Database, API, Auth │
│  (Cookie)     │         │                   │         │                      │
└───────────────┘         └───────────────────┘         └──────────────────────┘
```

---

### 1.3 Activity Diagram (Alur Autentikasi)

Berikut adalah alur lengkap bagaimana kredensial ditukar dengan token dan bagaimana token digunakan untuk mengakses data.

#### Fase 1: Login & Token Exchange

```
[Browser/Klien]                 [Next.js BFF Layer]                 [IdP & Core Microservices]
       |                                 |                                      |
       | 1. Submit Login (User/Pass)     |                                      |
       |────────────────────────────────>|                                      |
       |                                 | 2. Minta Token (OAuth Code Flow)     |
       |                                 |─────────────────────────────────────>| (Okta/Auth0/Keycloak)
       |                                 | 3. Return JWT (Access & Refresh)     |
       |                                 |<─────────────────────────────────────|
       |                                 |                                      |
       |                                 | 4. Generate Session ID acak          |
       |                                 | 5. Simpan JWT di REDIS (Key: SessID) |
       | 6. Set-Cookie: SessID           |                                      |
       |    (httpOnly, Secure)           |                                      |
       |<────────────────────────────────|                                      |
       |                                 |                                      |
```

#### Fase 2: Pengambilan Data (Authenticated Request)

```
[Browser/Klien]                 [Next.js BFF Layer]                 [IdP & Core Microservices]
       |                                 |                                      |
       | 7. Request Data (API internal)  |                                      |
       |    + Bawa Cookie SessID         |                                      |
       |────────────────────────────────>|                                      |
       |                                 | 8. Baca SessID dari Cookie           |
       |                                 | 9. Ambil JWT asli dari REDIS         |
       |                                 | 10. Inject JWT ke HTTP Header:       |
       |                                 |     "Authorization: Bearer <JWT>"    |
       |                                 | 11. Teruskan request ke Backend      |
       |                                 |─────────────────────────────────────>| (Core API/Backend)
       |                                 | 12. Kembalikan Data                  |
       |                                 |<─────────────────────────────────────|
       | 13. Teruskan Data ke Browser    |                                      |
       |<────────────────────────────────|                                      |
       |                                 |                                      |
```

---

### 1.4 Setup Redis untuk Penyimpanan Token

Di skala enterprise, menyimpan status sesi di **Redis** adalah **standar emas** karena memungkinkan:

- **Pencabutan sesi (session revocation)** secara instan
- **Kecepatan tinggi** — operasi baca/tulis sub-millisecond
- **Skalabilitas horizontal** — Redis Cluster untuk high availability
- **TTL otomatis** — sesi expired otomatis tanpa cron job

#### Key Structure

```
bff:session:{session_id_dari_cookie}
```

#### Data Payload (JSON)

```json
{
  "userId": "user_12345",
  "accessToken": "eyJhbGciOiJIUzI1Ni...",
  "refreshToken": "def5020054...",
  "expiresAt": 1716300000000
}
```

#### TTL (Time-to-Live)

Disetel **sama dengan umur Refresh Token** (misalnya 7 hari).

> Jika Redis Key terhapus karena TTL, pengguna **otomatis ter-logout** — ini adalah mekanisme auto-expiry yang aman.

---

## Bagian 2: Implementasi Silent Refresh Token, RTR, dan Concurrency Lock

### 2.1 Konsep Refresh Token Rotation (RTR)

Untuk mencegah penyalahgunaan token yang bocor, Identity Provider (IdP) enterprise mewajibkan **Refresh Token Rotation (RTR)**.

**Aturan RTR:**

| Aturan | Penjelasan |
| ------ | ---------- |
| **Single-use** | Sebuah `refresh_token` hanya bisa dipakai **SATU KALI** |
| **Token baru** | Saat ditukar, IdP memberikan `access_token` **baru** dan `refresh_token` **baru** |
| **Invalidation** | Token lama **langsung dihanguskan** setelah dipakai |

```
Refresh Token Lama ──► IdP ──► Access Token Baru + Refresh Token Baru
                                    │
                            Token Lama = INVALID
```

---

### 2.2 Bahaya Race Condition (Penyebab Force Logout)

Aplikasi SPA modern sering memicu **banyak request API secara paralel** (misal: memuat profil, notifikasi, dan daftar produk bersamaan).

**Jika Access Token expired pada saat itu:**

```
Timeline:
─────────────────────────────────────────────────────────────────

  Request A ──┐
  Request B ──┤── Masuk ke BFF bersamaan, semua lihat token EXPIRED
  Request C ──┘

  Request A ──► Kirim refresh_token lama ke IdP ──► ✅ BERHASIL
                                                     Token lama DIHANGUSKAN

  Request B ──► Kirim refresh_token lama ke IdP ──► ❌ DITOLAK (token sudah hangus)
  Request C ──► Kirim refresh_token lama ke IdP ──► ❌ DITOLAK (token sudah hangus)

  IdP mendeteksi Replay Attack ──► 🔴 FORCE LOGOUT SEMUA SESI
```

**Dampak:** Pengguna tiba-tiba ter-logout meskipun tidak melakukan apa-apa — pengalaman pengguna yang sangat buruk.

---

### 2.3 Solusi: Concurrency Lock Menggunakan Redis

Kita harus mengatur agar **hanya Request Pertama** yang melakukan proses pertukaran token, sementara **request lainnya mengantre** dan menunggu token baru tersedia.

#### Alur Mekanisme Lock

```
Request A ──► Cek Token Expired ──► Pasang LOCK di Redis ──► Refresh Token ──► Update Redis ──► Lepas LOCK
                                                                                                    │
Request B ──► Cek Token Expired ──► LOCK sudah terpasang ──► Tunggu (sleep) ──► Baca token baru ◄───┘
                                                                                                    │
Request C ──► Cek Token Expired ──► LOCK sudah terpasang ──► Tunggu (sleep) ──► Baca token baru ◄───┘
```

#### Implementasi Kode (Next.js / Node.js)

```ts
import { Redis } from '@upstash/redis';
import { refreshAccessToken } from '@/lib/oauth';       // Fungsi panggil IdP
import { getSession, updateSession } from '@/lib/session-store';

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getValidAccessToken(
  sessionId: string,
  userId: string,
) {
  let session = await getSession(sessionId);

  // ─── LANGKAH 1: Jika token masih valid, langsung gunakan ───
  if (Date.now() < session.expiresAt) {
    return session.accessToken;
  }

  // ─── LANGKAH 2: TOKEN EXPIRED — Mulai mekanisme LOCKING ───
  const LOCK_KEY = `lock:refresh:${userId}`;
  const MAX_RETRIES = 15; // Tunggu maksimal 3 detik (15 × 200ms)

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {

    // Coba pasang gembok di Redis (Set if Not eXists = NX)
    // EX: 10 → Gembok hancur otomatis dalam 10 detik
    //          agar tidak deadlock jika server crash
    const acquiredLock = await redis.set(LOCK_KEY, 'LOCKED', {
      nx: true,
      ex: 10,
    });

    if (acquiredLock) {
      // ═══ ZONA EKSKLUSIF (Hanya 1 request yang masuk) ═══
      try {
        // Double-check: Siapa tahu token baru saja di-refresh
        // oleh request sebelumnya
        session = await getSession(sessionId);
        if (Date.now() < session.expiresAt) {
          return session.accessToken;
        }

        // Panggil IdP untuk Silent Refresh (RTR)
        const newTokens = await refreshAccessToken(session.refreshToken);

        // Update Redis dengan Token Baru
        session.accessToken = newTokens.accessToken;
        session.refreshToken = newTokens.refreshToken;
        session.expiresAt = newTokens.expiresAt;
        await updateSession(sessionId, session);

        return session.accessToken;
      } finally {
        // WAJIB: Lepas gembok setelah selesai (sukses/gagal)
        await redis.del(LOCK_KEY);
      }

    } else {
      // ═══ ZONA MENUNGGU (Kunci sedang dipegang request lain) ═══
      await sleep(200); // Tidur 200 milidetik

      // Bangun, cek apakah request pertama sudah selesai
      // update token di Redis
      session = await getSession(sessionId);
      if (Date.now() < session.expiresAt) {
        return session.accessToken;
      }
    }
  }

  // Semua retry habis, token masih belum valid
  throw new Error('Timeout menunggu pembaruan token');
}
```

#### Penjelasan Key Concepts dalam Kode

| Konsep | Penjelasan |
| ------ | ---------- |
| **`redis.set(key, value, { nx: true, ex: 10 })`** | `NX` = Set hanya jika key belum ada (atomic lock). `EX: 10` = Key auto-expire 10 detik (anti-deadlock) |
| **Double-check pattern** | Setelah mendapatkan lock, cek ulang apakah token sudah di-refresh oleh request lain yang baru saja selesai |
| **`finally` block** | Gembok **wajib dilepas** baik sukses maupun gagal, mencegah deadlock |
| **Sleep & retry** | Request yang tidak mendapat lock akan menunggu 200ms lalu cek apakah token baru sudah tersedia |
| **MAX_RETRIES** | Batas maksimal percobaan (15 × 200ms = 3 detik) untuk mencegah infinite loop |

---

> **Catatan:** Dokumen ini merupakan referensi arsitektur. Sesuaikan implementasi detail (nama fungsi, library, konfigurasi) dengan tech stack yang digunakan di project Anda.
