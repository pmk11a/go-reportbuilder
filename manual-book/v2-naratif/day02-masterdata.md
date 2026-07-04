# Hari 2: Master Data

> *"Masuk hari kedua — ini adalah hari di mana Anda mengisi 'isi perut' dari sistem ERP. Master Data adalah semua informasi dasar yang akan dipakai sistem setiap kali Anda membuat transaksi. Bayangkan seperti menyetok bahan di dapur: sebelum bisa memasak (transaksi), Anda harus punya semua bahan (master data) yang diperlukan."*

Hari ini kita akan mengisi 5 kategori master data: **Accounting**, **Bahan Barang**, **Supplier & Customer**, **Lain-Lain**, dan **Produksi**.

---

## Checklist Hari 2

- [ ] Master Accounting — Chart of Accounts (COA)
- [ ] Master Accounting — Saldo Awal
- [ ] Master Bahan — Gudang, Group, Item
- [ ] Master Supplier & Customer
- [ ] Master Lain — Karyawan, Departemen, Jabatan
- [ ] Master Produksi — Machine & Tarif

---

## 1. Master Accounting

**Menu: Master Data > Master Accounting**

Ini adalah fondasi dari semua transaksi keuangan. Kita mulai dari Chart of Accounts.

### 1a. Chart of Accounts (COA / Pergiroan)

COA adalah daftar semua rekening yang perusahaan gunakan. Setiap transaksi akan mencatat debit dan kredit ke akun-akun ini.

#### Langkah:

1. Buka **Pergiroan (COA)**
2. Klik **Tambah** untuk menambahkan akun baru
3. Isi field berikut:

| Field | Keterangan |
|-------|-----------|
| Kode Perkiraan | Identifikasi unik akun (contoh: 1-1001 untuk Kas) |
| Keterangan | Nama akun (contoh: "Kas Kecil") |
| Kelompok | Aktiva, Kewajiban, Modal, Pendapatan, atau Beban |
| Tipe | **General** (transaksi umum) atau **Detail** (jurnal entry khusus) |
| Debit/Kredit | Sisi saldo normal akun |

#### Jenis Akun

- **General** → digunakan untuk transaksi biasa di Kas Bank
- **Detail** → digunakan khusus untuk jurnal entry (Memorial)

> **Apa yang terjadi di belakang layar?**  
> Setiap transaksi Kas Bank atau Memorial akan otomatis mencari akun di COA ini saat Anda memilih "lawan" (pasangan debit/credit).

#### Saldo Awal

Setelah semua akun dibuat, isi **saldo awal**:

1. Buka submenu **Saldo Awal**
2. Untuk setiap akun, masukkan saldo awal per tanggal aktif
3. Simpan

> **Penting!** Saldo awal hanya bisa diisi di **awal periode** (saat pertama kali menggunakan sistem). Setelah periode berjalan, saldo awal tidak bisa diubah.

**Pertanyaan:** Kenapa saya tidak bisa mengisi saldo awal?  
**Jawaban:** Pastikan Anda masih di awal periode. Jika sudah ada transaksi, saldo awal tidak bisa diubah.

---

### 1b. Aktiva Tetap

Menu ini untuk mencatat aset tetap perusahaan seperti mesin, kendaraan, dan gedung.

**Langkah:**
1. Buka **Aktiva** di Master Accounting
2. Pertama, buat **Grup Aktiva** (kelompok akuntansi untuk aktiva)
3. Set **Master Posting** — tentukan akun debit/credit otomatis per grup
4. Tentukan **Metode Penyusutan**: Garis Lurus (Straight-Line)
5. Input data **Aktiva Fisik**:
   - Kuantitas (jumlah unit)
   - Persentase Penyusutan (susut per tahun)
   - Periode penyusutan (bulanan/tahunan)

> **Tips:** Penyusutan dihitung otomatis setiap bulan berdasarkan metode garis lurus. Anda tinggal input persentase dan periode.

---

### 1c–1h. Modul Accounting Lainnya

Di Master Accounting, Anda juga menemukan:

- **Utang-Piutang** — pengaturan akun untuk追踪 customer dan supplier
- **Laba Rugi** — konfigurasi akun pendapatan dan beban
- **Neraca** — struktur laporan posisi keuangan
- **Posting** — aturan posting otomatis dari transaksi ke jurnal
- **Arus Kas** — tracking aliran kas masuk dan keluar
- **Setting Lampiran** — konfigurasi lampiran bukti transaksi

