# Hari 1: Setup Awal

> *"Selamat pagi! Hari pertama Anda di ERP Trade Exchange dimulai dari pengaturan fondasi sistem. Bayangkan Anda baru pindah ke kantor baru — sebelum bisa bekerja, Anda perlu menyiapkan meja, mendapatkan kunci loker, dan mengenal siapa saja di tim. Begitu pula dengan ERP: kita mulai dari periode, perusahaan, dan user."*

Hari ini kita akan menyiapkan tiga hal: **perusahaan**, **periode kerja**, dan **user**. Tanpa langkah-langkah ini, tidak ada transaksi yang bisa dilakukan.

---

## Checklist Hari 1

- [ ] Buka aplikasi dan login
- [ ] Setup Periode Kerja
- [ ] Kunci Periode Kerja (jika diperlukan)
- [ ] Set Nomor Transaksi dan Perusahaan
- [ ] Set Pemakaian — Buat User dan Atur Hak Akses
- [ ] Ganti Password (opsional)
- [ ] Lock / Logout

---

## 1. Login ke Aplikasi

Buka aplikasi **ERP Trade Exchange**. Layar login akan tampil.

1. Masukkan **username** yang diberikan administrator
2. Masukkan **password**
3. Klik tombol **Login**

> **Penting!** Setelah selesai bekerja, jangan lupa klik **Lock** di **Menu Berkas** untuk mengunci sesi Anda.

---

## 2. Masuk ke Menu Berkas

Dari main menu, klik **Utilities** (ikon gear/preferensi). Di sana terdapat **Menu Berkas** — pusat konfigurasi sistem.

Menu Berkas memiliki 6 submenu yang akan kita bahas hari ini:

1. **Setup Periode Kerja** — Tentukan periode bulanan
2. **Kunci Periode Kerja** — Blokir periode agar tidak bisa diedit
3. **Set Nomor Transaksi dan Perusahaan** — Info perusahaan dan format nomor
4. **Set Pemakaian** — Kelola user dan hak akses
5. **Ganti Password** — Ubah password Anda sendiri
6. **Lock** — Keluar dan kunci aplikasi

Mari kita bahas satu per satu.

---

## 3. Setup Periode Kerja

**Menu Berkas > Setup Periode Kerja**

Periode kerja menentukan bulan mana yang sedang aktif di sistem. Default transaksi dan bulan laporan yang muncul mengikuti periode yang di-set.

### Langkah:

1. Buka **Setup Periode Kerja** dari Menu Berkas
2. Pilih bulan aktif (misalnya: Juli 2026)
3. Simpan

> **Apa yang terjadi di belakang layar?**  
> Sistem menggunakan periode ini untuk menentukan apakah transaksi bisa ditambahkan. Jika periode belum diset atau sudah dikunci, Anda tidak bisa melakukan transaksi baru.

### Pertanyaan Umum

**Pertanyaan:** Kenapa saya tidak bisa menambahkan transaksi?  
**Jawaban:** Kemungkinan periode kerja belum diset atau sudah dikunci. Cek di **Menu Berkas > Kunci Periode Kerja**.

**Pertanyaan:** Apakah bisa有多个 periode aktif sekaligus?  
**Jawaban:** Tidak. Satu periode saja yang aktif pada satu waktu.

---

## 4. Kunci Periode Kerja

**Menu Berkas > Kunci Periode Kerja**

Ini adalah fitur **tutup buku**. Ketika suatu periode dikunci, semua transaksi di bulan tersebut tidak bisa ditambahkan, diubah, atau dihapus lagi.

### Langkah:

1. Buka **Kunci Periode Kerja**
2. Akan muncul daftar 12 bulan (Januari – Desember)
3. Centang bulan yang ingin dikunci
4. Simpan

> **Penting!** Setelah periode dikunci, **TAMBAH, UBAH, dan HAPUS** tidak bisa dilakukan untuk transaksi di bulan tersebut. Ini untuk menjaga integritas laporan keuangan. Gunakan fitur ini setelah **cukup yakin** semua transaksi bulan sebelumnya sudah benar.

### Pertanyaan Umum

**Pertanyaan:** Kalau sudah terlanjur dikunci, bagaimana cara menguncinya?  
**Jawaban:** Periode tidak bisa dibuka kembali secara langsung. Hubungi administrator tingkat tinggi (Level 4 atau 5).

