# Hari 7: Produksi — SPK, Mesin & TK, Hasil Produksi, Finishing, Permintaan Bahan

> *"Hari ketujuh — sekarang kita masuk ke lantai produksi. Setelah Marketing buat SPK dari SO, di sinilah Anda eksekusi produksinya: setup mesin, catat jam kerja, minta bahan ke gudang, sampai catat hasil akhir. Produksi adalah titik temu antara permintaan customer (SO) dan ketersediaan sumber daya (mesin, TK, bahan)."*

Fokus utama hari ini: **Menu Produksi**. Di sini Anda akan mengelola 6 submenu mulai dari SPK sampai Permintaan Bahan Tambahan.

---

## Checklist Hari 7

- [ ] Memahami 6 submenu Produksi
- [ ] Membuat SPK dari Sales Order Outstanding
- [ ] Mengisi detail mesin dan tenaga kerja di SPK
- [ ] Mengisi detail bahan di SPK
- [ ] Setup Mesin & Tenaga Kerja
- [ ] Mencatat Hasil Produksi (barang baik vs rusak)
- [ ] Proses Finishing
- [ ] Membuat Permintaan Bahan ke Gudang
- [ ] Membuat Permintaan Bahan Tambahan
- [ ] Memahami kenapa SPK tidak butuh otorisasi

---

## 1. Memahami 6 Submenu Produksi

**Menu: Produksi**

| # | Submenu | Fungsi |
|---|---------|--------|
| 1 | **SPK (Surat Perintah Kerja)** | Perintah kerja produksi — linked dari SO Marketing |
| 2 | **Mesin & Tenaga Kerja** | Setup mesin, shift, karyawan yang handle |
| 3 | **Proses Finishing** | Tahap akhir produksi (packaging, QC) |
| 4 | **Hasil Produksi** | Catat output produksi (barang jadi) |
| 5 | **Permintaan Bahan** | Request bahan ke gudang jika stok kurang |
| 6 | **Permintaan Bahan Tambahan** | Tambahan request bahan (jika masih kurang) |

### Alur Produksi Lengkap:

```
┌─────────────┐
│ Sales Order │ (dari Marketing, sudah otorisasi L1)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    SPK      │ ← entry: kode barang, mesin, tanggal, shift
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Proses     │ ← isi jam kerja, jam lembur, hasil baik/rusak
│ Produksi    │
└──────┬──────┘
       │
       ├──▶ Permintaan Bahan (jika kurang) → ke Gudang
       │
       └──▶ Hasil Produksi (barang jadi)
                │
                ▼
            Finishing
```

---

## 2. Membuat SPK (Surat Perintah Kerja)

**Catatan Penting:** SPK dibuat dari **Sales Order** yang sudah diotorisasi Level 1 di Marketing. Anda tidak bisa buat SPK tanpa ada SO outstanding.

### Header SPK:

| Field | Keterangan |
|-------|------------|
| Nomor SPK | Auto-generated |
| Tanggal | Tanggal mulai produksi |
| Shift | Shift kerja (1/2/3) |
| Kode barang | Auto-fill dari SO |

### Detail SPK:

| Field | Keterangan |
|-------|------------|
| Kode mesin | Mesin yang mengerjakan |
| Nama mesin | Auto dari master mesin |
| Hasil baik | Output barang bagus |
| Barang rusak | Output barang reject |
| Jam produksi | Total jam kerja |
| Tenaga kerja | Browse dari daftar karyawan |
| Jam kerja | Jam kerja normal |
| Jam lembur | Jam lembur (opsional) |
| Kuantitas | Jumlah barang yang dikerjakan |

### Langkah Membuat SPK:

1. Buka **Menu Produksi > SPK**
2. Di sheet **Outstanding SO**, pilih SO yang akan dibuat SPK
3. Klik **Tambahkan**
4. SPK otomatis terisi kode barang dari SO
5. Isi **tanggal mulai & selesai**
6. Isi **detail mesin** — kode mesin, jam kerja, kuantitas, karyawan
7. (Opsional) Isi **detail bahan** — kode bahan, kuantitas
8. Simpan

> **Penting!** Setelah SPK selesai di-entry, **tidak perlu otorisasi** seperti transaksi keuangan. SPK langsung final setelah entry disimpan. Ini berbeda dengan SO, Invoice, atau dokumen keuangan lainnya.

