# Hari 4: Reporting — Memverifikasi Transaksi Anda

> *"Hari terakhir dalam perjalanan ini. Setelah tiga hari sebelumnya menyiapkan sistem, master data, dan transaksi, kini tiba waktunya memverifikasi hasil pekerjaan Anda. Reporting adalah jendela untuk melihat apakah semua sudah benar. Bayangkan seperti memegang laporan akhir shift sebelum pulang kerja — pastikan semuanya beres."*

Hari ini Anda akan belajar cara mengakses dan membaca laporan utama, memverifikasi posting jurnal, dan mengecek rekonsiliasi piutang/utang.

---

## Checklist Hari 4

- [ ] Memahami jenis-jenis laporan
- [ ] Mengakses laporan Buku Besar
- [ ] Mengecek laporan Kas & Bank
- [ ] Melihat laporan Piutang per Customer
- [ ] Melihat laporan Utang per Supplier
- [ ] Membaca laporan Neraca dan Laba Rugi
- [ ] Memverifikasi rekonsiliasi sub-ledger vs buku besar

---

## 1. Memahami Akses Laporan

**Menu: Reporting** atau melalui **Akunting**

Sebelum melihat laporan, Anda harus sudah mendapat akses di:
- **Menu Berkas > Set Pemakaian > Set Report**
  - Centang **Akses** untuk melihat laporan
  - Centang **Desain** untuk mengubah layout laporan (khusus admin)

> **Penting!** Jika Anda tidak melihat menu Reporting, kemungkinan akses laporan belum diaktifkan. Hubungi administrator.

### Filter Laporan

Semua laporan biasanya memiliki filter:
- **Periode** — bulan/tahun
- **Akun** — akun COA tertentu
- **Customer/Supplier** — pihak tertentu
- **Departemen** — untuk laporan multi-divisi

> **Apa yang terjadi di belakang layar?**  
> Laporan mengambil data langsung dari buku besar dan sub-ledger yang terbentuk otomatis saat transaksi disimpan. Tidak ada input manual di laporan — semua berasal dari transaksi.

---

## 2. Laporan Buku Besar

**Menu: Akunting > Laporan > Buku Besar**

Laporan ini menampilkan semua posting debit/credit untuk akun-akun COA.

### Yang Bisa Anda Lihat:

| Field | Keterangan |
|-------|-----------|
| Tanggal | Kapan transaksi terjadi |
| No Bukti | Nomor bukti (misal: BKM-001) |
| Keterangan | Deskripsi transaksi |
| Debit | Nominal debit |
| Kredit | Nominal kredit |
| Saldo | Saldo berjalan |

### Cara Pakai:

1. Pilih **periode** (misal: Juni 2026)
2. Pilih **akun** yang ingin dilihat (atau semua akun)
3. Klik **Tampilkan**
4. Laporan akan terbuka dalam grid atau bisa dicetak ke PDF

### Verifikasi Penting:

> **Tips:** Saldo akhir setiap akun harus sesuai dengan ekspektasi Anda. Jika ada yang tidak cocok, kemungkinan ada transaksi yang salah input atau belum terotorisasi.

---

## 3. Laporan Kas & Bank

**Menu: Akunting > Laporan > Kas & Bank**

Laporan ini merangkum semua transaksi BKM, BKK, BBM, BBK.

### Informasi yang Ditampilkan:

- Saldo awal kas/bank
- Total uang masuk per periode
- Total uang keluar per periode
- Saldo akhir
- Daftar transaksi detail

> **Tips:** Cocokkan saldo akhir dengan rekening bank fisik Anda. Jika tidak cocok, kemungkinan ada transaksi yang belum diinput atau double posting.

---

## 4. Laporan Piutang per Customer

**Menu: Akunting > Laporan > Piutang**

Menampilkan posisi piutang setiap customer.

