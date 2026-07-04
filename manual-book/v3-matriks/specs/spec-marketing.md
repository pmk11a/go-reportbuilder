# Spec: Marketing (Sales Order)

> Alur: **SO → SPK (di Produksi) → Surat Jalan → Invoice Penjualan → Faktur Pajak**, plus **Retur & Credit Note**

## 1. Spec Table

| Properti | Value |
|----------|-------|
| **Path Menu** | Marketing > Sales Order / Surat Perintah Kirim / Surat Jalan / Invoice / Faktur Pajak / Retur / Credit Note |
| **Akses** | Staff Marketing + Otorisasi L1 (SO, SPK), L1+L2 (Invoice, Retur, Credit Note) |
| **CRUD Ops** | Tambah, Koreksi, Hapus, Otorisasi L1/L2, Batal Otorisasi |
| **Validasi** | Sales harus berstatus "Sales", harga auto-load dari master, qty sesuai SO |
| **Sub-Ledger** | Piutang Customer, Stok Barang, Buku Besar |

### Submenu Marketing (9 menu)

| # | Submenu | Fungsi |
|---|---------|--------|
| 1 | **Sales Order (SO)** | Pesanan dari customer, sumber data produksi |
| 2 | **Surat Perintah Kirim** | Perintah pengiriman barang ke customer |
| 3 | **Surat Jalan** | Dokumen pengiriman barang |
| 4 | **Invoice Penjualan** | Tagihan ke customer |
| 5 | **Faktur Pajak Penjualan** | Faktur pajak (PPN) untuk penjualan |
| 6 | **Retur Penjualan** | Retur barang dari customer |
| 7 | **Retur Surat Jalan** | Retur untuk dokumen surat jalan |
| 8 | **Credit Note** | Nota kredit (koreksi tagihan) |
| 9 | **Retur Gudang** | Retur barang ke gudang |

## 2. Field Reference Table

### 2a. Header Sales Order (SO)

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Nomor SO | String | Auto | Format: urut + kode + tgl |
| Tanggal | Date | Ya | Default: hari ini |
| Sales | Lookup Karyawan | Ya | Filter: `kategori = 'Sales'` |
| Pelanggan | Lookup Customer | Ya | Dari Master Customer |
| Keterangan | Text | Tidak | — |

### 2b. Detail SO

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Kode Barang | Lookup Item | Ya | Dari Master Bahan — harga auto-load |
| Harga | Decimal | Auto | Auto-set dari master |
| Kuantitas | Decimal | Ya | qty yang dipesan |
| Diskon | Decimal | Tidak | Potongan harga |
| Subtotal | Decimal | Auto | qty × harga − diskon |

### 2c. Invoice Penjualan

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Nomor Invoice | String | Auto | Format: urut + INV + tgl |
| Tanggal | Date | Ya | — |
| Customer | Lookup Customer | Ya | Auto dari Surat Jalan |
| Surat Jalan Ref | Lookup SJ | Ya | Link ke Surat Jalan asal |
| Total | Decimal | Auto | Total dari detail SJ |
| PPN | Decimal | Tidak | Otomatis 11% jika ada faktur pajak |

### 2d. Retur / Credit Note

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Tipe | Enum | Ya | Retur SJ / Retur Penjualan / Credit Note / Retur Gudang |
| Referensi | Lookup | Ya | Surat Jalan / Invoice asal |
| Alasan | Text | Ya | Alasan retur/koreksi |
| Detail Barang | Grid | Ya | Barang yang diretur + qty |

## 3. Test Scenarios

### Skenario 1: Buat Sales Order baru
```
Given saya di Marketing > Sales Order
When saya pilih Sales "Andi" (kategori=Sales)
And pilih Pelanggan "CV Sentosa"
And tambah detail: Kode Barang "BRG-001", qty 100
Then harga auto-load dari master (misal Rp 50.000)
When klik Simpan
Then SO tersimpan dengan subtotal Rp 5.000.000
When otorisasi L1
Then SO masuk ke sheet Outstanding Produksi
```

### Skenario 2: Karyawan tanpa status Sales → combo kosong
```
Given karyawan "Budi" kategori = "Lainnya" (bukan Sales)
When saya buka combo Sales di form SO
Then "Budi" tidak muncul di opsi
```

### Skenario 3: Pilih barang → harga auto-load
```
Given saya tambah detail SO dengan Kode Barang "BRG-001"
When saya pilih "BRG-001"
Then kolom Harga otomatis terisi dari master
And field Harga menjadi read-only
```

