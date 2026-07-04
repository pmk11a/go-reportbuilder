# Hari 8: Gudang — Mutasi Stok & Opname

> *"Hari kedelapan — gudang adalah titik kontrol semua pergerakan barang. Bahan masuk dari LPB Pengadaan, keluar ke Produksi via SPK, kadang diretur, kadang perlu koreksi, dan tiap periode harus di-opname. Hari ini Anda akan menguasai 5 submenu gudang yang mengatur semua itu."*

Fokus utama hari ini: **Menu Gudang**. Semua mutasi stok — pengeluaran, retur, koreksi, opname — terjadi di sini dan terintegrasi otomatis dengan buku besar.

---

## Checklist Hari 8

- [ ] Memahami 5 submenu Gudang
- [ ] Membuat Pengeluaran Bahan dari SPK
- [ ] Memahami validasi bahan (hanya dari SPK terotorisasi)
- [ ] Memproses Retur Bahan ke gudang
- [ ] Memvalidasi constraint retur (qty tidak boleh > qty ambil)
- [ ] Membuat Koreksi Bahan (adjustment masuk/keluar)
- [ ] Memahami menu Ubah Ukuran Bahan
- [ ] Melakukan Opname Barang
- [ ] Generate Koreksi Bahan otomatis dari opname

---

## 1. Memahami 5 Submenu Gudang

**Menu: Gudang**

| # | Submenu | Fungsi |
|---|---------|--------|
| 1 | **Pengeluaran Bahan** | Bahan keluar ke produksi (linked dari SPK/Permintaan Bahan) |
| 2 | **Ubah Ukuran Bahan** | Konversi satuan/ukuran bahan |
| 3 | **Koreksi Bahan** | Adjustment stok (masuk/keluar barang non-produksi) |
| 4 | **Opname Barang** | Stok opname (penghitungan fisik) |
| 5 | **Retur Bahan** | Pengembalian bahan ke gudang |

### Alur Bisnis Gudang:

```
┌─────────────────┐
│ SPK (Produksi)  │
│ atau            │
│ Permintaan Bahan│
└────────┬────────┘
         │ (referensi)
         ▼
┌─────────────────┐
│  Pengeluaran    │ ← pilih SPK atau Permintaan Bahan
│  Bahan          │   ambil dari sub-detail
└────────┬────────┘
         │
         ├──▶ Bahan benar-benar keluar
         ├──▶ Stok bahan berkurang otomatis
         └──▶ BUTUH OTORISASI (L1)
                  │
                  ▼
         ┌─────────────────┐
         │ Otorisasi L1    │
         │ → Buku besar    │
         └─────────────────┘

Retur Bahan (jika ada):
  SPK ada retur → Pengeluaran Bahan (tipe retur) → Otorisasi Retur
  Quantity retur TIDAK boleh > quantity ambil sebelumnya
```

---

## 2. Pengeluaran Bahan (Wajib Otorisasi L1)

**Studi kasus:** SPK #SPK-001 butuh 50 kg Kertas HVS. Anda buat Pengeluaran Bahan dari gudang.

### Header Pengeluaran:

| Field | Keterangan |
|-------|------------|
| Gudang | Pilih gudang asal (dropdown) |
| Nomor SPK | Auto-link dari SPK yang butuh bahan |
| Nomor Penyerahan | Auto-generated |

### Detail (Sumber: Sub-detail SPK & Permintaan Bahan Tambahan):

| Field | Keterangan |
|-------|------------|
| Kelompok bahan | Auto dari master |
| Kode bahan | Pilih dari yang sudah ada |
| Kuantitas | Jumlah yang akan keluar |
| Keterangan | Tujuan penggunaan |

### Langkah:

1. Buka **Menu Gudang > Pengeluaran Bahan**
2. Klik **Tambah**
3. Pilih **referensi SPK** atau **Permintaan Bahan**
4. Sistem load detail bahan yang sudah ada di sub-detail SPK
5. Pilih gudang asal
6. Sesuaikan kuantitas jika perlu (tidak boleh lebih dari rencana SPK)
7. Simpan
8. **Otorisasi Level 1** → baru sah dan stok berkurang

> **Penting!** Bahan yang bisa diambil **HANYA** yang sudah ada di sub-detail SPK dan Permintaan Bahan Tambahan yang sudah diotorisasi. Tidak bisa seenaknya mengambil bahan di luar rencana SPK.

