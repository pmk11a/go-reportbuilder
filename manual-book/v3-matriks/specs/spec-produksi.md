# Spec: Produksi (Production)

> Modul eksekusi produksi — **SPK, Mesin & TK, Hasil Produksi, Finishing, Permintaan Bahan**

## 1. Spec Table

| Properti | Value |
|----------|-------|
| **Path Menu** | Produksi > SPK / Mesin & TK / Hasil Produksi / Finishing / Permintaan Bahan (+ Tambahan) |
| **Akses** | Staff Produksi (entry SPK) — **tanpa otorisasi setelah selesai** |
| **CRUD Ops** | Tambah, Koreksi, Hapus (kecuali yang sudah final) |
| **Validasi** | SPK linked dari SO Outstanding, dependency chain mesin→bahan |
| **Sub-Ledger** | Stok Bahan, Stok Barang Jadi, Kartu Mesin, Kartu Karyawan |

### Submenu Produksi (6 menu)

| # | Submenu | Fungsi |
|---|---------|--------|
| 1 | **SPK (Surat Perintah Kerja)** | Perintah kerja produksi (linked dari SO) |
| 2 | **Mesin & Tenaga Kerja** | Setup mesin, shift, karyawan |
| 3 | **Proses Finishing** | Tahap akhir produksi |
| 4 | **Hasil Produksi** | Catat output produksi (barang jadi) |
| 5 | **Permintaan Bahan** | Request bahan ke gudang (linked dari SPK) |
| 6 | **Permintaan Bahan Tambahan** | Tambahan request bahan |

### Catatan Penting

> **SPK TIDAK butuh otorisasi** setelah selesai — langsung final setelah entry. Beda dengan transaksi keuangan.

## 2. Field Reference Table

### 2a. Header SPK

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Nomor SPK | String | Auto | Auto-generated |
| Tanggal | Date | Ya | Tanggal mulai produksi |
| Shift | Enum (1/2/3) | Ya | Shift kerja |
| Kode Barang | Lookup Item | Ya | Auto-fill dari SO (Sales Order) |
| Tanggal Mulai | Date | Ya | — |
| Tanggal Selesai | Date | Ya | — |

### 2b. Detail SPK — Mesin & Tenaga Kerja

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Kode Mesin | Lookup Mesin | Ya | Mesin yang mengerjakan |
| Nama Mesin | String | Auto | Auto dari master |
| Kuantitas | Decimal | Ya | Jumlah barang yang dikerjakan |
| Jam Produksi | Decimal | Ya | Total jam kerja |
| Jam Kerja | Decimal | Ya | Jam kerja normal |
| Jam Lembur | Decimal | Tidak | Jam lembur (opsional) |
| Tenaga Kerja | Lookup Karyawan | Ya | Browse dari master (bisa multiple per mesin) |
| Hasil Baik | Decimal | — | Output barang bagus |
| Barang Rusak | Decimal | — | Output barang reject |

### 2c. Detail SPK — Bahan

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Kode Bahan | Lookup Item | Ya | **Hanya bahan yang ada di master** |
| Kuantitas | Decimal | Ya | Jumlah bahan |
| "Berapa Kali" | Integer | Ya | Frekuensi penggunaan |
| Keterangan | Text | Tidak | — |

> **Constraint**: Detail bahan harus diisi **setelah** detail mesin (dependency chain).

### 2d. Hasil Produksi

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Nomor Hasil Produksi | String | Auto | Auto-generated |
| SPK Ref | Lookup SPK | Ya | Link ke SPK |
| Hasil Baik | Decimal | Ya | Output barang bagus |
| Hasil Rusak | Decimal | Ya | Output barang reject |
| Tanggal | Date | Ya | — |

### 2e. Permintaan Bahan

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Nomor Permintaan | String | Auto | Auto-generated |
| SPK Ref | Lookup SPK | Ya | SPK yang butuh bahan |
| Tanggal | Date | Ya | — |
| Detail Bahan | Grid | Ya | Auto-fill dari sub-detail SPK |

## 3. Test Scenarios

### Skenario 1: Buat SPK dari SO Outstanding
```
Given SO "SO-001" sudah L1 approved (status: Outstanding Produksi)
When saya buka menu Produksi > SPK
And klik SO-001
Then SPK auto-generated dengan kode barang dari SO
And saya tinggal isi tanggal mulai/selesai + shift
```

### Skenario 2: Tambah detail mesin di SPK
```
Given SPK sudah dibuat dari SO
When saya tambah detail mesin
And isi kode mesin "M-001", qty 100, jam kerja 8, jam lembur 2
And pilih karyawan dari master
Then detail mesin tersimpan
```

