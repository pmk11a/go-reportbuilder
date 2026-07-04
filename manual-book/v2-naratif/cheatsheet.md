# Cheatsheet — ERP Trade Exchange

> Referensi cepat untuk operator harian. Simpan halaman ini sebagai bookmark atau cetak untuk ditempel di meja kerja.

---

## A. Kode Transaksi Utama

| Kode | Nama | Keterangan |
|------|------|-----------|
| BKM | Bank Masuk | Kas/bank masuk (terima pembayaran) |
| BKK | Bank Keluar | Kas/bank keluar (pembayaran) |
| BBM | Buku Masuk | Transaksi masuk non-tunai |
| BBK | Bukti Bank Keluar | Transaksi keluar non-tunai |
| BNM | Bukti Memorial | Jurnal memorial |
| BJK | Bukti Jurnal | Jurnal entry |
| BCK | Bukti Koleksi | Koleksi piutang |

---

## B. 8 Modul Utama

| # | Modul | Akses Cepat |
|---|-------|-------------|
| 1 | Master Data | Data dasar (COA, Item, Supplier, dll) |
| 2 | Pengadaan & Purchasing | PR, RFQ, PO, LPB, retur, faktur pajak (Procurement-to-Pay) |
| 3 | Marketing | Penjualan dan order |
| 4 | Produksi | Jadwal produksi |
| 5 | Gudang | Inventory |
| 6 | Akunting | Kas Bank, Memorial, Laporan |
| 7 | Reporting | Semua laporan |
| 8 | Utilities | Admin panel (Menu Berkas) |

---

## C. 6 Submenu Menu Berkas

1. **Setup Periode Kerja** — tentukan bulan aktif
2. **Kunci Periode Kerja** — kunci bulan untuk tutup buku
3. **Set Nomor Transaksi** — format nomor bukti
4. **Set Pemakaian** — user management
5. **Ganti Password** — ubah password sendiri
6. **Lock** — logout

---

## D. 5 Level Otorisasi

| Level | Jabatan | Wewenang |
|-------|---------|----------|
| 1 | Operator | Input transaksi |
| 2 | Staff | Otorisasi Level 1 |
| 3 | Supervisor | Otorisasi Level 1-2 |
| 4 | Manager | Otorisasi Level 1-3 |
| 5 | Direktur | Otorisasi semua |

---

## E. Hak Akses Menu (5 Centang)

| Centang | Artinya |
|---------|---------|
| Tampil | Lihat menu/laporan |
| Tambah | Buat baru |
| Koreksi | Edit |
| Hapus | Hapus |
| Otorisasi | Validasi |

---

## F. Pola Debit/Kredit Umum

| Transaksi | Debit | Kredit |
|-----------|-------|--------|
| Terima pembayaran customer | Kas/Bank | Piutang Dagang |
| Bayar supplier | Utang Dagang | Kas/Bank |
| Beli mesin | Aktiva (Mesin) | Kas/Bank |
| Jual mesin | Kas/Bank | Aktiva |
| Bayar beban | Beban | Kas/Bank |
| Tambah utang | Kas/Beban | Utang Dagang |
| Tambah piutang | Piutang Dagang | Pendapatan |

---

## G. Master Data Wajib

- [ ] Chart of Accounts (COA)
- [ ] Saldo Awal
- [ ] Master Gudang
- [ ] Group & Subgroup Bahan
- [ ] Item (Bahan/Produk)
- [ ] Area & Kota
- [ ] Supplier
- [ ] Customer
- [ ] Departemen
- [ ] Jabatan
- [ ] Karyawan
- [ ] Machine (jika produksi)
- [ ] Sales

---

## H. Tombol Umum di Form

| Tombol | Fungsi |
|--------|--------|
| **Tambah** | Buat record baru |
| **Koreksi** | Edit record |
| **Hapus** | Hapus record |
| **Simpan** | Simpan perubahan |
| **Batal** | Batalkan input |
| **Tutup** | Tutup form |
| **Cetak** | Cetak laporan/form |
| **Refresh** | Refresh data |

---

## I. Validasi Cepat (Checklist Harian)

Pagi (sebelum kerja):
- [ ] Login berhasil
- [ ] Periode aktif sesuai
- [ ] Akses menu sesuai level