### Pertanyaan Umum

**Pertanyaan:** Bahan yang saya mau ambil tidak muncul di daftar.  \
**Jawaban:** Bahan harus sudah didefinisikan di **sub-detail SPK** dan SPK-nya sudah harus ada (Outstanding / Sedang Jalan). Bahan yang tidak masuk rencana SPK tidak bisa diambil.

**Pertanyaan:** Saya sudah simpan Pengeluaran Bahan tapi stok belum berkurang.  \
**Jawaban:** Stok baru berkurang setelah **Otorisasi Level 1**. Sebelum L1, transaksi masih status Draft dan belum berdampak ke stok.

**Pertanyaan:** Bisa ambil bahan tanpa SPK?  \
**Jawaban:** Tidak bisa. Sistem hanya izinkan Pengeluaran Bahan berdasarkan SPK atau Permintaan Bahan Tambahan. Ini untuk mengontrol penggunaan bahan produksi.

---

## 3. Retur Bahan

**Trigger:** SPK ada retur — bahan dikembalikan ke gudang (misal: kelebihan ambil, atau produksi selesai dengan sisa bahan).

### Langkah:

1. Buka **Menu Gudang > Pengeluaran Bahan** → klik **Tambah Retur**
2. Pilih **nomor penyerahan bahan asal** yang akan diretur
3. Isi **kuantitas retur** per bahan
4. Simpan → **Otorisasi Retur Bahan** (L1)

### Constraint Penting:

> Kuantitas retur **TIDAK BOLEH** lebih besar dari kuantitas yang pernah dikeluarkan sebelumnya.

Contoh:
- SPK ambil 100 kg → stok berkurang 100
- Retur hanya boleh maks 100 kg
- Jika Anda input retur 120 kg → **ditolak sistem**

> **Apa yang terjadi di belakang layar?**  \
> Setelah retur diotorisasi, stok bahan **bertambah** kembali, dan jurnal retur otomatis terbentuk di buku besar.

---

## 4. Koreksi Bahan (Adjustment)

**Tujuan:** Adjustment stok untuk alasan **non-produksi** — misal barang rusak, selisih opname, kehilangan, atau ditemukan barang lebih.

### Setup Koreksi:

| Field | Keterangan |
|-------|------------|
| Nomor penyerahan bahan | Auto-generated |
| Gudang | Pilih gudang |
| Keterangan | Alasan koreksi |
| Sub-detail | List bahan yang akan di-adjust |

### Langkah Koreksi Stok Masuk (qty +):

1. Buka **Menu Gudang > Koreksi Bahan**
2. Klik **Tambah**
3. Pilih gudang
4. Di sub-detail:
   - Tambah bahan
   - Kuantitas: positif (untuk barang masuk) atau **isian qty saja**
5. Isi keterangan: "Ditemukan barang lebih di gudang B"
6. Simpan → Otorisasi L1

### Langkah Koreksi Stok Keluar (qty -):

Sama seperti di atas, tapi untuk barang keluar (rusak, hilang, dll). Kuantitas akan mengurangi stok.

> **Penting!** Setiap koreksi butuh **Otorisasi L1** per adjustment. Ini untuk audit trail yang jelas — siapa yang adjust dan kenapa.

---

## 5. Ubah Ukuran Bahan (Konversi Satuan)

**Tujuan:** Konversi satuan/ukuran bahan — misal kilogram → gram, roll → meter, box → pcs.

> **Catatan:** Menu ini **dibatalkan/di-skip** dalam transkrip audio sumber. Pembahasan detail tidak tersedia. Untuk skenario konversi, hubungi admin atau lihat dokumentasi spesifik modul ini.

---

## 6. Opname Barang

**Tujuan:** Penghitungan fisik stok barang — cocokkan stok sistem vs реальный stok di gudang.

### Alur Opname:

1. Buka **Menu Gudang > Opname Barang**
2. Pilih gudang yang akan di-opname
3. Sistem tampilkan daftar barang dengan **stok sistem**
4. Anda input **stok fisik** hasil hitungan
5. Sistem otomatis hitung **selisih**:
   - Selisih positif: stok sistem kurang (ada barang lebih di fisik)
   - Selisih negatif: stok sistem lebih (ada barang hilang di fisik)
