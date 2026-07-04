# Hari 9: Utilitas — Posting, HPP, Hitung Ulang Stock, Audit Trail

> *"Hari kesembilan — utilitas sering dianggap modul belakang panggung, tapi sebenarnya ini 'penjaga gawang' konsistensi data. Posting otomatis menggerakkan jurnal ke buku besar. Hitung Ulang Stock memastikan stok akurat. HPP menghitung harga pokok. Audit Trail mencatat siapa mengubah apa. Pahami semua ini, dan Anda akan jadi operator yang handal."*

Fokus utama hari ini: **Menu Utilitas**. Ini adalah utility module untuk maintenance, recalculate, posting, dan audit — bukan untuk input transaksi harian.

---

## Checklist Hari 9

- [ ] Memahami 5 submenu Utilitas
- [ ] Menjalankan Hitung Ulang Stock per bulan
- [ ] Menjalankan Hitung Ulang Stock per barang
- [ ] Menghitung HPP (Harga Pokok Penjualan)
- [ ] Menjalankan Proses Posting
- [ ] Memahami hanya transaksi terotorisasi yang diproses
- [ ] Mengakses Buku Aktivitas Pemakai (Audit Trail)
- [ ] Filter audit trail by user, tanggal, form, transaksi

---

## 1. Memahami 5 Submenu Utilitas

**Menu: Utilitas**

| # | Submenu | Fungsi |
|---|---------|--------|
| 1 | **Hitung Ulang Stock** | Recalculate stok per bulan (semua/per barang) |
| 2 | **HPP** | Hitung Harga Pokok Penjualan / harga barang jadi |
| 3 | **Proses Posting** | Posting otomatis jurnal & kartu ke laporan keuangan |
| 4 | **Buku Aktivitas Pemakai** | Audit trail perubahan data per user |
| 5 | (Lainnya) | Submenu tambahan sesuai kebutuhan |

### Alur Utilitas:

```
┌─────────────────┐
│  Transaksi      │ (semua yang sudah diotorisasi)
│  Harian         │ - Invoice Penjualan
└────────┬────────┘ - Pemakaian Bahan
         │          - Hasil Produksi
         │          - Surat Jalan
         │          - Pembelian (LPB)
         ▼
┌─────────────────┐
│ Proses Posting  │ ← trigger: semua yang sudah diotorisasi
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Laporan        │
│  Keuangan       │ - Buku Besar
└─────────────────┘ - Kartu Sub-Ledger
```

> **Penting!** Utilitas **bukan** modul input transaksi harian. Ini utility module untuk maintenance, recalculate, posting, dan audit. Pengisian transaksi tetap dilakukan di modul masing-masing (Akunting, Pengadaan, Marketing, Produksi, Gudang).

---

## 2. Hitung Ulang Stock

**Tujuan:** Recalculate stok barang dalam satu periode (bulanan). Berguna setelah ada koreksi atau untuk memastikan konsistensi.

### Parameter:

| Parameter | Opsi |
|-----------|------|
| **Scope** | Semua barang / per barang |
| **Periode** | Bulanan |
| **Trigger** | Pembelian, penjualan, pengeluaran gudang |

### Output:

- Kuantitas stok akhir periode
- Adjustment jika ada selisih dengan opname
- Update master item (stok terkini)

### Langkah Hitung Ulang Semua Barang:

1. Buka **Menu Utilitas > Hitung Ulang Stock**
2. Pilih **scope**: Semua Barang
3. Pilih **periode**: bulan yang akan dihitung (misal Juni 2026)
4. Klik **Proses** / **Hitung**
5. Sistem jalankan recalculate → update stok master

### Langkah Hitung Ulang Per Barang:

1. Sama seperti di atas, tapi pilih scope **Per Barang**
2. Pilih **kode barang** yang akan dihitung
3. Pilih periode
4. Proses

> **Tips:** Gunakan **Hitung Ulang Per Barang** saat ada satu item spesifik yang stoknya perlu diverifikasi. Lebih cepat dari hitung ulang semua.

### Pertanyaan Umum

**Pertanyaan:** Kapan harus jalankan Hitung Ulang Stock?  \
**Jawaban:** Biasanya setelah tutup buku bulanan, atau saat ada indikasi stok sistem tidak sesuai ekspektasi. Bisa juga setelah opname untuk validasi.

**Pertanyaan:** Apakah Hitung Ulang Stock mengubah data master?  \
**Jawaban:** Ya — stok terkini di master item akan ter-update sesuai hasil perhitungan.