**Pertanyaan:** Apakah periode yang dikunci mempengaruhi laporan?  
**Jawaban:** Tidak justru sebaliknya — periode yang dikunci menjamin laporan keuangan bulan tersebut stabil dan tidak berubah.

---

## 5. Set Nomor Transaksi dan Perusahaan

**Menu Berkas > Set Nomor Transaksi dan Perusahaan**

Bagian ini memiliki dua tab:

### Tab 1: Perusahaan

Isi data perusahaan Anda. Informasi ini akan muncul di header transaksi dan laporan.

| Field | Keterangan |
|-------|-----------|
| Nama Perusahaan | Nama lengkap perusahaan |
| Alamat | Alamat lengkap |
| Kota | Kota domisili |
| Telepon | Nomor telepon |
| Fax | Nomor faksimile |
| NPWP | Nomor Pokok Wajib Pajak |

> **Tips:** Isi semua field karena data ini akan tercetak di semua transaksi (faktur, bukti kas, jurnal, dll).

### Tab 2: Set Nomor Transaksi

Di sini kita mengatur format penomoran bukti transaksi.

#### Kode Transaksi Penting

| Kode | Keterangan |
|------|-----------|
| BKM | Kas Masuk / Bank Masuk |
| BBM | Bank Masuk |
| BNM | Bukti Memorial |
| BJK | Jurnal |
| BCK | Koleksi |
| BKK | Kas Keluar / Bank Keluar |
| BBK | Bukti Bank Keluar |

#### Format Nomor Transaksi

Nomor urut terdiri dari 4 komponen:

```
[Nomor Urut]-[Kode Transaksi]-[Kode Perusahaan]-[Tanggal]
```

Contoh: `001-BKM-PER001-260626`

#### Reset Penomoran

Tentukan apakah penomoran akan di-reset:
- **Bulanan** — nomor dimulai ulang setiap bulan
- **Tahunan** — nomor dimulai ulang setiap tahun

#### Inisial Lainnya

Untuk dokumentasi selain transaksi kas/bank, seperti:
- **SO** (Sales Order)
- **Invoice**

Isi inisial yang sesuai.

> **Apa yang terjadi di belakang layar?**  
> Setiap kali Anda membuat transaksi baru, sistem akan otomatis generate nomor berikutnya berdasarkan format ini. Nomor unik ini penting untuk audit trail.

---

## 6. Set Pemakaian (User Management)

**Menu Berkas > Set Pemakaian**

Ini adalah modul paling penting untuk admin. Di sini Anda mengatur siapa bisa mengakses apa.

Ada tiga sub-fitur:

### 6a. CRUD User

**Menu Berkas > Set Pemakaian > Set Pemakaian Utama**

#### Langkah Membuat User Baru:

1. Klik **Tambah**
2. Isi field berikut:
   - **Nama User** — username untuk login
   - **Password** — password awal
   - **Nama Lengkap** — nama yang ditampilkan
   - **Jabatan** — posisi di perusahaan
   - **Level User** — level otorisasi (1–5)

#### Mengatur Akses Menu

Untuk setiap modul dan laporan, centang hak akses user:

| Checkbox | Artinya |
|----------|---------|
| ✅ Tampil | User bisa melihat menu/laporan |
| ✅ Tambah | User bisa menambah transaksi baru |
| ✅ Koreksi | User bisa mengubah transaksi yang sudah ada |
| ✅ Hapus | User bisa menghapus transaksi |
| ✅ Otorisasi | User bisa memvalidasi transaksi orang lain |

> **Penting!** Setiap menu memiliki 5 jenis akses ini. Atur dengan hati-hati — operator biasa mungkin hanya perlu "Tampil" dan "Tambah", sedangkan supervisor butuh juga "Otorisasi".

#### Sistem Otorisasi 5 Level

Sistem menggunakan hirarki 5 level berjenjang:

```
Level 1: Operator     → bisa input transaksi harian
Level 2: Staff        → bisa otorisasi Level 1
Level 3: Supervisor   → bisa otorisasi Level 1 dan 2
Level 4: Manager      → bisa otorisasi Level 1, 2, dan 3
Level 5: Direktur     → level tertinggi, otorisasi semua
```

**Aturan kritis:**
- Level 2 hanya bisa diotorisasi jika Level 1 sudah diotorisasi
- Satu user hanya boleh aktif di **satu level otorisasi** saja
- Tombol **Batal Otorisasi** — reset semua level sekaligus

