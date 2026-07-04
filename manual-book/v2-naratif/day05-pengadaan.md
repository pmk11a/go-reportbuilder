# Hari 5: Pengadaan — Purchasing Cycle (PR → PO → LPB → Faktur Pajak)

> *"Hari kelima — sekarang kita masuk ke jantung procurement. Bayangkan Anda memesan bahan baku: pertama Anda ajukan permintaan (PR), lalu dibuatkan pesanan ke supplier (PO), supplier kirim barang dan Anda catat penerimaannya (LPB), terakhir supplier kirim tagihan pajak dan Anda catat (Faktur Pajak). Empat tahap ini adalah satu siklus pembelian yang harus Anda kuasai sebagai operator purchasing."*

Fokus utama hari ini: **Menu Pengadaan**. Di sinilah semua alur pembelian — dari permintaan sampai tagihan pajak — terjadi dan terintegrasi otomatis dengan buku besar dan kartu hutang supplier.

---

## Checklist Hari 5

- [ ] Memahami alur 4 tahap procurement (PR → PO → LPB → Faktur Pajak)
- [ ] Membuat Purchase Request (PR)
- [ ] Membuat Purchase Order (PO) dari PR
- [ ] Mencatat Penerimaan ASC (Sub-Contract) — edit harga
- [ ] Mencatat Penerimaan Gudang (LPB) — otorisasi L1 dan L2
- [ ] Membuat Informasi Pembelian (Faktur Pajak) dari LPB
- [ ] Memahami konsep kuantitas berlanjut dan outstanding
- [ ] Mengecek laporan outstanding PR, PO, dan LPB

---

## 1. Memahami Alur Procurement

**Menu: Pengadaan**

Modul Pengadaan punya alur 4 tahap yang saling terkait dengan aturan ketat:

```
┌──────────┐    ┌──────────┐    ┌──────────────────┐    ┌──────────────┐
│   PR     │───▶│   PO     │───▶│  LPB / Terima    │───▶│  Faktur      │
│ Purchase │    │ Purchase │    │  Barang /        │    │  Pajak       │
│ Request  │    │ Order    │    │  Penerimaan ASC  │    │  (Pembelian) │
└──────────┘    └──────────┘    └──────────────────┘    └──────────────┘
   kuantitas       kuantitas        kuantitas             validasi LPB
   berlanjut       berlanjut        berlanjut             belum faktur
   dari PR         dari PO          dari PO/PR
```

**Prinsip Utama:**
- Kuantitas **berlanjut** dari satu tahap ke tahap berikutnya (PR → PO → LPB)
- Jika kuantitas **tidak terpenuhi penuh**, sisanya muncul di laporan **Outstanding**
- Setiap tahap punya **prasyarat** — Anda tidak bisa loncat atau mundur

> **Penting!** Pengadaan punya *dependency chain* yang ketat. Sistem akan menolak jika Anda mencoba membuat PO tanpa PR, atau LPB tanpa PO.

---

## 2. Membuat Purchase Request (PR)

**Studi kasus:** Bagian produksi butuh 100 kg bahan baku "Kertas HVS A4" untuk bulan Juli. Anda ajukan dulu permintaan internal.

### Langkah:

1. Buka **Menu Pengadaan > Purchase Request**
2. Klik tombol **Tambah**
3. Isi header:
   - Tanggal: hari ini
   - Departemen: Produksi
   - Keterangan: Permintaan bahan baku Juli
4. Di detail, tambahkan baris:
   - Kode bahan: pilih dari Master Bahan
   - Kuantitas: **100**
   - Keterangan: Untuk produksi Juli
5. Klik **Simpan**
6. Lakukan **Otorisasi Level 1** jika diperlukan

> **Apa yang terjadi di belakang layar?**  \
> PR yang sudah tersimpan akan muncul di laporan **Outstanding PR** sampai dibuatkan PO. Statusnya "Penuh" jika sudah ada PO dengan kuantitas sesuai, atau "Parsial" jika baru sebagian.

### Pertanyaan Umum

**Pertanyaan:** Bisa edit PR setelah disimpan?  \
**Jawaban:** Bisa, selama belum ada PO yang reference ke PR ini. Jika sudah ada PO, sistem akan menolak.

---

## 3. Membuat Purchase Order (PO)

Setelah PR disetujui, bagian purchasing membuat PO ke supplier.

### Langkah:

1. Buka **Menu Pengadaan > Purchase Order**
2. Klik **Tambah**
3. Pilih **referensi PR** — sistem akan otomatis load:
   - Kode bahan
   - Kuantitas (dari PR)
