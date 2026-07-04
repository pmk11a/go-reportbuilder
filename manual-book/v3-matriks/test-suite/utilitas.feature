# language: id
# File: test-suite/utilitas.feature
# Modul: Utilitas — Hitung Ulang Stock, HPP, Proses Posting, Audit Trail

Fitur: Utilitas (Utility Module)
  Sebagai administrator / manager
  Saya ingin menjalankan recalculate, posting otomatis, dan audit trail
  Agar data stok, HPP, dan jurnal selalu akurat sesuai transaksi terotorisasi

  Latar Belakang:
    Given saya login sebagai administrator
    And ada mutasi stok Juni 2026 (pembelian, penjualan, pengeluaran)
    And ada transaksi Draft dan L1 approved untuk periode Juni 2026
    And Master Bahan "BRG-001" tersedia

  # ============================================================
  # HITUNG ULANG STOCK
  # ============================================================

  @smoke @regression
  Skenario: Hitung Ulang Stock per bulan — semua barang
    Given saya buka Utilitas > Hitung Ulang Stock
    When saya pilih scope "Semua barang"
    And pilih periode "2026-06"
    And klik "Hitung"
    Then stok akhir Juni ter-update sesuai mutasi
    And adjustment tercatat jika ada selisih

  @smoke @regression
  Skenario: Hitung Ulang Stock per barang
    Given saya buka Utilitas > Hitung Ulang Stock
    When saya pilih scope "Per barang"
    And pilih BRG-001 + periode "2026-06"
    And klik "Hitung"
    Then hanya BRG-001 yang ter-update

  @regression
  Skenario: Hitung Ulang Stock tanpa pilih scope → ditolak
    Given saya buka Utilitas > Hitung Ulang Stock
    When saya tidak pilih scope
    And klik "Hitung"
    Then sistem menolak: "Pilih scope (semua/per barang)"

  @regression
  Skenario: Hitung Ulang Stock untuk barang yang di-close → ditolak
    Given BRG-002 sudah di-close period ini
    When saya coba Hitung Ulang Stock untuk BRG-002
    Then sistem menolak: "Barang sudah di-close period ini"

  # ============================================================
  # HPP (HARGA POKOK PENJUALAN)
  # ============================================================

  @smoke @regression
  Skenario: Hitung HPP semua barang
    Given saya buka Utilitas > HPP
    When saya pilih scope "Semua barang"
    And pilih periode "2026-06"
    And klik "Hitung"
    Then HPP ter-recalculate untuk semua barang jadi
    And tersimpan di master item.hpp

  @smoke @regression
  Skenario: Hitung HPP per barang
    Given saya buka Utilitas > HPP
    When saya pilih scope "Per barang"
    And pilih BRG-001
    And klik "Hitung"
    Then HPP BRG-001 ter-update

  @regression
  Skenario: HPP tanpa periode → ditolak
    Given saya buka Utilitas > HPP
    When saya tidak pilih periode
    And klik "Hitung"
    Then sistem menolak: "Periode wajib diisi"

  @regression
  Skenario: HPP untuk barang tanpa history produksi → warning
    Given BRG-X tidak punya history produksi
    When saya hitung HPP untuk BRG-X
    Then muncul warning: "Tidak ada history produksi, HPP = 0"

  # ============================================================
  # PROSES POSTING
  # ============================================================

  @smoke @regression
  Skenario: Proses Posting hanya transaksi terotorisasi
    Given ada transaksi Draft dan L1 approved untuk Juni 2026
    When saya buka Utilitas > Proses Posting
    And pilih periode "2026-06"
    And klik "Proses"
    Then hanya transaksi L1+ yang ter-posting
    And transaksi Draft di-skip otomatis

  @smoke @regression
  Skenario: Proses Posting invoice penjualan → jurnal + kartu piutang
    Given Invoice "INV-001" sudah L1+L2 approved
    When saya jalankan Proses Posting + sub-proses Jurnal + Kartu
    Then jurnal terbentuk di buku besar
    And kartu piutang customer ter-update +1 record

  @regression
  Skenario: Proses Posting periode terkunci → ditolak
    Given periode "Juni 2026" sudah dikunci
    When saya coba jalankan Proses Posting untuk Juni 2026
    Then sistem menolak: "Periode sudah terkunci"

  @regression
  Skenario: Proses Posting tanpa sub-proses dipilih → ditolak
    Given saya buka Utilitas > Proses Posting
    When saya tidak centang sub-proses apapun
    And klik "Proses"
    Then sistem menolak: "Pilih minimal 1 sub-proses"

  @smoke @regression
  Skenario: Posting multi-sub-proses sekaligus
    Given saya centang Jurnal + Kartu + Auto-Posting + HPP
    When saya klik "Proses Posting"
    Then semua sub-proses jalan sekaligus
    Dan hasil tercatat di log masing-masing

  @regression
  Skenario: Posting gagal di tengah jalan → rollback
    Given ada error di sub-proses Kartu
    When saya jalankan Proses Posting multi-sub-proses
    Then semua sub-proses di-rollback
    Dan tidak ada data ter-commit

  # ============================================================
  # BUKU AKTIVITAS PEMAKAI (AUDIT TRAIL)
  # ============================================================

  @smoke @regression
  Skenario: Buku Aktivitas filter by user
    Given ada perubahan data oleh user "Andi" hari ini
    When saya buka Buku Aktivitas
    And filter User = "Andi"
    And filter Tanggal = hari ini
    Then tampil hanya perubahan oleh Andi

  @smoke @regression
  Skenario: Buku Aktivitas filter by tanggal
    Given ada perubahan di banyak tanggal
    When saya buka Buku Aktivitas
    And filter Tanggal = 2026-06-26
    Then tampil hanya perubahan hari itu

  @regression
  Skenario: Audit trail edit master (before/after tercatat)
    Given master item BRG-A diedit: harga dari 50.000 → 55.000
    When saya cari di Buku Aktivitas dengan keyword "BRG-A"
    Then tampil entry: Tipe=Koreksi, Form=Master Bahan
    Dan Nilai Sebelum=50000, Nilai Sesudah=55000

  @regression
  Skenario: Audit log untuk user yang sudah dihapus
    Given user "X" sudah dihapus tapi ada audit log-nya
    When saya buka Buku Aktivitas
    Then tampil "User: [deleted - id:xxx]"

  @regression
  Skenario: Buku Aktivitas tanpa filter → tampil semua (dengan pagination)
    Given saya buka Buku Aktivitas tanpa filter
    Then tampil semua perubahan dengan pagination