### Skenario 3: Detail bahan tanpa isi mesin → tombol disabled
```
Given SPK belum punya detail mesin
When saya coba klik tombol "Tambah Bahan"
Then tombol disabled
And muncul tooltip: "Isi detail mesin dulu"
```

### Skenario 4: Tambah detail bahan setelah mesin
```
Given SPK sudah punya detail mesin "M-001"
When saya klik "Tambah Bahan" untuk M-001
Then sistem tampilkan bahan yang digunakan M-001 dari master
And saya bisa tambah kode bahan + qty + berapa kali
```

### Skenario 5: Browse tenaga kerja di SPK
```
Given saya tambah detail mesin di SPK
When saya klik field Tenaga Kerja
Then muncul modal browse karyawan
And saya bisa pilih multiple karyawan (per mesin bisa banyak karyawan)
```

### Skenario 6: Entry hasil produksi — pisah baik vs rusak
```
Given SPK sudah selesai
When saya buat Hasil Produksi linked ke SPK
And isi Hasil Baik = 95, Hasil Rusak = 5
Then stok barang jadi bertambah 95 (bagus saja)
And tercatat di kartu stok (rusak tidak menambah stok)
```

### Skenario 7: Permintaan Bahan ke gudang (auto kuantitas dari SPK)
```
Given SPK sudah punya detail mesin + bahan
When saya buat Permintaan Bahan linked ke SPK
Then kuantitas auto-fill dari total bahan di SPK
And dokumen terkirim ke menu Gudang
```

### Skenario 8: SPK selesai tanpa otorisasi → langsung final
```
Given SPK sudah lengkap (header + detail mesin + detail bahan)
When saya klik "Selesai"
Then status SPK langsung "Selesai" (tanpa perlu L1/L2)
```

### Skenario 9: Permintaan Bahan Tambahan (kedua)
```
Given Permintaan Bahan pertama sudah dibuat dari SPK
When stok bahan masih kurang
Then saya bisa buat Permintaan Bahan Tambahan
And linked ke SPK yang sama
```

### Skenario 10: Cross-check — SPK ada di Marketing (Outstanding) vs Produksi (Sedang Jalan)
```
Given SO sudah L1 approved
Then di Marketing: SO tidak ada (sudah bukan outstanding)
And di Produksi: SPK muncul dengan status "Sedang Jalan"
```

## 4. Database Impact

| Aksi | Tabel Affected | Posting Debit/Credit |
|------|---------------|---------------------|
| Buat SPK | `tbl_spk`, `tbl_spk_detail_mesin`, `tbl_spk_detail_bahan` | — (belum ada jurnal) |
| Update status SPK | `tbl_spk.status` (Draft → Sedang Jalan → Selesai) | — |
| Entry Hasil Produksi | `tbl_hasil_produksi`, `tbl_stok_barang_jadi` | — (stok bertambah) |
| Permintaan Bahan | `tbl_permintaan_bahan`, `tbl_permintaan_bahan_detail` | — (terkirim ke Gudang) |
| Permintaan Bahan Tambahan | `tbl_permintaan_bahan_tambahan` | — |
| Update Kartu Mesin | `tbl_kartu_mesin` (history jam kerja) | — (audit log) |
| Update Kartu Karyawan | `tbl_kartu_karyawan` (history kerja) | — (audit log) |
| Finishing | `tbl_finishing`, `tbl_status_barang` | — (status: siap jual) |

## 5. Edge Cases

| Kondisi | Expected Behavior |
|---------|-------------------|
| Tambah bahan tanpa detail mesin | Tombol disabled / warning: "Isi detail mesin dulu" |
| Hasil Rusak > Hasil Produksi | Warning: "Rusak tidak boleh > total produksi" |
| SPK tanpa detail mesin | Tolak simpan: "SPK harus punya minimal 1 detail mesin" |
| SPK tanpa detail bahan | Warning (boleh disimpan, produksi tanpa bahan) |
| Permintaan Bahan tanpa SPK ref | Tolak: "Pilih SPK referensi" |
| Hasil Produksi duplicate untuk SPK yang sama | Tolak: "SPK sudah punya Hasil Produksi" |
| Hasil Rusak = 100% | Warning: "Semua barang rusak, cek kualitas produksi" |
| Finishing tanpa Hasil Produksi | Tolak: "Belum ada Hasil Produksi untuk SPK ini" |
| Multiple karyawan per mesin | Boleh (tiap mesin bisa banyak karyawan) |
| Edit SPK yang sudah "Selesai" | Tolak: "SPK sudah selesai, tidak bisa diedit" |