4. Isi data tambahan:
   - Supplier: pilih dari Master Supplier
   - Harga satuan: harga yang disepakati
   - Tanggal pengiriman yang diharapkan
5. Simpan → otorisasi

> **Penting!** Kuantitas di PO **tidak boleh melebihi** kuantitas di PR yang reference. Jika Anda butuh lebih, buat PR tambahan dulu.

### Status Kuantitas

| Status | Arti |
|--------|------|
| **Penuh** | Kuantitas PO = kuantitas PR (atau lebih besar) |
| **Parsial** | Kuantitas PO baru sebagian dari PR |

> **Tips:** Selalu cek **Outstanding PR** sebelum buat PO baru — supaya tidak duplikat permintaan.

---

## 4. Penerimaan ASC (Sub-Contract)

**Tipe Penerimaan 1: ASC (Asing/Sub-Contract)**

Penerimaan ASC muncul otomatis dari PO khusus supplier sub-contract. Yang bisa diedit hanya **harga**.

### Yang Bisa Dilakukan:

| Aksi | Keterangan |
|------|-----------|
| Koreksi harga | Ya — hanya kolom harga |
| Edit kuantitas | Tidak — read-only |
| Edit supplier | Tidak |
| Edit kode barang | Tidak |

### Alur:

1. PO sudah dibuat dengan tipe ASC
2. Barang datang → sistem otomatis generate form Penerimaan ASC
3. Anda klik **Koreksi** → hanya kolom **Harga** yang bisa diedit
4. Sesuaikan harga jika ada perubahan dari PO
5. Simpan → otorisasi

> **Apa yang terjadi di belakang layar?**  \
> Setelah otorisasi, data ASC akan membentuk jurnal otomatis dan update kartu hutang supplier, sama seperti LPB.

---

## 5. Penerimaan Gudang (LPB) — Otorisasi Bertingkat

**Tipe Penerimaan 2: LPB (Laporan Penerimaan Barang)**

Ini adalah penerimaan barang normal ke gudang. Trigger utama untuk jurnal otomatis.

### Langkah Membuat LPB:

1. Buka **Menu Pengadaan > Penerimaan Barang** (atau LPB)
2. Klik **Tambah**
3. Pilih **referensi PO** → sistem load:
   - Supplier
   - Kode barang
   - Kuantitas order
4. Isi detail:
   - **Gudang tujuan**: pilih gudang penerima
   - **Kuantitas yang datang**: bisa parsial (misal: PO 100, datang 60)
   - Keterangan (opsional)
5. Simpan
6. **Otorisasi Level 1** (entry validation)
7. **Otorisasi Level 2** (final approval)

### Efek Setelah Otorisasi L2:

| Target | Update |
|--------|--------|
| **Buku Besar** | Jurnal otomatis terbentuk |
| **Sub-Ledger Gudang** | Kartu stok barang bertambah |
| **Kartu Hutang Supplier** | Record hutang baru |

> **Penting!** Otorisasi L2 adalah trigger final. Pastikan semua data sudah benar sebelum L2 — setelah L2, koreksi butuh admin senior via **Batal Otorisasi**.

### Pertanyaan Umum

**Pertanyaan:** LPB saya belum muncul di kartu hutang supplier. Kenapa?  \
**Jawaban:** Pastikan sudah **Otorisasi L2**. Hanya L2 yang trigger jurnal ke buku besar dan kartu hutang. L1 saja belum cukup.

**Pertanyaan:** Bisa buat LPB tanpa PO?  \
**Jawaban:** Tidak bisa. LPB harus reference ke PO yang ada. Sistem akan menolak jika Anda coba buat LPB tanpa PO.

---

## 6. Informasi Pembelian (Faktur Pajak)

Setelah LPB dibuat, supplier akan mengirim faktur pajak. Anda catat di menu **Informasi Pembelian**.

### Langkah:

1. Buka **Menu Pengadaan > Informasi Pembelian**
2. Pilih **sub-ledger supplier** (dropdown dari Master Supplier)
3. Sistem akan menampilkan **daftar LPB dari supplier ini yang belum punya faktur pajak**
4. **Centang** LPB yang akan diberi faktur pajak (bisa lebih dari satu)
5. Klik tombol **Proses**
6. Sistem otomatis generate draft faktur pajak
7. Lakukan **Otorisasi L1 → L2**

### Hasil Setelah Otorisasi L2:

- ✅ Jurnal otomatis ke **Buku Besar**
- ✅ **Kartu hutang supplier** di sub-leder bertambah
- ✅ LPB yang dicentang ditandai sudah punya faktur

> **Tips:** Anda bisa centang banyak LPB sekaligus untuk diproses dalam satu faktur pajak. Ini memudahkan saat supplier mengirim satu faktur untuk multiple pengiriman barang.

### Pertanyaan Umum

**Pertanyaan:** Saya coba buat faktur pajak tanpa centang LPB. Kenapa gagal?  \
**Jawaban:** Minimal harus centang satu LPB. Sistem butuh referensi LPB untuk generate faktur pajak — tanpa LPB, faktur tidak valid.

**Pertanyaan:** LPB yang saya cari tidak muncul di daftar. Kenapa?  \
**Jawaban:** Cek dua hal: (1) LPB sudah punya faktur pajak atau belum. (2) LPB berasal dari supplier yang Anda pilih. Pastikan Anda pilih supplier yang benar.

---

## 7. Memahami Kuantitas Berlanjut (Quantity Carry-Through)

Prinsip kunci: kuantitas mengalir dari PR ke PO ke LPB.

```
PR.qty_ordered  = 100
PO.qty_ordered  = 100  (dari PR)
LPB.qty_received = 60   (dari PO, parsial)
Outstanding PO  = 40   (sisa yang belum diterima)
```

Jika LPB **parsial** (tidak penuh), Anda bisa buat LPB tambahan untuk menerima sisanya. Setiap LPB tambahan tetap reference ke PO yang sama.

### Laporan Outstanding:

| Laporan | Tracking |
|---------|----------|
| **Outstanding PR** | PR yang belum punya PO dengan kuantitas penuh |
| **Outstanding PO** | PO yang belum punya LPB dengan kuantitas penuh |
| **Outstanding LPB** | LPB yang belum punya Faktur Pajak |

Status: **Penuh** (fulfilled) atau **Parsial** (sebagian).

> **Penting!** Selalu cek laporan outstanding sebelum tutup periode. Pastikan semua transaksi procurement sudah lengkap sampai faktur pajak.

---

## Ringkasan Hari 5

Anda telah mempelajari:
- ✅ Alur 4 tahap procurement (PR → PO → LPB → Faktur Pajak)
- ✅ Membuat PR sebagai permintaan internal
- ✅ Membuat PO ke supplier dari PR
- ✅ Mencatat Penerimaan ASC (edit harga saja)
- ✅ Mencatat LPB dengan otorisasi L1 + L2
- ✅ Membuat Faktur Pajak dari LPB yang belum punya faktur
- ✅ Konsep kuantitas berlanjut dan laporan outstanding

> **Tips untuk besok:** Besok kita masuk ke **Marketing** — alur penjualan dari SO sampai Invoice dan Retur.

---

## Troubleshooting Q&A

**Pertanyaan:** Tidak bisa hapus PO. Kenapa?  \
**Jawaban:** PO yang sudah punya LPB atau Penerimaan ASC tidak bisa dihapus. Ini proteksi sistem untuk menjaga integritas data. Batalkan dulu LPB-nya jika perlu, atau hubungi admin.

**Pertanyaan:** Tidak bisa hapus PR.  \
**Jawaban:** Sama seperti PO — PR yang sudah punya PO reference tidak bisa dihapus.

**Pertanyaan:** Otorisasi L2 LPB sudah diklik, tapi jurnal tidak terbentuk.  \
**Jawaban:** Pastikan Anda login dengan user yang punya hak Otorisasi L2. Cek juga periode kerja — jika periode sudah dikunci, otorisasi tidak bisa dilakukan.

**Pertanyaan:** Kuantitas di LPB lebih besar dari PO. Kenapa ditolak?  \
**Jawaban:** Sistem hanya izinkan LPB sampai kuantitas PO. Jika kelebihan barang datang, catat sebagai koreksi stok via menu **Koreksi Bahan** di Gudang.

**Pertanyaan:** Bisa buat satu Faktur Pajak untuk multiple LPB?  \
**Jawaban:** Bisa. Centang beberapa LPB sekaligus saat di form Informasi Pembelian, lalu klik Proses.

**Pertanyaan:** Laporan Outstanding PR kosong padahal saya yakin ada PR yang belum dibuat PO.  \
**Jawaban:** Cek filter periode — laporan outstanding biasanya per bulan. Pastikan Anda pilih periode yang sesuai.