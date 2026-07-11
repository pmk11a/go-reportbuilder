# Lampiran — Glossary Istilah ERP

## Overview

Lampiran ini berisi definisi singkat untuk istilah-istilah yang umum digunakan dalam **ERP Trade Exchange** dan sistem ERP pada umumnya. Daftar ini mencakup istilah operasional (BKM, BKK, BBM, BBK, BNM, BCK), istilah akuntansi (COA, sub-ledger, posting, double-entry), istilah master data, dan istilah otorisasi.

---

## A — Akronim Kode Transaksi

| Kode | Kepanjangan | Definisi |
|------|-------------|----------|
| **BKM** | Bank/Kas Masuk | Transaksi penerimaan kas/bank. Debit Kas/Bank, Kredit Lawan (piutang/pendapatan). |
| **BKK** | Bank/Kas Keluar | Transaksi pengeluaran kas/bank. Kredit Kas/Bank, Debit Lawan (beban/utang). Nominal bernilai positif. |
| **BBM** | Buku Masuk | Transaksi penerimaan non-tunai/non-bank. Debit akun target. |
| **BBK** | Bukti Bank Keluar | Transaksi pengeluaran non-tunai/non-bank. Kredit akun target. |
| **BNM** | Bukti Memorial | Transaksi jurnal entry manual (di luar kas/bank). |
| **BCK** | Bukti Koleksi | Bukti penerimaan piutang (collection receipt). |
| **BJK** | Bukti Jurnal Koran | Kemungkinan merujuk pada bukti mutasi rekening koran bank. |
| **SO** | Sales Order | Pesanan penjualan — dokumen awal siklus penjualan. |
| **PO** | Purchase Order | Pesanan pembelian — dokumen awal siklus purchasing. |
| **SPK** | Surat Pesanan Kerja | Referensi pesanan yang sudah dibuat sebelumnya; terhubung ke transaksi kas/bank. |
| **RCC** | Receivable/Payable Control | Sub-detail akun piutang/utang pada supplier/customer. |
| **HPP** | Harga Pokok Penjualan | Beban pokok produksi/penjualan barang. |

---

## B — Istilah Akuntansi

| Istilah | Definisi |
|---------|----------|
| **Chart of Accounts (COA)** | Daftar lengkap akun perkiraan pembukuan yang digunakan perusahaan. Sinonim: Perkiraan, Daftar Akun. |
| **Perkiraan** | Sinonim untuk akun dalam konteks pembukuan Indonesia. Setiap transaksi merujuk ke minimal satu perkiraan di sisi debit dan satu di sisi kredit. |
| **Saldo Normal** | Posisi standar saldo akun: aktiva = Debit, kewajiban/equity = Credit, pendapatan = Credit, beban = Debit. |
| **Debit (Debet)** | Sisi kiri pembukuan; untuk aktiva berarti penambahan, untuk kewajiban berarti pengurangan. |
| **Credit (Kredit)** | Sisi kanan pembukuan; untuk kewajiban berarti penambahan, untuk aktiva berarti pengurangan. |
| **Double-Entry Bookkeeping** | Prinsip pembukuan di mana setiap transaksi memiliki sisi debit dan sisi kredit dengan total yang **sama** (balance). |
| **Posting** | Proses pencatatan transaksi ke buku besar (general ledger). |
| **Buku Besar (General Ledger / GL)** | Kumpulan seluruh akun perkiraan yang mencatat mutasi transaksi secara kronologis. |
| **Sub-Ledger** | Pembukuan detail per entitas (supplier/customer) yang melengkapi buku besar. Contoh: kartu piutang customer A. |
| **Saldo Awal** | Saldo akun pada awal periode (biasanya awal tahun buku). Hanya dapat diisi di awal periode aktif. |
| **Aktiva (Aset)** | Sumber daya yang dimiliki perusahaan: kas, piutang, persediaan, aktiva tetap. |
| **Aktiva Tetap** | Aset jangka panjang seperti mesin, kendaraan, bangunan. Dikenai penyusutan. |
| **Penyusutan (Depreciation)** | Pengurangan nilai aktiva tetap secara berkala (bulanan/tahunan). Metode standar: garis lurus (straight-line). |
| **Akumulasi Penyusutan** | Akun kontra-aktiva yang mencatat total penyusutan sejak aktiva diperoleh. |
| **Harta Dagang** | Aset yang terkait langsung dengan operasional dagang: piutang dagang, utang dagang. |
| **Piutang (Receivable)** | Tagihan yang belum dibayar oleh customer kepada perusahaan. |
| **Utang (Payable)** | Tagihan yang belum dibayar oleh perusahaan kepada supplier. |
| **Pendapatan (Revenue)** | Akun yang mencatat penghasilan dari penjualan barang/jasa. Saldo normal: Credit. |
| **Beban (Expense)** | Akun yang mencatat biaya operasional. Saldo normal: Debit. |
| **Neraca (Balance Sheet)** | Laporan posisi keuangan: aktiva, kewajiban, modal pada satu titik waktu. |
| **Laba Rugi (Income Statement)** | Laporan kinerja keuangan: pendapatan dikurangi beban dalam satu periode. |
| **Arus Kas (Cash Flow)** | Laporan pergerakan kas masuk dan keluar perusahaan, dikelompokkan per aktivitas. |
| **Rekonsiliasi (Reconciliation)** | Proses pencocokan saldo antara sub-ledger dan buku besar agar tetap balance. |