| Field | Keterangan |
|-------|-----------|
| Kode Customer | Identifikasi customer |
| Nama Customer | Nama customer |
| Saldo Awal | Piutang awal bulan |
| Penambahan | Piutang baru (invoice) |
| Pelunasan | Yang sudah dibayar |
| Saldo Akhir | Yang belum dibayar |

### Cara Pakai:

1. Pilih periode
2. Pilih customer (atau semua)
3. Tampilkan

### Pertanyaan Umum

**Pertanyaan:** Saldo piutang customer tidak cocok dengan catatan saya.  
**Jawaban:** Cek di sub-ledger customer. Setiap transaksi Memorial yang melibatkan customer akan tercatat di sini. Biasanya ada transaksi Memorial piutang yang belum terotorisasi atau terlewat.

---

## 5. Laporan Utang per Supplier

**Menu: Akunting > Laporan > Utang**

Strukturnya sama dengan laporan piutang, hanya saja pihak yang ditampilkan adalah supplier.

**Yang perlu diverifikasi:**
- Apakah semua pembelian dari supplier sudah terinput?
- Apakah semua pembayaran sudah terinput?
- Apakah ada utang yang sudah lewat jatuh tempo?

---

## 6. Laporan Neraca

**Menu: Akunting > Laporan > Neraca**

Menampilkan posisi keuangan perusahaan pada tanggal tertentu.

### Struktur Neraca:

```
AKTIVA                          →  PASIVA
Kas                  XXX       Kewajiban        XXX
Piutang              XXX       Utang Jangka Pjg  XXX
Persediaan           XXX       Modal             XXX
Aktiva Tetap         XXX       Laba Ditahan      XXX
Akumulasi Penyusutan (XXX)
```

> **Penting!** Persamaan dasar akuntansi harus selalu seimbang:
> **Aktiva = Kewajiban + Modal**

### Pertanyaan Umum

**Pertanyaan:** Neraca saya tidak seimbang (tidak balance). Apa yang harus dilakukan?  
**Jawaban:** Biasanya ada transaksi Memorial yang tidak seimbang debit/kreditnya. Cek buku besar untuk mencari transaksi yang asimetris. Hubungi admin jika perlu.

---

## 7. Laporan Laba Rugi

**Menu: Akunting > Laporan > Laba Rugi**

Menampilkan kinerja perusahaan selama periode tertentu:

```
Pendapatan                XXX
- Beban Pokok Penjualan   (XXX)
= Laba Kotor              XXX
- Beban Operasional       (XXX)
= Laba Bersih             XXX
```

### Cara Pakai:

1. Pilih periode (misal: Juni 2026 atau YTD tahun ini)
2. Pilih departemen (jika multi-divisi)
3. Tampilkan

---

## 8. Laporan Arus Kas

**Menu: Akunting > Laporan > Arus Kas**

Tracking aliran kas masuk dan keluar. Penting untuk memantau likuiditas.

### Kategori:

1. **Arus Kas Operasional** — aktivitas harian
2. **Arus Kas Investasi** — pembelian/penjualan aktiva
3. **Arus Kas Pendanaan** — pinjaman, setor modal

---

## 9. Laporan Aktiva Tetap

**Menu: Akunting > Laporan > Aktiva**

Menampilkan daftar aktiva dan akumulasi penyusutannya.

| Field | Keterangan |
|-------|-----------|
| Kode Aktiva | Identifikasi unik |
| Nama Aktiva | Deskripsi |
| Tanggal Perolehan | Kapan dibeli |
| Harga Perolehan | Nilai awal |
| Akumulasi Penyusutan | Total susut hingga saat ini |
| Nilai Buku | Harga perolehan - akumulasi penyusutan |

> **Tips:** Cocokkan daftar aktiva dengan fisik. Pastikan tidak ada yang hilang atau lupa tercatat.

---

## 10. Verifikasi Rekonsiliasi Sub-Ledger

**Tujuan:** Memastikan total sub-ledger = total akun kontrol di buku besar.

