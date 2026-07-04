# language: id
# File: test-suite/master-data.feature
# Modul: Master Data (Accounting, Bahan, Supplier/Customer, Produksi, Lain)

Fitur: Manajemen Master Data
  Sebagai staff admin/master data
  Saya ingin mengelola semua data dasar sistem
  Agar transaksi bisa berjalan dengan data master yang lengkap dan valid

  Latar Belakang:
    Given saya sudah login sebagai admin dengan akses Master Data penuh
    And periode kerja aktif "Juni 2026"
    And Master Accounting sudah berisi COA dasar (1-1001 Kas, 2-1001 Utang Dagang, 1-1201 Piutang Dagang)

  # ============================================================
  # MASTER ACCOUNTING (COA)
  # ============================================================

  @smoke @regression
  Skenario: Buat COA baru tipe General
    Given saya di Master Accounting > Pergiroan
    When saya input kode "1-1101", keterangan "Bank BCA", kelompok "Aktiva"
    And saya pilih tipe "General", debit/credit "Debit"
    And saya klik Simpan
    Then COA baru tersimpan
    And saldo normal ter-set ke Debit

  @regression
  Skenario: Buat COA tipe Detail
    Given saya membuat COA baru
    When saya pilih tipe "Detail"
    Then COA bisa dipakai di jurnal entry memorial
    And tidak muncul sebagai induk sub-account

  @regression
  Skenario: Hapus COA yang punya saldo ditolak
    Given COA "1-1001" Kas punya saldo Rp 25.000.000
    When saya coba Hapus
    Then muncul pesan "Saldo saat ini: Rp 25.000.000, pindahkan dulu"

  @regression
  Skenario: Koreksi kelompok COA yang sudah dipakai ditolak
    Given COA "1-1001" sudah dipakai di 5 transaksi
    When saya coba ubah kelompok dari "Aktiva" ke "Pendapatan"
    Then muncul pesan "COA sudah dipakai di transaksi, tidak bisa diubah"

  @regression
  Skenario: Set saldo awal hanya di awal periode
    Given periode kerja sudah berjalan lebih dari 7 hari
    When saya coba input saldo awal baru
    Then muncul pesan "Saldo awal hanya dapat diedit di awal periode (7 hari pertama)"

  # ============================================================
  # MASTER AKTIVA
  # ============================================================

  @smoke @regression
  Skenario: Tambah aktiva tetap baru
    Given saya di Master Aktiva
    When saya input kode "AST-001", nama "Mesin Cetak Offset"
    And nilai perolehan "Rp 50.000.000", tanggal "2026-06-01"
    And susut 10% garis lurus per tahun
    And saya pilih COA aktiva "1-1500" dan akumulasi "1-1501"
    And klik Simpan
    Then aktiva tersimpan
    Dan sistem hitung penyusutan otomatis: Rp 5.000.000/tahun

  @regression
  Skenario: Persentase susut > 100% ditolak
    Given saya input persentase susut "150%"
    Then muncul pesan "Maksimal 100%"

  # ============================================================
  # MASTER BAHAN & BARANG
  # ============================================================

  @smoke @regression
  Skenario: Tambah gudang baru
    Given saya di Master Gudang
    When saya input kode "GD-01", nama "Gudang Pusat"
    And alamat "Jl. Industri No. 1"
    And klik Simpan
    Then gudang baru tersimpan
    Dan muncul di lookup transaksi pembelian

  @smoke @regression
  Skenario: Tambah group barang baru
    Given saya di Master Group Barang
    When saya input kode "GRP-01", nama "Bahan Baku"
    And tipe "Bahan"
    And klik Simpan
    Then group baru tersimpan
    Dan muncul sebagai opsi di Master Bahan

  @regression
  Skenario: Tambah subgroup yang konsisten dengan group
    Given group "Bahan Baku" sudah ada
    When saya tambah subgroup "Kertas" dengan induk "Bahan Baku"
    Then subgroup tersimpan
    Dan di Master Bahan, saat pilih Group="Bahan Baku"
    Then Subgroup auto-filter hanya menampilkan subgroup "Kertas"

  @regression
  Skenario: Pilih subgroup yang bukan turunan group ditolak
    Given saya input item
    When saya pilih Group "Bahan Bantu"
    And saya coba pilih Subgroup "Kertas" (induk: Bahan Baku)
    Then muncul pesan "Subgroup tidak sesuai dengan Group yang dipilih"

  @smoke @regression
  Skenario: Tambah item dengan 2 satuan
    Given saya di Master Bahan
    When saya input kode "BRG-001", nama "Kertas HVS A4"
    And Group "Bahan Baku", Subgroup "Kertas"
    And Satuan 1 = "Rim", Satuan 2 = "Lembar", Konversi = 500
    And klik Simpan
    Then item tersimpan
    Dan konversi 1 Rim = 500 Lembar tercatat

  @regression
  Skenario: Konversi satuan invalid
    Given saya input item dengan Konversi = "0"
    Then muncul pesan "Konversi harus lebih dari 0"

  @regression
  Skenario: Hapus item yang sudah dipakai transaksi
    Given item "BRG-001" sudah dipakai di 10 transaksi
    When saya coba Hapus
    Then muncul pesan "Item sudah dipakai di transaksi aktif. Nonaktifkan saja."

  # ============================================================
  # MASTER SUPPLIER & CUSTOMER
  # ============================================================

  @smoke @regression
  Skenario: Tambah area baru
    Given saya di Master Area
    When saya input kode "AR-01", nama "Jawa Barat"
    And klik Simpan
    Then area tersimpan
    Dan muncul sebagai opsi di Master Kota

  @smoke @regression
  Skenario: Tambah kota dengan area
    Given area "DKI Jakarta" sudah ada
    When saya input kode "KOTA-01", nama "Jakarta Selatan", area "DKI Jakarta"
    And klik Simpan
    Then kota tersimpan dengan relasi ke area

  @smoke @regression
  Skenario: Tambah supplier lengkap
    Given saya di Master Supplier
    When saya input kode "SUP-001", nama "PT Maju Jaya"
    And NPWP "01.234.567.8-901.000"
    And perkiraan "2-1001" (Utang Dagang), jenis "Harta Dagang"
    And klik Simpan
    Then supplier tersimpan
    Dan saat transaksi pembelian, posting ke akun Utang Dagang

  @regression
  Skenario: NPWP supplier format invalid ditolak
    Given saya input NPWP "12345"
    Then muncul pesan "Format NPWP tidak valid"

  @smoke @regression
  Skenario: Tambah customer dengan akun piutang
    Given saya di Master Customer
    When saya input kode "CUST-001", nama "CV Sentosa"
    And perkiraan "1-1201" (Piutang Dagang), kategori "Harta Dagang Lain-lain"
    And klik Simpan
    Then customer tersimpan

  @regression
  Skenario: Hapus customer yang punya piutang aktif ditolak
    Given customer "CUST-001" punya piutang belum lunas Rp 5.000.000
    When saya klik Hapus
    Then muncul pesan "Customer masih punya piutang aktif. Lunasi dulu."

  @smoke @regression
  Skenario: Sales linked ke karyawan kategori Sales
    Given saya di Master Sales
    When saya pilih karyawan "KRY-005" (kategori=Sales)
    Then field nama, telepon, NPWP otomatis terisi
    Dan saya klik Simpan → sales tersimpan

  @regression
  Skenario: Link sales ke karyawan non-Sales ditolak
    Given saya pilih karyawan "KRY-010" (kategori=Produksi)
    When saya klik Simpan
    Then muncul pesan
      "Karyawan bukan kategori Sales. Pilih dari master karyawan berkategori Sales."

  @regression
  Skenario: Sales Order hanya bisa dibuat oleh user kategori Sales
    Given user "KRY-005" adalah sales
    When dia coba buat Sales Order
    Then sistem menerima
    And jika user "KRY-010" (kategori Produksi) coba buat SO → ditolak

  # ============================================================
  # MASTER PRODUKSI
  # ============================================================

  @smoke @regression
  Skenario: Tambah mesin baru
    Given saya di Master Machine & Tarif
    When saya input kode "MCH-001", nama "Mesin Cetak Offset"
    And tarif "Rp 50.000/jam"
    And klik Simpan
    Then mesin tersimpan

  @regression
  Skenario: Tarif mesin nol ditolak
    Given saya input tarif "0"
    Then muncul pesan "Tarif harus lebih dari 0"

  @smoke @regression
  Skenario: Tambah tarif TK linked ke karyawan produksi
    Given Master Karyawan punya "KRY-020" (Andi, kategori Produksi)
    When saya di Tarif TK pilih Nama = "KRY-020"
    And saya input tarif "Rp 25.000/jam"
    And klik Simpan
    Then tarif TK tersimpan

  @regression
  Skenario: Pilih karyawan non-Produksi di Tarif TK ditolak
    Given saya pilih karyawan "KRY-005" (kategori Sales)
    When saya klik Simpan
    Then muncul pesan "Tarif TK hanya untuk karyawan kategori Produksi"

  @regression
  Skenario: Hapus mesin yang sedang dipakai SPK aktif
    Given mesin "MCH-001" dipakai di SPK aktif
    When saya coba Hapus
    Then muncul pesan "Sedang dipakai di SPK #XYZ"

  # ============================================================
  # MASTER LAIN-LAIN
  # ============================================================

  @smoke @regression
  Skenario: Tambah departemen baru
    Given saya di Master Departemen
    When saya input kode "DEPT-01", nama "Produksi"
    And klik Simpan
    Then departemen tersimpan

  @smoke @regression
  Skenario: Tambah jabatan baru
    Given saya di Master Jabatan
    When saya input kode "JBT-01", nama "Supervisor Produksi"
    And klik Simpan
    Then jabatan tersimpan

  @smoke @regression
  Skenario: Tambah karyawan kategori Sales
    Given saya di Master Karyawan
    When saya input kode "KRY-005", nama "Budi Santoso"
    And kategori "Sales"
    And klik Simpan
    Then karyawan tersimpan
    Dan otomatis eligible untuk dibuat Master Sales

  @smoke @regression
  Skenario: Set kurs valas baru
    Given saya di Master Valas
    When saya input kode "USD", nama "US Dollar", kurs "Rp 15.500"
    And tanggal kurs "2026-06-26"
    And klik Simpan
    Then valas tersimpan
    Dan saat transaksi USD, kurs otomatis 15.500

  @regression
  Skenario: Kurs tanpa tanggal ditolak
    Given saya input kurs tanpa isi tanggal
    Then muncul pesan "Tanggal kurs wajib diisi"

  @regression
  Skenario: Nonaktifkan karyawan
    Given karyawan "KRY-005" sudah ada
    When saya ubah status ke "Tidak Aktif" dan Simpan
    Then karyawan tidak muncul di lookup SO baru
    Dan SO yang sudah ada tetap valid