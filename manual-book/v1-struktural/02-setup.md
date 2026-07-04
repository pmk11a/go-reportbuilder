# Bab 2 — Setup & Konfigurasi (Menu Berkas)

## Overview

Menu **Berkas** merupakan pusat konfigurasi awal aplikasi. Sebelum transaksi apapun dapat dicatat, operator wajib mengatur: periode kerja, identitas perusahaan, penomoran otomatis, dan manajemen pengguna (user). Bab ini mencakup keenam submenu yang tersedia.

[SCREENSHOT: menu-berkas]

---

## 2.1 Setup Periode Kerja

Menentukan siklus bulanan sistem. Periode ditetapkan Januari–Desember (12 bulan) dan menjadi penentu transaksi mana yang default.

### Field Input

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Bulan Awal | Tanggal | Ya* | Awal periode bulanan (default: 01-xx-xxxx) |
| Bulan Akhir | Tanggal | Ya* | Akhir periode bulanan (default: xx-xx-xxxx) |
| Periode Aktif | Checkbox | Ya* | Otomatis di-set sesuai bulan saat ini |

### Validation Rules
- Periode harus dalam rentang **12 bulan** (Januari–Desember).
- Periode yang sudah ditutup **tidak dapat diubah**.
- Transaksi otomatis mengacu ke periode ini sebagai default.

### Flow
```
[Buka Setup Periode Kerja] --> [Isi Bulan Awal & Akhir] --> [Centang Periode Aktif] --> [Simpan]
```

---

## 2.2 Kunci Periode Kerja

Mengunci periode transaksi agar data tidak dapat diubah kembali.

### Konfigurasi

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Blok Tahunan | Checkbox | Ya* | Centang setiap bulan yang ingin dikunci |
| Alasan Kunci | Teks | Tidak* | Opsional — catatan mengapa dikunci |

### Validation Rules
- **Setelah dikunci**, operasi Tambah, Koreksi, Hapus **tidak bisa** dilakukan untuk transaksi pada bulan tersebut.
- Konsekuensi: data selama periode terkunci bersifat final sesuai kebijakan laporan.

[SCREENSHOT: kunci-periode]

---

## 2.3 Set Nomor Transaksi dan Perusahaan

### Tab A: Profil Perusahaan

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Nama Perusahaan | Teks | Ya* | Nama legal perusahaan |
| Alamat | Teks | Ya* | Alamat lengkap kantor |
| Kota | Teks | Ya* | Lokasi perusahaan |
| Telepon | Teks | Ya* | Nomor telepon kantor |
| Fax | Teks | Ya* | Nomor faks |
| NPWP | Teks | Ya* | Nomor Pokok Wajib Pajak |

### Tab B: Set Nomor Transaksi

| Kode | Keterangan |
|------|------------|
| BKM | Kas Masuk |
| BBM | Bank Masuk |
| BNM | Bukti Memorial |
| BJK | Jurnal (kemungkinan Bukti Jurnal Koran) |
| BCK | Koleksi (Bukti Koleksi/Penerimaan) |

#### Format Nomor Transaksi

| Komponen | Tipe | Required | Keterangan |
|----------|------|----------|------------|
| Nomor Urut | Angka | Ya* | Auto-increment per periode |
| Kode Transaksi | Teks (3 huruf) | Ya* | BKM, BBM, BNM, dll |
| Kode Perusahaan | Teks | Ya* | Kode unik perusahaan |
| Tanggal | Date | Ya* | Tanggal transaksi |

#### Reset Penomoran

| Option | Tipe | Keterangan |
|--------|------|------------|
| Reset Tahunan | Radio Button | Nomor urut reset setiap Januari |
| Reset Bulanan | Radio Button | Nomor urut reset setiap awal bulan |

### Validation Rules
- Format nomor transaksi harus konsisten: `Urutan-KodePerusahaan-Tanggal`.
- Reset penomoran **hanya bisa** dilakukan oleh admin dengan hak khusus.
- Inisial khusus untuk SO (Sales Order) dan Invoice dapat diatur terpisah.