6. Klik **Generate Koreksi**
7. Sistem otomatis buat dokumen **Koreksi Bahan** untuk setiap selisih
8. Koreksi Bahan ini perlu di-otorisasi L1 seperti biasa

> **Apa yang terjadi di belakang layar?**  \
> Opname tidak langsung mengubah stok — sistem hanya men-generate dokumen Koreksi Bahan yang masih menunggu otorisasi. Ini untuk kontrol: opname hasil hitungan fisik, tapi adjustment-nya tetap butuh approval.

### Pertanyaan Umum

**Pertanyaan:** Setelah opname, stok tidak berubah.  \
**Jawaban:** Klik tombol **Generate Koreksi** dan otorisasi dokumen Koreksi Bahan yang terbentuk. Opname sendiri hanya menyimpan hasil hitungan.

**Pertanyaan:** Selisih opname terlalu banyak — bisa di-filter?  \
**Jawaban:** Biasanya ada filter "Tampilkan hanya yang ada selisih" di grid opname. Gunakan filter itu untuk review selisih signifikan saja.

---

## 7. Sub-Ledger yang Terlibat

| Sub-Ledger | Update |
|------------|--------|
| **Stok Bahan** | Berkurang saat Pengeluaran Bahan (setelah otorisasi) |
| **Stok Bahan** | Bertambah saat Retur Bahan (setelah otorisasi) |
| **Buku Besar** | Posting jurnal saat otorisasi |
| **Kartu Bahan** | History keluar/masuk per bahan |

---

## Ringkasan Hari 8

Anda telah mempelajari:
- ✅ 5 submenu Gudang dan alur mutasi stok
- ✅ Pengeluaran Bahan dari SPK (wajib otorisasi L1)
- ✅ Validasi: bahan hanya dari SPK terotorisasi
- ✅ Retur Bahan dengan constraint qty
- ✅ Koreksi Bahan untuk adjustment non-produksi
- ✅ Opname Barang + generate Koreksi otomatis

> **Tips untuk besok:** Besok kita masuk ke **Utilitas** — Hitung Ulang Stock, HPP, Proses Posting, dan Audit Trail. Ini modul "pemain belakang panggung" yang menjaga konsistensi data.

---

## Troubleshooting Q&A

**Pertanyaan:** Tidak bisa pilih bahan di Pengeluaran Bahan.  \
**Jawaban:** Pastikan SPK sudah diotorisasi dan sub-detail bahannya sudah terisi. Bahan yang tidak masuk sub-detail SPK tidak akan muncul di pilihan Pengeluaran Bahan.

**Pertanyaan:** Retur Bahan saya ditolak karena qty melebihi.  \
**Jawaban:** Cek kuantitas yang pernah Anda keluarkan di penyerahan asal. Retur tidak boleh lebih dari itu. Sesuaikan qty retur dengan qty ambil.

**Pertanyaan:** Opname sudah selesai tapi stok fisik tidak berubah.  \
**Jawaban:** Pastikan Anda klik **Generate Koreksi** dan dokumen Koreksi Bahan yang terbentuk sudah diotorisasi L1.

**Pertanyaan:** Bisa Koreksi Bahan tanpa otorisasi?  \
**Jawaban:** Bisa input, tapi stok tidak akan berubah dan jurnal tidak terbentuk sampai diotorisasi L1.

**Pertanyaan:** Retur Bahan stok bertambah sebelum otorisasi?  \
**Jawaban:** Tidak. Sama seperti Pengeluaran Bahan, stok baru bertambah setelah **Otorisasi L1**.

**Pertanyaan:** Opname menghasilkan selisih yang tidak realistis.  \
**Jawaban:** Cek apakah ada Pengeluaran Bahan atau Retur yang belum diotorisasi di periode tersebut. Selisih opname bisa terjadi karena mutasi yang belum final.

**Pertanyaan:** Multi-gudang — bagaimana tracking-nya?  \
**Jawaban:** Setiap gudang punya track terpisah. Pilih gudang yang relevan saat buat Pengeluaran/Retur/Koreksi. Laporan per gudang juga tersedia.

**Pertanyaan:** Bisa hapus Pengeluaran Bahan yang sudah diotorisasi?  \
**Jawaban:** Tidak bisa langsung. Harus **Batal Otorisasi** dulu oleh admin senior, baru bisa dihapus. Ini untuk menjaga integritas audit trail.