### Rekonsiliasi Piutang:

1. Buka laporan **Piutang per Customer**
2. Hitung total saldo piutang semua customer = **X**
3. Buka **Buku Besar** untuk akun **Piutang Dagang (1-1201)**
4. Saldo akhir akun 1-1201 seharusnya = **X**
5. Jika sama → rekonsiliasi OK
6. Jika beda → ada transaksi yang belum terposting ke sub-ledger atau sebaliknya

### Rekonsiliasi Utang:

Sama dengan piutang, tetapi untuk akun **Utang Dagang** dan daftar supplier.

> **Penting!** Selalu lakukan rekonsiliasi ini sebelum tutup buku bulanan.

---

## 11. Laporan Lainnya

Bergantung pada kebutuhan, sistem juga mendukung:

- **Laporan Stok** — posisi persediaan barang per gudang
- **Laporan Pembelian** — histori pembelian per supplier
- **Laporan Penjualan** — histori penjualan per customer/sales
- **Laporan Produksi** — jadwal dan hasil produksi
- **Laporan Kartu Stok** — pergerakan barang per item

---

## 12. Cetak & Export

Hampir semua laporan mendukung:

- **Cetak** — langsung ke printer
- **Export PDF** — untuk arsip digital
- **Export Excel** — untuk analisis lebih lanjut

### Tombol Akses:

Biasanya ada di toolbar atas laporan:
- 🖨️ **Cetak**
- 📄 **PDF**
- 📊 **Excel**

> **Tips:** Gunakan export Excel untuk analisis data lebih dalam (pivot table, grafik, dll).

---

## Ringkasan Hari 4

Anda telah mempelajari:
- ✅ Cara mengakses laporan sesuai hak akses
- ✅ Buku Besar untuk verifikasi posting
- ✅ Kas & Bank untuk monitoring saldo
- ✅ Piutang/Utang per customer/supplier
- ✅ Neraca dan Laba Rugi untuk posisi keuangan
- ✅ Arus Kas untuk likuiditas
- ✅ Cara melakukan rekonsiliasi sub-ledger

> **Selamat!** Anda telah menyelesaikan perjalanan dari hari pertama hingga hari keempat. Sekarang Anda bisa mengelola transaksi harian dan memverifikasi hasilnya melalui laporan.

---

## Troubleshooting Q&A

**Pertanyaan:** Laporan kosong padahal saya sudah input transaksi.  
**Jawaban:** Cek filter periode. Mungkin Anda input di bulan Juni tapi filter menampilkan Mei. Atau periode belum dibuka (di-lock).

**Pertanyaan:** Neraca tidak seimbang.  
**Jawaban:** Cari transaksi Memorial yang debit ≠ kredit. Biasanya user keliru input nominal atau salah sisi debit/kredit.

**Pertanyaan:** Total sub-ledger tidak sama dengan akun kontrol di buku besar.  
**Jawaban:** Ada transaksi yang melibatkan customer/supplier tapi belum melalui flow sub-ledger. Cek transaksi Memorial atau Kas Bank yang terkait.

**Pertanyaan:** Tombol Cetak tidak ada di laporan.  
**Jawaban:** Hak akses Anda belum termasuk "Akses" di **Set Report**. Hubungi admin.

**Pertanyaan:** Laporan lambat saat dibuka.  
**Jawaban:** Biasanya karena rentang tanggal terlalu panjang. Persempit periode (misal: bulanan, bukan tahunan).

**Pertanyaan:** Bisa custom layout laporan?  
**Jawaban:** Hanya user dengan akses "Desain" yang bisa mengubah layout. Biasanya admin atau manajer.

**Pertanyaan:** Bagaimana cara laporan bulanan otomatis dikirim ke email?  
**Jawaban:** Fitur ini belum tersedia di panduan ini. Hubungi admin untuk setup distribusi laporan terjadwal.
