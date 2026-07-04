# Hari 6: Marketing — Sales Order → SPK → Surat Jalan → Invoice → Retur

> *"Hari keenam — sekarang giliran sisi penjualan. Alur marketing dimulai dari customer memesan (SO), Anda buat perintah kerja produksi (SPK), kirim barang (Surat Jalan), tagih (Invoice), sampaiangani retur dan credit note. Panjang? Ya, tapi setiap tahap punya peran penting dalam rantai penjualan."*

Fokus utama hari ini: **Menu Marketing**. Di sini Anda akan mengelola 9 submenu penjualan — dari Sales Order sampai Retur Gudang.

---

## Checklist Hari 6

- [ ] Memahami 9 submenu Marketing
- [ ] Membuat Sales Order (SO) baru
- [ ] Memilih sales dan customer dari master
- [ ] Memahami integrasi SO ke Produksi (SPK)
- [ ] Mengakses menu Surat Perintah Kirim
- [ ] Membuat Surat Jalan (pengiriman barang)
- [ ] Membuat Invoice Penjualan
- [ ] Membuat Faktur Pajak Penjualan
- [ ] Memproses Retur Surat Jalan
- [ ] Membuat Credit Note untuk koreksi invoice
- [ ] Memproses Retur Gudang

---

## 1. Memahami 9 Submenu Marketing

**Menu: Marketing**

| # | Submenu | Fungsi |
|---|---------|--------|
| 1 | **Sales Order (SO)** | Pesanan dari customer — trigger untuk produksi |
| 2 | **Surat Perintah Kirim** | Perintah pengiriman barang ke customer |
| 3 | **Surat Jalan** | Dokumen pengiriman barang |
| 4 | **Invoice Penjualan** | Tagihan ke customer |
| 5 | **Faktur Pajak Penjualan** | Faktur pajak (PPN) untuk penjualan |
| 6 | **Retur Penjualan** | Retur barang dari customer |
| 7 | **Retur Surat Jalan** | Retur untuk dokumen surat jalan |
| 8 | **Credit Note** | Nota kredit (koreksi tagihan) |
| 9 | **Retur Gudang** | Retur barang ke gudang |

### Alur Bisnis Utama:

```
┌──────────┐    ┌─────────────┐    ┌──────────┐    ┌─────────┐    ┌────────────┐
│  Sales   │───▶│    SPK      │───▶│  Surat   │───▶│ Invoice │───▶│  Faktur    │
│  Order   │    │ (Produksi)  │    │  Jalan   │    │Penjualan│    │  Pajak     │
└──────────┘    └─────────────┘    └──────────┘    └─────────┘    └────────────┘
     │                                    │
     │                                    ▼
     │                            ┌──────────────┐
     │                            │ Retur        │
     │                            │ Surat Jalan  │
     └───────────────────────────▶│              │
                                  └──────────────┘
```

> **Penting!** SPK (Surat Perintah Kerja) sebenarnya ada di **Menu Produksi**, bukan Marketing. Tapi trigger-nya dari sini — SO yang sudah diotorisasi akan muncul di Produksi untuk dibuatkan SPK.

---

## 2. Membuat Sales Order (SO)

**Studi kasus:** Customer "PT Maju Jaya" memesan 500 pcs produk "Box Premium" untuk pengiriman minggu depan.

### Langkah:

1. Buka **Menu Marketing > Sales Order**
2. Klik tombol **Tambah**
3. Isi header:
   - **Sales**: pilih dari dropdown karyawan yang berstatus "Sales" di Master Karyawan
   - **Pelanggan**: pilih dari Master Customer
   - Tanggal: hari ini
4. Di detail, tambahkan baris:
   - **Kode barang**: pilih dari Master Item
   - **Kuantitas**: 500
   - Harga: otomatis ter-load dari master (bisa di-override jika perlu)
5. Klik **Simpan**
6. Lakukan **Otorisasi Level 1**

> **Apa yang terjadi di belakang layar?**  \
> Setelah SO diotorisasi L1, sistem otomatis link ke **Menu Produksi** — SO muncul di sheet **Outstanding SO** untuk dibuatkan SPK.

### Pertanyaan Umum

**Pertanyaan:** Dropdown Sales kosong. Kenapa?  \
**Jawaban:** Pastikan karyawan yang akan Anda pilih punya status "Sales" di **Master Karyawan**. Karyawan non-sales tidak muncul di dropdown SO.

**Pertanyaan:** Harga tidak auto-load saat pilih barang.  \
**Jawaban:** Pastikan barang sudah punya harga jual di Master Item. Jika belum, input harga manual di baris detail.

