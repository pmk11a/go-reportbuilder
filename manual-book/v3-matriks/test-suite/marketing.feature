# language: id
# File: test-suite/marketing.feature
# Modul: Marketing (Sales Order) — SO → SPK → SJ → Invoice → Faktur → Retur/CN

Fitur: Marketing (Sales Order)
  Sebagai staff marketing
  Saya ingin mengelola pesanan customer sampai menjadi invoice dan retur
  Agar pesanan terpantau, piutang customer ter-update, dan laporan penjualan akurat

  Latar Belakang:
    Given saya login sebagai staff marketing
    And Master Karyawan "Andi" dengan kategori=Sales tersedia
    And Master Customer "CV Sentosa" tersedia
    And Master Bahan "BRG-001" harga Rp 50.000 tersedia
    And periode "Juni 2026" aktif

  # ============================================================
  # SALES ORDER (SO)
  # ============================================================

  @smoke @regression
  Skenario: Buat Sales Order baru
    Given saya di Marketing > Sales Order
    When saya pilih Sales "Andi" (kategori=Sales)
    And pilih Pelanggan "CV Sentosa"
    And tambah detail: Kode Barang "BRG-001", qty 100
    Then harga auto-load dari master (Rp 50.000)
    When klik Simpan
    Then SO tersimpan dengan subtotal Rp 5.000.000
    When otorisasi L1
    Then SO masuk ke sheet Outstanding Produksi

  @regression
  Skenario: Karyawan tanpa status Sales → combo kosong
    Given karyawan "Budi" kategori = "Lainnya" (bukan Sales)
    When saya buka combo Sales di form SO
    Then "Budi" tidak muncul di opsi

  @smoke @regression
  Skenario: Pilih barang → harga auto-load dari master
    Given saya tambah detail SO dengan Kode Barang "BRG-001"
    When saya pilih "BRG-001"
    Then kolom Harga otomatis terisi dari master
    And field Harga menjadi read-only

  @regression @requires-otorisasi
  Skenario: SO otorisasi L1 → muncul di Outstanding Produksi
    Given SO sudah L1 approved
    When saya buka menu Produksi
    Then SO muncul di sheet "Outstanding SO"

  @regression
  Skenario: Multi-detail SO dengan diskon
    Given saya buat SO dengan 2 item
    When Item 1: qty 100 harga 50.000 diskon 5%
    And Item 2: qty 50 harga 25.000 tanpa diskon
    Then subtotal item 1 = 4.750.000
    And subtotal item 2 = 1.250.000
    And total SO = 6.000.000

  # ============================================================
  # SALES ORDER WORKFLOW
  # ============================================================

  @smoke @regression
  Skenario: Tambah SO → otorisasi → muncul di Produksi
    Given saya di Marketing > Sales Order
    When saya klik "Tambah SO"
    And isi Sales + Pelanggan + detail barang
    And klik Simpan
    And otorisasi L1
    Then SO masuk daftar Outstanding Produksi
    And siap dibuat SPK

  # ============================================================
  # INVOICE & FAKTUR PAJAK
  # ============================================================

  @smoke @regression @requires-otorisasi
  Skenario: Buat Invoice Penjualan dari Surat Jalan
    Given Surat Jalan sudah dibuat dari SO
    When saya buat Invoice Penjualan
    And pilih Surat Jalan sebagai referensi
    Then invoice ter-link ke SJ
    And piutang customer bertambah otomatis

  @regression
  Skenario: Invoice tanpa Surat Jalan referensi → ditolak
    Given saya buat Invoice Penjualan
    When saya tidak pilih Surat Jalan
    And klik Simpan
    Then sistem menolak: "Pilih Surat Jalan referensi"

  @regression
  Skenario: Faktur Pajak otomatis muncul jika invoice punya PPN
    Given Invoice dengan PPN 11%
    When invoice diotorisasi
    Then Faktur Pajak otomatis ter-generate
    Dan ter-link ke invoice

  # ============================================================
  # RETUR & CREDIT NOTE
  # ============================================================

  @smoke @regression
  Skenario: Retur Surat Jalan
    Given Surat Jalan "SJ-001" sudah ada
    When customer return barang via menu Retur SJ
    And pilih SJ-001 sebagai referensi
    Then stok customer berkurang / plus ke retur
    And kartu piutang ter-update

  @regression
  Skenario: Retur Penjualan — update kartu piutang
    Given ada Retur Penjualan dari invoice yang sudah ada
    When saya buat Retur Penjualan
    And otorisasi L1+L2
    Then kartu piutang customer ter-update
    Dan jurnal retur terbentuk

  @smoke @regression
  Skenario: Credit Note untuk invoice
    Given Invoice "INV-001" sudah ada
    When saya buat Credit Note dengan referensi INV-001
    Then invoice ter-koreksi
    And piutang customer berkurang sesuai nilai CN

  @regression
  Skenario: Credit Note tanpa Invoice referensi → ditolak
    Given saya buat Credit Note
    When saya tidak pilih Invoice
    And klik Simpan
    Then sistem menolak: "Pilih Invoice referensi"

  @smoke @regression
  Skenario: Retur Gudang — barang kembali ke stok
    Given ada Surat Jalan dengan barang yang diretur
    When saya buat Retur Gudang
    Then stok barang di master item bertambah
    And tercatat di kartu stok

  @regression
  Skenario: Qty retur > qty SJ asal → ditolak
    Given SJ-001 dengan qty 100
    When saya buat Retur SJ qty 150
    Then sistem menolak: "Qty retur tidak boleh > qty SJ"
