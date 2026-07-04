# language: id
# File: test-suite/pengadaan.feature
# Modul: Pengadaan (Procurement) — PR → PO → LPB → Faktur Pajak

Fitur: Pengadaan (Procurement)
  Sebagai staff pengadaan
  Saya ingin mengelola alur pembelian dari PR sampai Faktur Pajak
  Agar stok barang bertambah, hutang supplier ter-update, dan buku besar akurat

  Latar Belakang:
    Given saya login sebagai staff pengadaan
    And periode "Juni 2026" aktif dan tidak terkunci
    And Master Supplier "PT Maju Jaya" tersedia
    And Master Bahan "BRG-001" dengan harga Rp 50.000 tersedia
    And Master Gudang "G1" tersedia

  # ============================================================
  # ALUR LENGKAP
  # ============================================================

  @smoke @regression
  Skenario: Alur lengkap PR → PO → LPB → Faktur Pajak
    Given saya di Pengadaan > PR
    When saya buat PR item BRG-001 qty 100
    And klik Simpan
    Then PR tersimpan dengan nomor urut "0001/PR-..."
    When saya buat PO dari PR tersebut
    And otorisasi PO L1
    Then PO ter-link ke PR, qty carry-through
    When LPB dibuat dari PO qty 100
    And otorisasi LPB L1 + L2
    Then jurnal: Debit Stok / Credit Hutang Supplier
    And kartu hutang supplier bertambah
    When saya buat Faktur Pajak dengan pilih LPB
    And otorisasi L1 + L2
    Then jurnal terbentuk dan kartu hutang supplier update

  # ============================================================
  # PENERIMAAN ASC
  # ============================================================

  @smoke @regression
  Skenario: Edit harga di Penerimaan ASC (hanya harga)
    Given Penerimaan ASC sudah muncul otomatis dari PO
    When saya coba edit field "Datang"
    Then field read-only, edit ditolak
    When saya coba edit field "Supplier"
    Then field read-only, edit ditolak
    When saya edit field "Harga" saja
    Then perubahan tersimpan

  @regression
  Skenario: Penerimaan ASC non-harga field read-only
    Given saya di Penerimaan ASC
    When saya periksa semua field di detail
    Then hanya field "Harga" yang editable
    Dan field Datang, Supplier, Item, Qty read-only

  # ============================================================
  # OTORISASI LPB
  # ============================================================

  @smoke @regression @requires-otorisasi
  Skenario: Otorisasi LPB L2 → jurnal + kartu hutang
    Given LPB status L1 approved
    When user L2 klik Otorisasi
    Then jurnal terbentuk ke buku besar
    And kartu hutang supplier ter-update +1 record

  @requires-otorisasi
  Skenario: Otorisasi L2 tanpa L1 ditolak
    Given LPB masih status Draft (belum L1)
    When user L2 langsung coba Approve
    Then sistem menolak dengan pesan "Otorisasi Level 1 belum dilakukan"

  # ============================================================
  # FAKTUR PAJAK
  # ============================================================

  @smoke @regression
  Skenario: Faktur Pajak tanpa centang LPB → gagal
    Given saya buka Informasi Pembelian
    When saya pilih supplier "PT Maju Jaya"
    And saya tidak centang LPB manapun
    And klik Proses
    Then sistem menolak: "Pilih minimal 1 LPB"

  @regression
  Skenario: Centang LPB yang sudah punya faktur → duplicate dicegah
    Given LPB-001 sudah punya Faktur Pajak
    When saya buka Informasi Pembelian dan cari LPB-001
    Then LPB-001 tidak muncul di daftar (filter: belum punya faktur)

  @regression @requires-otorisasi
  Skenario: Otorisasi Faktur Pajak L2 → jurnal + kartu hutang
    Given Faktur Pajak sudah dibuat (centang LPB)
    And status: L1 approved
    When user L2 klik Otorisasi
    Then jurnal otomatis terbentuk di buku besar
    And kartu hutang supplier update

  # ============================================================
  # CONSTRAINT HAPUS
  # ============================================================

  @regression
  Skenario: Hapus PO yang punya LPB reference → ditolak
    Given PO-001 sudah punya LPB reference
    When saya coba Hapus PO-001
    Then sistem menolak: "PO tidak bisa dihapus, sudah ada LPB reference"

  @smoke @regression
  Skenario: Hapus PO tanpa LPB reference → berhasil
    Given PO-002 belum punya LPB reference
    When saya klik Hapus
    And konfirmasi Hapus
    Then PO-002 terhapus dari daftar

  @regression
  Skenario: Hapus PR yang punya PO reference → ditolak
    Given PR-001 sudah punya PO
    When saya coba Hapus PR
    Then sistem menolak: "PR sudah ada PO reference"

  @regression
  Skenario: Hapus LPB yang punya Faktur Pajak → ditolak
    Given LPB-001 sudah punya Faktur Pajak
    When saya coba Hapus LPB-001
    Then sistem menolak: "LPB sudah ada Faktur Pajak"

  # ============================================================
  # OUTSTANDING & KUANTITAS PARSIAL
  # ============================================================

  @regression
  Skenario: Lihat Outstanding PR
    Given saya buka laporan Outstanding PR
    Then tampil daftar PR yang belum dibuat PO (qty outstanding)

  @smoke @regression
  Skenario: Kuantitas parsial — PO 100, LPB 60, outstanding 40
    Given PO dibuat dengan qty 100
    When saya buat LPB qty 60 (parsial)
    And otorisasi L1 + L2
    Then LPB tersimpan qty 60
    And Outstanding PO = 40 (status: parsial)

  @regression
  Skenario: Qty LPB > qty PO → ditolak
    Given PO dengan qty 100
    When saya coba buat LPB qty 150
    Then sistem menolak: "Qty LPB tidak boleh > qty PO"