---

## C — Istilah Master Data

| Istilah | Definisi |
|---------|----------|
| **Master Data** | Kumpulan data referensi yang menjadi dasar input transaksi (COA, barang, supplier, customer, karyawan, dll). |
| **Master Accounting** | Modul induk untuk data akun, aktiva, utang-piutang, laba rugi, neraca, posting. |
| **Master Bahan** | Modul untuk data barang: gudang, group, subgroup, item. |
| **Master Supplier/Customer** | Modul untuk data pihak ketiga: area, kota, supplier, customer, sales. |
| **Master Produksi** | Modul untuk mesin, tarif pemakaian mesin, dan tarif tenaga kerja. |
| **Master Lain-Lain** | Modul untuk departemen, jabatan, karyawan, dan desain. |
| **Group Bahan** | Kategori utama barang: Bahan Baku, Bahan Bantu, Barang Jadi Beli, Barang Jadi Produksi, Barang Langsung Biaya. |
| **Subgroup** | Sub-kategori di bawah group (nested). |
| **Satuan (Unit of Measure)** | Unit pengukuran barang: kg, pcs, box, m, dll. Mendukung konversi antar satuan. |
| **Konversi Satuan** | Rasio antar dua satuan (misal: 1 Box = 12 Pcs). |
| **Gudang (Warehouse)** | Lokasi fisik penyimpanan barang. Setiap barang tercatat di satu atau lebih gudang. |
| **Area** | Pengelompokan geografis tertinggi untuk supplier/customer (region/wilayah). |
| **Kota** | Sub-area: Kabupaten/Kota di bawah Area. |
| **Departemen** | Unit organisasi perusahaan. |
| **Jabatan** | Posisi/role dalam struktur organisasi. |
| **Kategori Karyawan** | Sales / Produksi / Lainnya — menentukan hak & referensi modul terkait. |
| **Daftar Desain** | Daftar template/layout dokumen cetak (faktur, SPK, laporan). |
| **Saldo Awal Perkiraan** | Saldo akun pada awal periode (lihat Bab 3). |

---

## D — Istilah Otorisasi & User Management

| Istilah | Definisi |
|---------|----------|
| **Set Pemakaian** | Submenu di Berkas untuk mengatur user management: CRUD user, set report, akses COA. |
| **Otorisasi Berjenjang** | Sistem persetujuan bertingkat 5 level: Operator → Staff → Supervisor → Manager → Direktur. |
| **Level Otorisasi** | Tingkatan hak user (1 sampai 5). Level yang lebih tinggi hanya dapat menyetujui setelah level di bawahnya. |
| **Batal Otorisasi** | Tombol untuk mereset semua level otorisasi yang telah disetujui pada satu transaksi/user. |
| **Hak Akses (Access Rights)** | Hak spesifik user per modul: Tampil, Tambah, Koreksi, Hapus, Otorisasi. |
| **Akses COA** | Filter perkiraan yang boleh diakses user tertentu (interface 2 kolom). |
| **Set Report** | Pengaturan hak akses dan desain laporan per user. |
| **Lock** | Logout aplikasi — mengunci sesi dari akses orang lain. |
| **Periode Kerja** | Rentang waktu (biasanya bulanan) di mana transaksi aktif. |

---

## E — Istilah Transaksi & Posting