---

## 3. Integrasi SO → SPK (di Menu Produksi)

Setelah SO diotorisasi L1, Anda pindah ke **Menu Produksi** untuk membuat SPK.

### Langkah di Menu Produksi:

1. Buka **Menu Produksi > SPK**
2. Anda akan melihat **2 sheet**:
   - **Outstanding SO**: SO yang sudah diotorisasi tapi belum dibuat SPK
   - **Daftar SO Pasti**: SO yang sudah dibuatkan SPK
3. Klik SO yang akan dibuat SPK di sheet **Outstanding**
4. Klik tombol **Tambahkan**
5. SPK otomatis terisi dengan kode barang dari SO
6. Isi tambahan:
   - Tanggal mulai
   - Tanggal selesai
   - **Detail 1 (Mesin)**: kode mesin, kuantitas, jam kerja, karyawan
   - **Detail 2 (Bahan)**: kode bahan, kuantitas (opsional, harus isi mesin dulu)

> **Penting!** **Detail Bahan tidak bisa diisi sebelum Detail Mesin diisi**. Ini aturan dependency chain di sistem.

### Detail 1: Mesin & Karyawan

| Field | Keterangan |
|-------|------------|
| Kode mesin | Mesin yang mengerjakan |
| Kuantitas | Jumlah yang dikerjakan |
| Jam kerja | Total jam kerja normal |
| Jam jumlah | Total jam (otomatis) |
| Karyawan | Klik dari daftar karyawan per mesin |

> **Tips:** Satu SPK bisa punya banyak kombinasi mesin-karyawan. Setiap mesin bisa handle beberapa karyawan sekaligus.

---

## 4. Surat Perintah Kirim & Surat Jalan

Setelah barang selesai diproduksi (lewat SPK → finishing), Anda kirim ke customer.

### Surat Perintah Kirim:

Ini adalah instruksi internal untuk staff gudang agar menyiapkan barang. Tidak terkait langsung dengan invoice.

### Surat Jalan:

**Studi kasus:** Kirim 500 pcs Box Premium ke PT Maju Jaya.

1. Buka **Menu Marketing > Surat Jalan**
2. Klik **Tambah**
3. Pilih referensi:
   - **SO** atau **Surat Perintah Kirim** sebagai acuan
4. Isi:
   - Customer: PT Maju Jaya (auto dari SO)
   - Tanggal kirim
   - Ekspedisi (opsional)
5. Detail:
   - Kode barang, kuantitas (auto-load dari SO)
6. Simpan → otorisasi

### Efek Setelah Otorisasi:

- ✅ Stok barang berkurang otomatis
- ✅ Siap untuk dibuat Invoice Penjualan

---

## 5. Invoice Penjualan & Faktur Pajak

### Membuat Invoice:

1. Buka **Menu Marketing > Invoice Penjualan**
2. Klik **Tambah**
3. Pilih referensi **Surat Jalan** → auto-load customer & barang
4. Isi tambahan:
   - Tanggal invoice
   - Jatuh tempo
   - PPN (jika ada)
5. Simpan → **Otorisasi L1 → L2**

### Efek Setelah Otorisasi L2:

| Target | Update |
|--------|--------|
| **Piutang Customer** | Bertambah di sub-ledger |
| **Buku Besar** | Jurnal pendapatan + piutang |
| **Kartu Piutang** | Record invoice baru |

### Faktur Pajak Penjualan:

1. Buka **Menu Marketing > Faktur Pajak Penjualan**
2. Pilih customer → sistem tampilkan invoice yang belum punya faktur
3. Centang invoice → Proses → Otorisasi L1/L2

---

## 6. Retur Surat Jalan

**Studi kasus:** Customer mengembalikan 50 pcs barang dari pengiriman terakhir karena rusak.

### Langkah:

1. Buka **Menu Marketing > Retur Surat Jalan**
2. Klik **Tambah**
3. Pilih **Surat Jalan asal** yang akan diretur
4. Sistem load barang yang diretur
5. Isi **kuantitas retur** per barang (tidak boleh > kuantitas asal)
6. Keterangan/alasan retur
7. Simpan → Otorisasi L1/L2

### Efek:

- Stok customer berkurang untuk barang yang diretur
- Stok barang kembali ke master (atau ke retur)

> **Penting!** Kuantitas retur **tidak boleh melebihi** kuantitas yang pernah dikirim di Surat Jalan asal. Sistem akan validasi otomatis.

---

## 7. Retur Penjualan