**Pertanyaan:** Kenapa Level 2 belum bisa diaktifkan?  
**Jawaban:** Pastikan Level 1 sudah diotorisasi terlebih dahulu. Sistem memerlukan urutan berjenjang.

### 6b. Set Report

**Menu Berkas > Set Pemakaian > Set Report**

Tentukan siapa yang boleh melihat dan mengedit desain laporan.

| Checkbox | Artinya |
|----------|---------|
| ✅ Akses | User boleh melihat dan mencetak laporan |
| ✅ Desain | User boleh mengubah layout/tampilan laporan |

> **Tips:** Biasanya hanya admin atau manajer yang perlu akses "Desain".

### 6c. Akses COA

**Menu Berkas > Set Pemakaian > Akses COA**

Ini adalah filter untuk menentukan akun mana yang bisa diakses user.

**Antarmuka:** Terdiri dari 2 kolom:
- **Kolom Kiri** = Akun yang TIDAK bisa diakses user
- **Kolom Kanan** = Akun yang DIBERIKAN akses (user bisa lihat dan gunakan)

**Cara pakai:**
1. Pilih akun di kolom kiri yang ingin diizinkan
2. Klik panah kanan untuk memindahkan ke kolom kanan
3. Simpan

> **Apa yang terjadi di belakang layar?**  
> Filter ini akan diterapkan otomatis di semua transaksi Kas Bank dan laporan keuangan. User hanya akan melihat dan menggunakan akun yang sudah diizinkan.

---

## 7. Ganti Password

**Menu Berkas > Ganti Password**

Setiap user bisa mengganti password sendiri tanpa bantuan admin.

1. Buka **Ganti Password**
2. Masukkan **password lama**
3. Masukkan **password baru**
4. Konfirmasi password baru
5. Simpan

> **Tips:** Gunakan password yang kuat dan ganti secara berkala, terutama sebelum cuti atau pergantian shift.

---

## 8. Lock (Keluar dari Aplikasi)

**Menu Berkas > Lock**

Ini adalah fungsi logout untuk mengunci aplikasi.

1. Klik **Lock**
2. Aplikasi akan kembali ke layar login

> **Penting!** Selalu lakukan Lock sebelum meninggalkan komputer, terutama di ruang shared atau kantor bersama.

---

## Ringkasan Hari 1

Anda sudah:
- ✅ Mengatur periode kerja agar transaksi bisa berjalan
- ✅ Memahami cara mengunci periode setelah tutup buku
- ✅ Mengisi data perusahaan dan format penomoran
- ✅ Membuat user dan mengatur hak akses lengkap
- ✅ Mengganti password dan logout dengan aman

> **Tips untuk besok:** Hari ini Anda menyiapkan fondasi. Besok kita akan mengisi semua data dasar (Master Data) yang dibutuhkan sistem untuk memproses transaksi.

---

## Troubleshooting Q&A

**Pertanyaan:** Saya sudah setup, tapi masih tidak bisa login. Apa yang salah?  
**Jawaban:** Pastikan username dan password sudah dibuat di **Set Pemakaian > CRUD User**. Hubungi admin jika tidak yakin.

**Pertanyaan:** Kenapa menu "Otorisasi" tidak muncul di hak akses saya?  
**Jawaban:** Anda mungkin bukan user di level yang berhak mengotorisasi. Cek di **Set Pemakaian > Akses COA** dan pastikan level otorisasi Anda sesuai.

**Pertanyaan:** Apakah bisa reset setup yang sudah dilakukan?  
**Jawaban:** Ya, tetapi hati-hati. Perubahan pada Set Nomor Transaksi atau Kunci Periode bisa mempengaruhi histori transaksi. Konsultasikan dengan admin tingkat tinggi.

**Pertanyaan:** Bagaimana kalau saya lupa password sendiri?  
**Jawaban:** Ganti password hanya bisa via **Ganti Password** jika Anda ingat password lama. Jika lupa, admin harus mereset password Anda melalui **Set Pemakaian**.

**Pertanyaan:** Periode sudah dikunci tapi ternyata ada transaksi yang tertinggal?  
**Jawaban:** Anda perlu admin dengan level otorisasi tinggi untuk membuka kembali periode. Lebih baik jangan kunci periode sebelum memastikan semua transaksi sudah lengkap.
