# Spec: Setup Berkas (Menu Berkas)

## 1. Spec Table

| Properti | Value |
|----------|-------|
| **Path Menu** | Menu Berkas > [submenu] |
| **Akses** | User dengan hak Setup / Administrator |
| **CRUD Ops** | Tambah, Koreksi, Hapus, Otorisasi per submenu |
| **Validasi** | Periode kerja harus terbuka (kecuali untuk kunci periode); user dengan level sesuai |

## 2. Submenu Overview

| No | Submenu | Tipe | Wajib Pre-Transaksi |
|----|---------|------|---------------------|
| 1 | Setup Periode Kerja | Konfigurasi | Ya — wajib sebelum transaksi |
| 2 | Kunci Periode Kerja | Lock/Unlock | Setelah tutup buku |
| 3 | Set Nomor Transaksi & Perusahaan | Konfigurasi | Ya — sebelum transaksi pertama |
| 4 | Set Pemakaian (User Management) | CRUD User + Hak Akses | Sebelum user lain login |
| 5 | Ganti Password | Self-service | Setiap waktu |
| 6 | Lock | Aksi sistem | Setiap waktu |

## 3. Field Reference Table

### 3a. Setup Periode Kerja

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Bulan | Integer (1–12) | Ya | Bulan periode kerja aktif |
| Tahun | Integer (4 digit) | Ya | Tahun periode |
| Status | Enum (Aktif/Tutup) | Ya | Default: Aktif |

### 3b. Kunci Periode Kerja

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Bulan ke-1 s/d 12 | Boolean checkbox | - | Dicentang = terkunci (CRUD ditolak) |
| Kunci Otomatis | Boolean | Tidak | Jika dicentang, semua periode lampau auto-lock |

### 3c. Set Perusahaan (Tab 1)

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Nama Perusahaan | String | Ya | Nama resmi |
| Alamat | String | Ya | Jalan + nomor |
| Kota | String | Ya | — |
| Telepon | String | Tidak | — |
| Fax | String | Tidak | — |
| NPWP | String (15 digit) | Ya | Format: NN.NNN.NNN.N-NNN.NNN |

### 3d. Set Nomor Transaksi (Tab 2)

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Kode Transaksi | Enum | Ya | BKM, BBM, BNM, BJK, BCK |
| Kode Perusahaan | String | Ya | Inisial perusahaan (3–5 char) |
| Nomor Urut Awal | Integer | Ya | Default: 1 |
| Reset Periode | Enum | Ya | Bulanan / Tahunan |
| Format Tanggal | Date format | Tidak | Default: YYYYMMDD |

### 3e. Set Pemakaian — User (Submenu 4a)

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Nama User | String | Ya | Unique |
| Password | String (hash) | Ya | Min 6 karakter |
| Nama Lengkap | String | Ya | — |
| Jabatan | Lookup | Ya | Referensi Master Jabatan |
| Level User | Integer (1–5) | Ya | 1=Operator, 5=Direktur |

### 3f. Hak Akses per Modul (di form User)

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Tampil | Boolean | Ya | Modul visible di header |
| Tambah | Boolean | Tidak | Boleh tambah data |
| Koreksi | Boolean | Tidak | Boleh edit data |
| Hapus | Boolean | Tidak | Boleh hapus data |
| Otorisasi | Boolean | Tidak | Boleh approve transaksi |

### 3g. Set Report (Submenu 4b)

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Akses | Boolean | Ya | Boleh lihat/cetak |
| Desain | Boolean | Tidak | Boleh ubah layout report |

### 3h. Akses COA (Submenu 4c)

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| COA Tersedia (kolom kanan) | Multi-select | - | Akun yang boleh diakses user |
| COA Diblokir (kolom kiri) | Multi-select | - | Akun yang TIDAK boleh diakses |

## 4. Test Scenarios

### Skenario 1: Setup periode kerja aktif
```
Given saya berada di Menu Berkas > Setup Periode Kerja
When saya input bulan "6" dan tahun "2026"
And saya klik Simpan
Then periode "Juni 2026" tersimpan dengan status Aktif
And menjadi default transaksi di seluruh modul
```

### Skenario 2: Kunci periode memblokir CRUD
```
Given periode "Mei 2026" sudah di-close bulan lalu
When saya mencoba tambah transaksi Memorial untuk tanggal "2026-05-15"
Then sistem menolak dengan pesan "Periode Mei 2026 sudah terkunci"
And tombol Tambah nonaktif
```