> **Catatan:** Modul-modul ini biasanya sudah di-set oleh admin. Operator hanya perlu familiar dengan lokasi mereka.

---

## 2. Master Bahan Barang

**Menu: Master Data > Master Bahan Barang**

Setiap produk, bahan baku, dan tempat penyimpanan (gudang) harus terdaftar di sini.

### 2a. Gudang

Daftar semua gudang tempat penyimpanan barang.

| Field | Keterangan |
|-------|-----------|
| Kode Gudang | Identifikasi unik (contoh: "GD01") |
| Nama Gudang | Nama tempat (contoh: "Gudang Utama") |
| Alamat | Lokasi fisik gudang |

### 2b. Group & Subgroup Bahan/Barang

Kategorikan barang Anda dalam hierarki:

**Grup Barang:**
- Bahan Baku
- Bahan Bantu
- Bahan Bantu Lain
- Barang Jadi Beli
- Barang Jadi Produksi

**Subgroup:**  
Nested di dalam grup. Contoh: di bawah "Bahan Baku" ada subgroup "Kertas".

> **Tips:** Semakin terstruktur group dan subgroup Anda, semakin mudah mencari item nanti.

### 2c. Master Bahan (Item)

Ini adalah daftar produk Anda — yang paling sering digunakan.

| Field | Keterangan |
|-------|-----------|
| Kode Barang | Identifikasi unik item |
| Nama Barang | Deskripsi lengkap |
| Kode Satuan | Unit of measure (pcs, kg, meter, dll) |
| Keterangan | Catatan tambahan |
| Group | Pilih dari grup yang sudah dibuat |
| Subgroup | Auto-filter sesuai group yang dipilih |

#### Satuan (Unit of Measure)

Setiap item bisa punya 2 satuan:
1. **Satuan 1** — satuan utama
2. **Satuan 2** — satuan konversi (terkecil)

Contoh:
- Satuan 1: **Karung**
- Satuan 2: **Kg**
- Konversi: 1 Karung = 50 Kg

> **Apa yang terjadi di belakang layar?**  
> Saat transaksi pembelian atau penjualan, sistem akan otomatis melakukan konversi satuan. Jika Anda beli 2 karung, sistem tahu itu sama dengan 100 kg.

---

## 3. Master Supplier & Customer

**Menu: Master Data > Master Supplier Customer**

Daftar semua pihak yang berinteraksi dengan perusahaan — pemasok bahan dan pembeli produk.

### 3a–3b. Area & Kota

Pertama, tetapkan wilayah geografis:

**Area** → Kode dan nama wilayah/region  
**Kota** → Hierarki: Area → Kabupaten/Kota → Nama kota

> **Tips:** Area membantu mengelompokkan customer atau supplier secara regional. Berguna untuk laporan penjualan per wilayah.

### 3c. Supplier

| Field | Keterangan |
|-------|-----------|
| Kode | Identifikasi unik supplier |
| Nama | Nama perusahaan supplier |
| Alamat | Alamat lengkap |
| Telepon | Nomor kontak |
| NPWP | Nomor Pokok Wajib Pajak |

#### Detail Akun (RCC)

Di setiap supplier, ada pengaturan akun:
- **Perkiraan Kas/Piutang** — akun yang akan dipakai untuk posting transaksi
- **Jenis** — Harta Dagang, Harta Deposito, atau Harta Lain-Lain
- **Pengaruh** — menentukan posisi posting ke buku besar

> **Penting:** Detail akun ini menentukan ke rekening mana transaksi Anda akan diposting. Salah pilih = salah posting.

### 3d. Customer

Field yang sama dengan supplier, tetapi fokus pada **piutang**:
- Perkiraan Piutang
- Kategori: Harta Dagang Lain-Lain, Piutang Lain
- Posting ke akun yang sesuai

### 3e. Sales

Daftar tenaga penjual perusahaan.

| Field | Keterangan |
|-------|-----------|
| Kode | Identifikasi sales |
| Nama | Nama lengkap |
| Telepon | Nomor kontak |
| NPWP | Nomor Pokok Wajib Pajak |

> **Tips:** Data Sales diambil dari Master Karyawan. Hanya karyawan dengan kategori "Sales" yang bisa membuat Sales Order.