---

## 3. HPP (Harga Pokok Penjualan)

**Tujuan:** Hitung harga barang jadi (output produksi). Bisa berdasarkan bahan atau proses produksi.

### Parameter:

| Parameter | Opsi |
|-----------|------|
| **Scope** | Semua barang / per barang |
| **Input** | Master bahan, proses produksi, bahan jadi |
| **Output** | HPP per barang jadi |

### Sumber Data HPP:

- Master Bahan (harga bahan)
- Master Proses Produksi (biaya proses)
- Master Mesin (biaya mesin, jam kerja)
- Master Karyawan (biaya TK langsung)

### Langkah:

1. Buka **Menu Utilitas > HPP**
2. Pilih scope:
   - **Semua barang**: hitung ulang HPP untuk semua barang jadi
   - **Per barang**: pilih kode barang tertentu
3. Pilih **periode**
4. Klik **Proses**
5. Sistem hitung HPP berdasarkan formula yang menggunakan semua sumber data di atas

> **Apa yang terjadi di belakang layar?**  \
> HPP adalah cross-module calculation — sistem ambil data dari Master Bahan, Master Proses, Master Mesin, dan Master Karyawan, lalu hitung harga pokok per barang jadi. Ini otomatis, tapi sumber datanya harus lengkap dan akurat.

> **Tips:** Sebelum hitung HPP, pastikan semua master sudah benar. HPP yang salah biasanya karena master tidak lengkap.

---

## 4. Proses Posting

**Tujuan:** Posting otomatis jurnal & update kartu sub-ledger ke laporan keuangan. Ini "jantung" siklus akuntansi.

### Yang Diproses:

| Asal Data | Tipe | Sub-Ledger Impact |
|-----------|------|--------------------|
| Invoice Penjualan | Jurnal + kartu | Piutang Customer |
| Pemakaian Bahan | Jurnal | Stok Bahan |
| Hasil Produksi | Jurnal | Stok Barang Jadi |
| Surat Jalan | Jurnal | Stok + Piutang |
| Pembelian (LPB) | Jurnal + kartu | Hutang Supplier |
| Pemakaian Bahan (ACC) | Jurnal | Stok |

### Syarat Penting:

> **Hanya transaksi yang sudah diotorisasi yang ikut proses posting.** Transaksi Draft atau Diajukan akan di-skip.

### Multi-Proses dalam Posting:

Proses Posting bisa menjalankan beberapa sub-proses sekaligus:
- **Proses Jurnal** (ke Buku Besar)
- **Proses Kartu** (ke Sub-Ledger)
- **Proses Auto-Posting** (aturan-aturan otomatis)
- **Proses HPP** (recalculate)

### Langkah:

1. Buka **Menu Utilitas > Proses Posting**
2. Pilih **periode** yang akan di-posting
3. Pilih **sub-proses** yang ingin dijalankan (bisa lebih dari satu)
4. Klik **Proses**
5. Sistem jalankan posting → jurnal terbentuk, kartu sub-ledger update

> **Penting!** Sebelum klik Proses, pastikan semua transaksi di periode tersebut sudah diotorisasi. Transaksi yang belum final tidak akan ikut proses.

### Pertanyaan Umum

**Pertanyaan:** Buku besar tidak ter-update setelah transaksi.  \
**Jawaban:** Cek apakah Anda sudah menjalankan **Proses Posting** di Utilitas. Transaksi yang diotorisasi saja belum cukup — perlu di-posting dulu.

**Pertanyaan:** Kenapa transaksi saya tidak muncul di Proses Posting?  \
**Jawaban:** Pastikan transaksi sudah diotorisasi **final** (semua level yang dibutuhkan). Transaksi Draft atau Pending tidak ikut proses.

**Pertanyaan:** Bisa Proses Posting transaksi bulan lalu?  \
**Jawaban:** Bisa, tapi pastikan periode bulan lalu tidak sudah dikunci. Jika dikunci, Anda tidak bisa posting di periode tersebut.

**Pertanyaan:** Posting bisa diulang?  \
**Jawaban:** Bisa, sistem biasanya handle ini dengan idempotent. Tapi pastikan Anda paham dampaknya — kalau ragu, konsultasikan dengan admin.

---

## 5. Buku Aktivitas Pemakai (Audit Trail)

**Tujuan:** Track semua perubahan data per user. Ini alat forensik untuk melihat siapa mengubah apa dan kapan.