| Istilah | Definisi |
|---------|----------|
| **Header Transaksi** | Bagian atas form transaksi: jenis, mata uang, tanggal, tujuan. |
| **Detail/Sub-Grid Transaksi** | Baris-baris detail di bawah header: nominal, sumber, keterangan, lawan, SPK. |
| **Lawan (Pasangan)** | Akun di sisi berlawanan dari posisi kas/bank dalam transaksi. |
| **Nominal** | Nilai uang transaksi. Selalu bernilai positif; sisi Debet/Kredit ditentukan otomatis oleh sistem berdasarkan jenis transaksi.
| **Sumber** | Asal transaksi (manual/otomatis). |
| **Sub-Ledger Settlement** | Proses pelunasan utang/piutang melalui sub-detail akun supplier/customer di transaksi Kas Bank atau Memorial. |
| **Auto-Create** | Pembuatan record baru secara otomatis saat transaksi (misal: aktiva baru dari Memorial). |
| **Biaya Masih Harus Dibayar** | Istilah untuk nominal debit saat input Memorial tambah aktiva. |
| **Historis Kartu** | Riwayat mutasi piutang/utang per customer/supplier — mencatat kapan tagihan dibuat, kapan dilunasi. |
| **Rekening Koran** | Mutasi rekening bank yang dilaporkan oleh bank, dipakai untuk rekonsiliasi. |

---

## F — Istilah Setup & Konfigurasi

| Istilah | Definisi |
|---------|----------|
| **Periode Aktif** | Periode kerja yang sedang dibuka dan digunakan untuk transaksi default. |
| **Kunci Periode** | Mengunci periode agar transaksi Tambah/Ubah/Hapus tidak dapat dilakukan. |
| **Blok Tahunan** | Centangan penguncian periode per bulan dalam rentang Januari–Desember. |
| **Set Nomor Transaksi** | Konfigurasi format penomoran bukti: urutan-kode perusahaan-tanggal. |
| **Reset Penomoran** | Pilihan reset nomor urut: tahunan (Januari) atau bulanan. |
| **Multi-Company** | Kemampuan sistem mendukung lebih dari satu perusahaan aktif. |

---

## G — Istilah Umum ERP

| Istilah | Definisi |
|---------|----------|
| **ERP (Enterprise Resource Planning)** | Sistem informasi terintegrasi untuk mengelola seluruh operasional bisnis: akunting, produksi, gudang, pemasaran, dll. |
| **CRUD** | Create, Read, Update, Delete — operasi dasar manajemen data. |
| **Workflow** | Alur kerja terstruktur yang dilalui sebuah proses bisnis. |
| **Validation** | Aturan yang harus dipenuhi sebelum data dapat disimpan. |
| **Reporting** | Modul untuk menampilkan laporan keuangan, stok, penjualan, dll. |
| **Utilities** | Modul utilitas administrasi sistem: setup, admin panel. |
| **IDR / USD / SGD** | Kode mata uang: Rupiah Indonesia / Dolar Amerika / Dolar Singapura. Sistem mendukung multi-currency. |
| **Kurs** | Nilai tukar mata uang. |
| **Valas (Valuta Asing)** | Mata uang asing. |

---

## H — Akronim Modul (Daftar Menu)

| Akronim | Kepanjangan | Modul |
|---------|-------------|-------|
| Master Data | Master Data | Pusat input data referensi |
| Purchasing | Purchasing | Pembelian barang/jasa |
| Pengadaan | Procurement | Alur procurement: permintaan, penawaran, kontrak |
| Marketing | Marketing | Penjualan & aktivitas pemasaran |
| Produksi | Production | Perencanaan & eksekusi produksi |
| Gudang | Warehouse | Manajemen stok |
| Akunting | Accounting | Transaksi kas-bank, memorial, buku besar |
| Reporting | Reporting | Report viewer |
| Utilities | Utilities | Menu Berkas & admin panel |

---

## I — Catatan Penutupan

> **Manual ini** mencakup 10 bab utama + lampiran glossary berdasarkan transkrip audio yang tersedia. Jika menemukan istilah yang tidak ada di sini, harap dicatat sebagai **feedback** untuk pembaruan versi berikutnya.

Untuk daftar istilah akuntansi lebih lanjut, silakan merujuk ke:
- Standar Akuntansi Indonesia (PSAK)
- Double-Entry Bookkeeping Fundamentals
- Dokumentasi Odoo: https://www.odoo.com/documentation/latest/
- Dokumentasi SAP: https://help.sap.com/