### Skenario 3: Setup perusahaan lengkap dengan NPWP valid
```
Given saya di Tab Perusahaan
When saya isi Nama, Alamat, Kota, Telepon, Fax
And saya input NPWP "01.234.567.8-901.000"
And klik Simpan
Then data perusahaan tersimpan
And NPWP lolos validasi format
```

### Skenario 4: Set nomor BKM dengan reset bulanan
```
Given saya di Tab Set Nomor Transaksi
When saya pilih kode "BKM", kode perusahaan "ABC", reset "Bulanan"
And klik Simpan
Then format nomor berikutnya: "0001/BKM-ABC/202606"
And setiap awal bulan otomatis reset ke 0001
```

### Skenario 5: Buat user baru dengan hak akses terbatas
```
Given saya admin dengan akses Set Pemakaian
When saya buat user "kasir01" password "rahasia123"
And saya centang "Tampil" + "Tambah" di modul Kas Bank saja
And saya klik Simpan
Then user "kasir01" terdaftar
And saat login, hanya menu Berkas + Akunting yang tampil
```

### Skenario 6: Otorisasi 5 level berjenjang
```
Given transaksi BKM dengan nominal Rp 50.000.000
When Level 1 (Operator) sudah approve
Then tombol "Approve Level 2" aktif
And Level 2 tidak bisa approve sebelum Level 1
```

### Skenario 7: 1 user hanya boleh 1 level otorisasi
```
Given saya assign user "manager1" ke Level 3
When saya coba assign user yang sama ke Level 4
Then sistem menolak dengan pesan
  "User sudah memiliki level otorisasi. Batalkan dulu."
```

### Skenario 8: Batal otorisasi reset seluruh level
```
Given transaksi sudah diotorisasi Level 1 dan Level 2
When user dengan hak "Batal Otorisasi" klik tombol reset
Then kedua level otorisasi di-reset
And status transaksi kembali ke "Draft"
```

### Skenario 9: Ganti password self-service
```
Given saya login sebagai user biasa
When saya buka Menu Berkas > Ganti Password
And saya input password lama + baru
Then password berubah
And saya diminta login ulang dengan password baru
```

### Skenario 10: Lock mengakhiri sesi
```
Given saya sedang login
When saya klik Menu Berkas > Lock
Then aplikasi kembali ke halaman login
And session token dihapus dari storage
```

### Skenario 11: COA filter 2-kolom interface
```
Given saya admin, edit user "staff_akunting"
When saya pindahkan akun "Kas USD" dari kiri ke kanan
And klik Simpan
Then user "staff_akunting" hanya bisa pilih COA Kas IDR di transaksi
```

## 5. Database Impact

| Aksi | Tabel Affected | Posting |
|------|---------------|---------|
| Setup periode | `tbl_periode_kerja` | INSERT/UPDATE |
| Kunci periode | `tbl_periode_kerja` | UPDATE flag is_locked |
| Set perusahaan | `tbl_perusahaan` | INSERT/UPDATE |
| Set nomor | `tbl_format_nomor`, `tbl_running_number` | INSERT + reset counter |
| CRUD user | `tbl_user`, `tbl_user_access`, `tbl_user_otorisasi` | INSERT/UPDATE/DELETE |
| Set Report | `tbl_user_report_access` | INSERT/UPDATE |
| Akses COA | `tbl_user_coa_access` | INSERT/DELETE |
| Ganti password | `tbl_user` | UPDATE field password |
| Lock | `tbl_session` | DELETE session_id |

## 6. Edge Cases

| Kondisi | Expected Behavior |
|---------|-------------------|
| Coba kunci periode yang belum pernah dibuka | Warning: "Periode belum pernah di-setup, lanjutkan?" |
| Hapus user yang masih punya transaksi aktif | Tolak + tampilkan daftar transaksi terkait |
| Username duplikat | Tolak + pesan "Username sudah digunakan" |
| Password kurang dari 6 karakter | Tolak + pesan "Password minimal 6 karakter" |
| NPWP format invalid | Tolak + pesan "Format NPWP tidak valid" |
| Batal otorisasi oleh user tanpa hak | Tombol nonaktif / akses ditolak |
| Logout paksa (browser close) tanpa klik Lock | Session tetap expire sesuai timeout (default 30 menit) |