---

## 4. Master Lain-Lain

**Menu: Master Data > Line-Line Lain-Lain**

Data pendukung yang diperlukan oleh modul lain.

### 4a. Departemen

Buat departemen sesuai struktur perusahaan Anda:
- **Kode Departemen** — identifikasi unik
- **Nama Departemen** — contoh: "Purchasing", "Produksi", "Marketing"

### 4b. Jabatan

Buat jabatan sesuai struktur organisasi:
- Kode jabatan
- Nama jabatan

### 4c. Karyawan

| Field | Keterangan |
|-------|-----------|
| Kode Karyawan | Identifikasi unik |
| Nama Lengkap | Sesuai KTP |
| Tempat & Tanggal Lahir | Data personal |
| Alamat | Alamat domisili |
| Nomor Telepon | Kontak |
| Status | Aktif / Tidak Aktif |
| Kategori | **Sales** / Produksi / Lainnya |
| Gender | Laki-laki / Perempuan |

> **Penting!** Kategori karyawan sangat berpengaruh:
> - **Sales** → bisa membuat Sales Order
> - **Non-Sales** → tidak bisa membuat Sales Order
> - Data ini juga menjadi referensi untuk otorisasi transaksi

### 4d. Daftar Desain

*(Detail tidak tersedia — hubungi admin untuk info lebih lanjut)*

---

## 5. Master Produksi

**Menu: Master Data > Master Produksi**

Digunakan jika perusahaan Anda menjalankan aktivitas produksi.

### 5a. Machine & Tarif

| Field | Keterangan |
|-------|-----------|
| Kode Mesin | Identifikasi unik |
| Nama Mesin | Deskripsi mesin |
| Tarif | Biaya pemakaian per jam/jurnal |
| Peminjaman/Alokasi | Mesin yang ditugaskan ke lini produksi |

### 5b. Tarif Tenaga Kerja

| Field | Keterangan |
|-------|-----------|
| Kode Tarif | Identifikasi unik |
| Keterangan | Jenis pekerjaan |
| Nama | Diambil dari **Master Karyawan** |
| Nick Name | Nama singkat untuk tampilan |
| Tarif | Upah per jam/hari |

> **Apa yang terjadi di belakang layar?**  
> Nama diambil otomatis dari Master Karyawan — memastikan konsistensi data karyawan di seluruh modul. Jika seorang karyawan diganti kategorinya, perubahan ini otomatis tercermin di tarif produksi.

---

## Ringkasan Hari 2

Anda telah mengisi:
- ✅ COA (Chart of Accounts) dengan saldo awal
- ✅ Aktiva tetap dan metode penyusutan
- ✅ Gudang, Group, Subgroup, dan Item (Master Bahan)
- ✅ Supplier, Customer, dan Sales
- ✅ Departemen, Jabatan, dan Karyawan
- ✅ Mesin dan Tarif Tenaga Kerja untuk Produksi

> **Tips untuk besok:** Semua master data ini akan dipakai oleh transaksi Kas Bank dan Memorial. Jika ada yang terlewat, transaksi mungkin akan error atau salah posting.

---

## Troubleshooting Q&A

**Pertanyaan:** Kenapa dropdown pilihan kosong saat memilih akun?  
**Jawaban:** COA belum dibuat. Buka **Master Accounting > Pergiroan** dan pastikan akun sudah terdaftar.

**Pertanyaan:** Bagaimana jika item yang sudah ada butuh perubahan?  
**Jawaban:** Gunakan **Koreksi** di Master Bahan. Namun hati-hati — jika item sudah dipakai transaksi, perubahan bisa memengaruhi histori.

**Pertanyaan:** Supplier yang sama bisa didaftarkan dua kali?  
**Jawaban:** Bisa, tapi tidak disarankan. Gunakan kode yang berbeda atau gabungkan jika sebenarnya entitas yang sama.

**Pertanyaan:** Karyawan tidak muncul di dropdown Tarif Tenaga Kerja. Kenapa?  
**Jawaban:** Pastikan karyawan sudah terdaftar di **Master Lain > Karyawan** dengan status "Aktif".

**Pertanyaan:** Apa yang terjadi jika salah memilih grup aktiva?  
**Jawaban:** Penyusutan akan dihitung salah. Cek di **Posting** untuk memastikan akun debit/credit otomatis sesuai.