### Skenario 4: SO otorisasi L1 → muncul di Outstanding Produksi
```
Given SO sudah L1 approved
When saya buka menu Produksi
Then SO muncul di sheet "Outstanding SO"
```

### Skenario 5: Buat Invoice Penjualan dari Surat Jalan
```
Given Surat Jalan sudah dibuat dari SO
When saya buat Invoice Penjualan
And pilih Surat Jalan sebagai referensi
Then invoice ter-link ke SJ
And piutang customer bertambah otomatis
```

### Skenario 6: Retur Surat Jalan
```
Given Surat Jalan "SJ-001" sudah ada
When customer return barang via menu Retur SJ
And pilih SJ-001 sebagai referensi
Then stok customer berkurang / plus ke retur
And kartu piutang ter-update
```

### Skenario 7: Credit Note untuk invoice
```
Given Invoice "INV-001" sudah ada
When saya buat Credit Note dengan referensi INV-001
Then invoice ter-koreksi
And piutang customer berkurang sesuai nilai CN
```

### Skenario 8: Sales Order Workflow — tambah SO → otorisasi → muncul di Produksi
```
Given saya di Marketing > Sales Order
When saya klik "Tambah SO"
And isi Sales + Pelanggan + detail barang
And klik Simpan
And otorisasi L1
Then SO masuk daftar Outstanding Produksi
And siap dibuat SPK
```

### Skenario 9: Multi-detail SO dengan diskon
```
Given saya buat SO dengan 2 item
When Item 1: qty 100 harga 50.000 diskon 5%
And Item 2: qty 50 harga 25.000 tanpa diskon
Then subtotal item 1 = 4.750.000
And subtotal item 2 = 1.250.000
And total SO = 6.000.000
```

### Skenario 10: Retur Gudang — barang kembali ke stok
```
Given ada Surat Jalan dengan barang yang diretur
When saya buat Retur Gudang
Then stok barang di master item bertambah
And tercatat di kartu stok
```

## 4. Database Impact

| Aksi | Tabel Affected | Posting Debit/Credit |
|------|---------------|---------------------|
| Tambah SO | `tbl_so`, `tbl_so_detail` | — (belum ada jurnal) |
| Otorisasi SO L1 | `tbl_otorisasi_transaksi`, `tbl_outstanding_so` (update) | — |
| Tambah Surat Jalan | `tbl_surat_jalan`, `tbl_sj_detail`, `tbl_stok_keluar` | Debit Stok Keluar / — (jurnal saat invoice) |
| Buat Invoice + Otorisasi L2 | `tbl_invoice_penjualan`, `tbl_jurnal_header`, `tbl_jurnal_detail`, `tbl_kartu_piutang` | Debit Piutang Customer / Credit Penjualan |
| Faktur Pajak | `tbl_faktur_pajak_jual` | — (PPN attached ke invoice) |
| Retur SJ | `tbl_retur_sj`, `tbl_retur_sj_detail`, `tbl_kartu_piutang` (koreksi) | Debit Retur / Credit Piutang |
| Credit Note | `tbl_credit_note`, `tbl_kartu_piutang` | Koreksi piutang (reverse invoice) |
| Retur Gudang | `tbl_retur_gudang`, `tbl_stok_masuk` | Debit Stok / — (koreksi stok) |

## 5. Edge Cases

| Kondisi | Expected Behavior |
|---------|-------------------|
| Karyawan bukan Sales dipilih di combo Sales | Combo tidak menampilkan opsi tersebut |
| Harga auto-load di detail SO | Field harga read-only, hanya qty/diskon yang editable |
| Edit SO setelah diotorisasi L1 | Hanya batal otorisasi dulu |
| Hapus SO yang sudah ada SPK reference | Tolak + pesan "SO sudah dibuat SPK" |
| Invoice tanpa Surat Jalan referensi | Tolak + pesan "Pilih Surat Jalan referensi" |
| Credit Note tanpa Invoice referensi | Tolak + pesan "Pilih Invoice referensi" |
| Qty retur > qty SJ asal | Tolak + pesan "Qty retur tidak boleh > qty SJ" |
| Retur setelah invoice lunas | Warning: "Invoice sudah lunas, retur akan kurangi piutang" |
| Otorisasi L2 tanpa L1 | Tolak: "Otorisasi L1 belum dilakukan" |
| Hapus transaksi sudah diotorisasi penuh | Tolak, harus Batal Otorisasi dulu |