---

## 3. Detail Mesin & Tenaga Kerja

Setelah entry header SPK, langkah pertama di detail adalah **Setup Mesin**.

### Field Detail Mesin:

| Field | Keterangan |
|-------|------------|
| Nama SPK | SPK yang sedang berjalan (auto) |
| Kode mesin | Browse dari Master Mesin |
| Telah pesan | Status SPK (otomatis) |
| Hasil baik | Output barang bagus |
| Hasil rusak | Output barang reject |
| Telah realisasi | Status sudah selesai |
| Sesuaikan data | Data diisi sesuai SPK |

### Langkah:

1. Klik **Tambah** di sub-detail mesin
2. Pilih **kode mesin**
3. Isi **kuantitas** yang dikerjakan mesin ini
4. Isi **jam produksi** (total jam kerja)
5. Isi **jam kerja normal** dan **jam lembur** (opsional)
6. Pilih **karyawan** dari daftar (per mesin)
7. Simpan

> **Tips:** Satu SPK bisa melibatkan banyak mesin dan karyawan. Tambahkan baris sebanyak kombinasi yang dibutuhkan.

---

## 4. Detail Bahan (Setelah Mesin)

**Dependency Chain:** Bahan baru bisa diisi setelah **Detail Mesin** lengkap.

### Langkah:

1. Klik **kode mesin** di baris detail mesin → masuk ke sub-detail
2. Sistem tampilkan bahan yang digunakan untuk mesin tersebut
3. Tambah bahan:
   - Kode bahan (dari Master Bahan)
   - Kuantitas
   - Berapa kali (pengulangan, opsional)
4. Simpan

> **Apa yang terjadi di belakang layar?**  \
> Kuantitas bahan di SPK akan dipakai sebagai referensi saat Anda membuat **Permintaan Bahan** ke Gudang. Jadi sistem tahu berapa banyak bahan yang dibutuhkan untuk SPK ini.

### Pertanyaan Umum

**Pertanyaan:** Tombol tambah bahan disabled. Kenapa?  \
**Jawaban:** Pastikan **detail mesin sudah diisi dan disimpan** dulu. Sistem menerapkan dependency chain — bahan tidak bisa diisi sebelum mesin.

**Pertanyaan:** Bahan yang saya pilih tidak ada di daftar.  \
**Jawaban:** Setiap mesin punya master bahan sendiri. Pastikan bahan yang Anda pilih memang terasosiasi dengan mesin tersebut.

---

## 5. Mesin & Tenaga Kerja (Setup)

Menu terpisah untuk setup mesin, shift, dan karyawan yang handle.

**Menu: Produksi > Mesin & Tenaga Kerja**

### Setup Awal:

- Daftarkan semua mesin produksi di **Master Mesin**
- Setiap mesin punya **shift** (1/2/3)
- Assign karyawan yang handle per mesin per shift

> **Penting:** Master Mesin & Tenaga Kerja **terpisah** dari Master Karyawan biasa. Ada field tambahan seperti shift yang spesifik untuk produksi.

---

## 6. Permintaan Bahan ke Gudang

Saat produksi berjalan dan stok bahan kurang, Anda request bahan ke gudang melalui menu ini.

**Menu: Produksi > Permintaan Bahan**

### Langkah:

1. Buka menu **Permintaan Bahan**
2. Klik **Tambah**
3. Pilih **referensi SPK** yang butuh bahan
4. Sistem auto-load:
   - Bahan yang didefinisikan di SPK
   - Kuantitas yang diminta
5. Simpan → otomatis kirim ke **Menu Gudang** untuk diproses

> **Apa yang terjadi di belakang layar?**  \
> Permintaan Bahan dari Produksi otomatis muncul di Menu Gudang sebagai **Pengeluaran Bahan** yang menunggu otorisasi L1. Ini cross-module integration.

### Permintaan Bahan Tambahan:

Jika setelah permintaan pertama bahan masih kurang, buat **Permintaan Bahan Tambahan**:
1. Menu: **Produksi > Permintaan Bahan Tambahan**
2. Pilih SPK asal yang sama
3. Isi bahan tambahan dan kuantitas
4. Simpan → kirim ke Gudang

> **Tips:** Permintaan Bahan Tambahan **terpisah** dari Permintaan Bahan biasa. Ini untuk skenario "stok kurang di tengah jalan, butuh tambahan".