Berbeda dari Retur Surat Jalan — Retur Penjualan terkait dengan **Invoice** yang sudah diterbitkan.

1. Buka **Menu Marketing > Retur Penjualan**
2. Pilih **Invoice Penjualan** asal
3. Pilih barang yang diretur
4. Isi kuantitas retur
5. Otorisasi → **Piutang customer berkurang** otomatis

---

## 8. Credit Note

**Tujuan:** Koreksi invoice yang sudah diterbitkan — misal harga salah, qty salah, atau ada diskon tambahan.

### Langkah:

1. Buka **Menu Marketing > Credit Note**
2. Pilih **Invoice Penjualan** yang akan dikoreksi
3. Sistem tampilkan detail invoice
4. Pilih item yang akan dikoreksi → isi nilai koreksi (pengurang)
5. Simpan → Otorisasi

### Efek:

- Piutang customer **berkurang** sesuai nilai koreksi
- Jurnal koreksi otomatis terbentuk

> **Tips:** Credit Note bukan untuk retur barang — ini murni koreksi nilai. Jika ada barang yang kembali, gunakan **Retur Penjualan** atau **Retur Surat Jalan**.

---

## 9. Retur Gudang

**Tujuan:** Mencatat barang yang diretur kembali ke gudang (karena customer reject, atau retur dari surat jalan yang sudah final).

1. Buka **Menu Marketing > Retur Gudang**
2. Pilih referensi (Retur SJ / langsung)
3. Isi barang dan kuantitas
4. Pilih gudang tujuan (tempat barang akan kembali)
5. Otorisasi → **Stok barang bertambah** di gudang

---

## Sub-Ledger yang Terlibat

| Sub-Ledger | Update Otomatis |
|------------|-----------------|
| **Piutang Customer** | Setiap invoice penjualan terbentuk |
| **Stok Barang** | Setiap surat jalan atau retur |
| **Buku Besar** | Posting jurnal dari invoice & retur |
| **Kartu Mesin** | History jam kerja per mesin (dari SPK) |
| **Kartu Karyawan** | History kerja (terkait SPK) |

---

## Ringkasan Hari 6

Anda telah mempelajari:
- ✅ 9 submenu Marketing dan alur bisnisnya
- ✅ Membuat Sales Order dengan sales & customer
- ✅ Integrasi SO ke Produksi (SPK)
- ✅ Membuat Surat Jalan dan Invoice Penjualan
- ✅ Memproses Retur (Surat Jalan, Penjualan, Gudang)
- ✅ Membuat Credit Note untuk koreksi invoice

> **Tips untuk besok:** Besok kita masuk lebih dalam ke **Produksi** — bagaimana SPK diproses, mesin & TK, sampai hasil produksi dan permintaan bahan.

---

## Troubleshooting Q&A

**Pertanyaan:** SO saya sudah diotorisasi tapi tidak muncul di Outstanding Produksi.  \
**Jawaban:** Pastikan SO sudah diotorisasi **Level 1**. Refresh halaman Produksi, atau cek apakah ada filter periode yang menyembunyikan SO Anda.

**Pertanyaan:** Tidak bisa isi detail bahan di SPK.  \
**Jawaban:** Pastikan **Detail Mesin** sudah diisi lebih dulu. Sistem tidak mengizinkan isi bahan sebelum mesin.

**Pertanyaan:** Invoice tidak muncul di daftar Faktur Pajak.  \
**Jawaban:** Invoice yang sudah punya faktur tidak akan muncul lagi. Pilih invoice yang memang belum punya faktur pajak.

**Pertanyaan:** Retur qty > qty asal ditolak. Kenapa?  \
**Jawaban:** Sistem validasi: retur tidak boleh melebihi kuantitas yang pernah dikirim di Surat Jalan. Sesuaikan qty retur dengan qty kirim.

**Pertanyaan:** Credit Note tidak mengurangi piutang.  \
**Jawaban:** Pastikan Credit Note sudah diotorisasi **Level 2**. Hanya L2 yang trigger update ke kartu piutang customer.

**Pertanyaan:** SO tidak bisa dihapus.  \
**Jawaban:** SO yang sudah punya Surat Jalan, Invoice, atau SPK reference tidak bisa dihapus. Ini proteksi integritas data.

**Pertanyaan:** Bisa buat Retur Gudang tanpa ada Retur SJ sebelumnya?  \
**Jawaban:** Bisa — Retur Gudang bisa berdiri sendiri untuk kasus barang kembali langsung ke gudang (misal: dari ekspedisi).