---

## 2.4 Set Pemakaian (Manajemen Pengguna)

Modul user management terdiri dari 3 bagian.

### 4a. CRUD User

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Nama User | Teks | Ya* | Login identifier |
| Password | Teks (masked) | Ya* | Minimal 8 karakter |
| Nama Lengkap | Teks | Ya* | Untuk laporan & otomasi |
| Jabatan | Teks | Ya* | Status pekerjaan |
| Level User | Dropdown | Ya* | 1–5 |

#### Hak Akses per Menu (Checkbox per modul)

| Checkbox | Keterangan |
|----------|------------|
| Tampil | User dapat melihat menu |
| Tambah | User dapat membuat transaksi baru |
| Koreksi | User dapat mengedit transaksi |
| Hapus | User dapat menghapus transaksi |
| Otorisasi | User dapat menyetujui/otorisasi transaksi orang lain |

#### Sistem Otorisasi Berjenjang (5 Level)

| Level | Peran (asumsi) | Keterangan |
|-------|----------------|------------|
| 1 | Operator | Transaksi paling dasar |
| 2 | Staff | Perlu validasi Level 1 |
| 3 | Supervisor | Perlu validasi Level 1 + 2 |
| 4 | Manager | Perlu validasi Level 1 + 2 + 3 |
| 5 | Direktur | Level tertinggi |

**Aturan Penting:**
- Level 2 hanya bisa diotorisasi jika Level 1 sudah diotorisasi terlebih dahulu.
- Satu user hanya boleh ada di **satu level** otorisasi saja (tidak bisa Level 1 sekaligus Level 2).
- Banyak user bisa diotorisasi ke level yang sama.
- Tombol **Batal Otorisasi** mereset semua level yang telah disetujui untuk user terpilih.

[SCREENSHOT: crud-user]

### 4b. Set Report — Hak Akses Laporan

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Akses Report | Checkbox | Ya* | Boleh melihat/mencetak report |
| Desain Report | Checkbox | Ya* | Boleh mengubah desain/layout report |
| User | Dropdown | Ya* | Pilih user yang mendapat akses |

### 4c. Akses COA — Filter Perkiraan

**Antarmuka dua kolom:**
- **Kolom Kiri**: Daftar perkiraan yang user **TIDAK boleh** akses
- **Panah Kanan (→)**: Memindahkan perkiraan ke kolom kanan (memberikan akses)
- **Kolom Kanan**: Daftar perkiraan yang user **boleh** akses

**Pengaruh:** Filter ini mempengaruhi transparansi data di transaksi dan laporan kas per perkiraan yang diizinkan.

[SCREENSHOT: akses-coa]

### 4d. Ganti Password

| Field | Tipe | Keterangan |
|-------|------|------------|
| Password Lama | Teks | Verifikasi identitas lama |
| Password Baru | Teks | Password baru yang diinginkan |
| Konfirmasi Password | Teks | Ulangi password baru |

**Fitur:** User dapat mengganti password sendiri (self-service) tanpa bantuan admin.

### 4e. Lock (Keluar)

Fungsi standar logout aplikasi, mengunci sesi dari akses orang lain.

---

## Error Cases

| Situasi | Pesan Sistem |
|---------|--------------|
| Periode sudah dikunci | "Tidak dapat mengubah transaksi pada periode yang terkunci" |
| Password tidak memenuhi syarat | "Password minimal 8 karakter, mengandung huruf dan angka" |
| Level otorisasi bertabrakan | "User sudah terdaftar di level otorisasi X" |
| User mencoba akses menu tanpa hak | "Akses ditolak untuk modul ini" |

---

## Catatan

> **Langkah Urut Wajib:** Setup Periode Kerja → Kunci Periode (jika perlu) → Setup Perusahaan → Set Nomor → Set Pemakaian → Ganti Password. Setelah semua langkah selesai, baru transaksi dapat dimulai.