---

## 7. Hasil Produksi & Finishing

### Hasil Produksi

**Menu: Produksi > Hasil Produksi**

Setelah produksi selesai, catat output:

1. Klik **Tambah**
2. Pilih **SPK** yang sudah selesai
3. Isi **hasil baik** (barang bagus)
4. Isi **barang rusak** (reject)
5. Simpan

> **Penting!** Barang **baik vs rusak** dicatat terpisah. Hanya **barang baik** yang menambah stok barang jadi. Barang rusak masuk ke catatan tapi **tidak menambah stok**.

### Finishing

**Menu: Produksi > Proses Finishing**

Tahap akhir setelah barang jadi — packaging, labeling, quality check.

1. Pilih **referensi Hasil Produksi** yang sudah final
2. Tandai proses finishing:
   - Packaging selesai?
   - Labeling?
   - Quality check passed?
3. Simpan → status barang jadi **"siap jual"**

> **Tips:** Setelah Finishing, barang baru bisa dibuatkan Surat Jalan di Marketing. Pastikan finishing di-checklist lengkap sebelum lanjut ke pengiriman.

---

## 8. Sub-Ledger yang Terlibat

| Sub-Ledger | Update |
|------------|--------|
| **Stok Barang** | Bertambah saat Hasil Produksi (barang baik) |
| **Kartu Mesin** | History jam kerja per mesin (dari SPK) |
| **Kartu Karyawan** | History kerja di produksi (dari SPK) |
| **Stok Bahan** | Berkurang saat Permintaan Bahan diproses Gudang |
| **SPK Status** | Outstanding → Sedang Jalan → Selesai |

---

## Ringkasan Hari 7

Anda telah mempelajari:
- ✅ 6 submenu Produksi dan alur kerjanya
- ✅ Membuat SPK dari SO Outstanding (tanpa otorisasi)
- ✅ Mengisi detail mesin, TK, dan bahan di SPK
- ✅ Setup Mesin & Tenaga Kerja
- ✅ Membuat Permintaan Bahan ke Gudang (termasuk Tambahan)
- ✅ Mencatat Hasil Produksi (baik vs rusak)
- ✅ Proses Finishing sampai barang "siap jual"

> **Tips untuk besok:** Besok kita masuk ke **Gudang** — partner Produksi untuk kelola stok bahan: Pengeluaran, Retur, Koreksi, sampai Opname.

---

## Troubleshooting Q&A

**Pertanyaan:** SPK saya tidak muncul di sheet Outstanding SO.  \
**Jawaban:** Pastikan SO-nya sudah diotorisasi **Level 1** di Marketing. Refresh halaman atau cek apakah SO ada di bulan aktif.

**Pertanyaan:** Tombol tambah bahan disabled di detail SPK.  \
**Jawaban:** Isi **detail mesin** dulu. Ini aturan dependency — sistem tidak izinkan isi bahan sebelum mesin.

**Pertanyaan:** Hasil produksi saya, stok barang tidak bertambah.  \
**Jawaban:** Pastikan Anda input di kolom **Hasil Baik**, bukan Hasil Rusak. Hanya barang baik yang menambah stok.

**Pertanyaan:** Permintaan Bahan saya tidak muncul di Menu Gudang.  \
**Jawaban:** Cek apakah Permintaan Bahan sudah tersimpan (jangan hanya draft). Juga pastikan ada user gudang yang punya akses untuk terima permintaan.

**Pertanyaan:** SPK tidak perlu otorisasi?  \
**Jawaban:** Benar. SPK langsung final setelah entry — berbeda dengan transaksi keuangan (SO, Invoice, dll). Ini by design agar produksi tidak terhambat menunggu approval.

**Pertanyaan:** Bisa hapus SPK yang sudah selesai?  \
**Jawaban:** SPK yang sudah punya Hasil Produksi atau sudah dipakai Permintaan Bahan tidak bisa dihapus. Ini proteksi data historis produksi.

**Pertanyaan:** Barang rusak di Hasil Produksi — ke mana?  \
**Jawaban:** Tercatat di Hasil Produksi sebagai "Hasil Rusak" tapi **tidak menambah stok**. Untuk adjustment stok keluar (misal: barang rusak dibuang), gunakan **Koreksi Bahan** di Menu Gudang.