### Yang Di-track:

- Tanggal perubahan
- User yang melakukan
- Form/modul yang berubah
- Tabel yang berubah
- Nilai sebelum & sesudah (diff)
- Jenis perubahan (tambah/edit/hapus)

### Cara Cari:

| Filter | Keterangan |
|--------|------------|
| **Tanggal** | Periode waktu |
| **User** | User tertentu |
| **Form/Modul** | Modul tertentu |
| **Transaksi** | Nomor transaksi tertentu |
| **Tipe Aksi** | Tambah / Koreksi / Hapus |

### Langkah:

1. Buka **Menu Utilitas > Buku Aktivitas Pemakai**
2. Pilih **filter** yang diinginkan (tanggal, user, form, dll)
3. Klik **Tampilkan**
4. Sistem tampilkan daftar perubahan data yang sesuai filter
5. Klik baris tertentu untuk lihat detail before/after

> **Tips:** Gunakan audit trail saat ada selisih data yang tidak bisa dijelaskan — biasanya ada user yang edit/hapus tanpa sengaja.

---

## 6. Catatan Penting tentang Utilitas

1. **Proses Posting** hanya memproses transaksi **sudah diotorisasi** — transaksi Draft di-skip
2. **Hitung Ulang Stock** bisa **semua barang atau per barang** — pilih scope sesuai kebutuhan
3. **HPP** sumber data: master bahan + proses + mesin + karyawan (cross-module)
4. **Buku Aktivitas Pemakai** = audit trail — bisa filter by tanggal, user, form, transaksi
5. **Multi-proses dalam Posting** — bukan single action, tapi bisa batch sekaligus
6. **Utilitas adalah utility modul** untuk maintenance, recalculate, posting, audit — bukan input transaksi harian

---

## Ringkasan Hari 9

Anda telah mempelajari:
- ✅ 5 submenu Utilitas dan perannya
- ✅ Hitung Ulang Stock (semua / per barang)
- ✅ HPP dengan sumber data cross-module
- ✅ Proses Posting untuk jurnal & kartu sub-ledger
- ✅ Syarat: hanya transaksi terotorisasi
- ✅ Buku Aktivitas Pemakai (audit trail) dengan filter

> **Tips untuk besok:** Besok kita tutup seri panduan ini dengan **Troubleshooting** — kumpulan pertanyaan dan solusi untuk semua modul yang sudah dipelajari.

---

## Troubleshooting Q&A

**Pertanyaan:** Saya jalankan Proses Posting tapi tidak ada yang terproses.  \
**Jawaban:** Cek apakah ada transaksi **sudah diotorisasi** di periode tersebut. Jika tidak ada, proses tidak menghasilkan apa-apa. Bukan error, hanya tidak ada data yang memenuhi syarat.

**Pertanyaan:** HPP terhitung tapi angkanya tidak realistis.  \
**Jawaban:** Cek kelengkapan master: Master Bahan (harga), Master Mesin (tarif), Master Karyawan (upah), Master Proses (biaya proses). HPP akurat hanya jika sumber datanya lengkap.

**Pertanyaan:** Audit trail tidak menampilkan data user tertentu.  \
**Jawaban:** Pastikan filter User sudah benar dan user tersebut memang melakukan perubahan di periode yang dipilih. Audit trail hanya mencatat perubahan, bukan sekadar viewing.

**Pertanyaan:** Bisa Hitung Ulang Stock untuk periode yang sudah dikunci?  \
**Jawaban:** Tergantung setting sistem. Umumnya tidak bisa — periode yang dikunci bersifat read-only untuk menjaga konsistensi data historis.

**Pertanyaan:** Buku Aktivitas Pemakai mencatat perubahan password user juga?  \
**Jawaban:** Tergantung konfigurasi audit. Beberapa sistem mencatat, beberapa tidak. Cek dengan admin untuk setting spesifik.

**Pertanyaan:** Setelah Posting, kartu sub-leder customer tidak ter-update.  \
**Jawaban:** Pastikan transaksi invoice sudah final diotorisasi **Level 2** (bukan hanya L1), dan Anda centang "Proses Kartu" di sub-proses Posting.

**Pertanyaan:** Hitung Ulang Stock lambat untuk scope semua barang.  \
**Jawaban:** Wajar — proses ini baca semua transaksi dalam periode dan hitung ulang. Untuk item tertentu, gunakan scope "Per Barang" agar lebih cepat.