Saat input transaksi:
- [ ] Jenis transaksi (BKM/BKK/dll) sudah benar
- [ ] Mata uang & kurs
- [ ] Tanggal transaksi
- [ ] Lawan (akun pasangan)
- [ ] Nominal (perhatikan +/-)
- [ ] Customer/Supplier (jika ada)
- [ ] SPK (jika ada)

Sore (sebelum pulang):
- [ ] Semua transaksi terposting
- [ ] Buku besar balance (debit = kredit)
- [ ] Lock/Logout aplikasi

---

## J. Status Otorisasi

| Status | Keterangan |
|--------|-----------|
| Draft | Baru diinput |
| Pending | Menunggu validasi |
| L1 / L2 / L3 | Sudah diotorisasi level tertentu |
| Final | Lengkap terotorisasi |

---

## K. Kode Transaksi Pengadaan, Marketing, Produksi, Gudang, Utilitas

### Pengadaan (Procurement)

| Kode | Nama | Keterangan |
|------|------|-----------|
| PR | Purchase Request | Permintaan pembelian internal |
| PO | Purchase Order | Pesanan ke supplier |
| LPB | Laporan Penerimaan Barang | Penerimaan barang ke gudang |
| ASC | Asing / Sub-Contract | Penerimaan sub-contract (edit harga saja) |
| Faktur Pajak | Faktur Pajak Pembelian | Pajak pembelian, reference ke LPB |

### Marketing (Sales)

| Kode | Nama | Keterangan |
|------|------|-----------|
| SO | Sales Order | Pesanan dari customer |
| SPK | Surat Perintah Kerja | Perintah kerja ke produksi |
| SJ | Surat Jalan | Dokumen pengiriman barang |
| INV | Invoice Penjualan | Tagihan ke customer |
| FP | Faktur Pajak Penjualan | PPN untuk penjualan |
| Retur SJ | Retur Surat Jalan | Retur barang dari customer |
| Retur Jual | Retur Penjualan | Retur terkait invoice |
| CN | Credit Note | Koreksi nilai invoice |
| Retur Gudang | Retur Gudang | Barang kembali ke gudang |

### Produksi

| Kode | Nama | Keterangan |
|------|------|-----------|
| SPK | Surat Perintah Kerja | Perintah produksi (linked dari SO) |
| M&TK | Mesin & Tenaga Kerja | Setup mesin dan karyawan per shift |
| HP | Hasil Produksi | Output barang (baik vs rusak) |
| Finish | Finishing | Tahap akhir (packaging, QC) |
| PB | Permintaan Bahan | Request bahan ke gudang |
| PBT | Permintaan Bahan Tambahan | Request bahan tambahan |

### Gudang

| Kode | Nama | Keterangan |
|------|------|-----------|
| PB | Pengeluaran Bahan | Bahan keluar ke produksi (wajib L1) |
| Retur | Retur Bahan | Pengembalian bahan ke gudang |
| Koreksi | Koreksi Bahan | Adjustment stok non-produksi |
| Opname | Opname Barang | Penghitungan fisik stok |
| Ubah Ukuran | Ubah Ukuran Bahan | Konversi satuan/ukuran |

### Utilitas

| Kode | Nama | Keterangan |
|------|------|-----------|
| Hitung Stock | Hitung Ulang Stock | Recalculate stok bulanan/per barang |
| HPP | Harga Pokok Penjualan | Hitung harga barang jadi |
| Posting | Proses Posting | Posting jurnal & kartu sub-ledger |
| Audit | Buku Aktivitas Pemakai | Audit trail perubahan data per user |

---

## L. Format Nomor Transaksi

```
[Nomor Urut]-[Kode]-[Kode Perusahaan]-[Tanggal]
Contoh: 001-BKM-PER001-260626
```

Reset:
- **Bulanan** — nomor ulang tiap awal bulan
- **Tahunan** — nomor ulang tiap awal tahun

---

## L. Persamaan Penting

**Neraca:** Aktiva = Kewajiban + Modal

**Per Memorial:** Total Debit = Total Kredit (HARUS sama)

**Rekonsiliasi:** Total Sub-Ledger = Akun Kontrol di Buku Besar
