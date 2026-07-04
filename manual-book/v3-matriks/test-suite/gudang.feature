# language: id
# File: test-suite/gudang.feature
# Modul: Gudang — Pengeluaran Bahan, Retur Bahan, Koreksi Bahan, Opname

Fitur: Gudang (Warehouse)
  Sebagai staff gudang
  Saya ingin mengelola pengeluaran, retur, dan koreksi bahan
  Agar stok bahan akurat, kartu bahan ter-update, dan jurnal terbentuk setelah otorisasi

  Latar Belakang:
    Given saya login sebagai staff gudang
    And Master Gudang "G1" tersedia
    And SPK "SPK-100" sudah punya detail bahan BRG-A qty 100 (sudah diotorisasi)
    And stok awal BRG-A di G1 = 500

  # ============================================================
  # PENGELUARAN BAHAN
  # ============================================================

  @smoke @regression @requires-otorisasi
  Skenario: Buat Pengeluaran Bahan dari SPK
    Given saya buka Pengeluaran Bahan
    When saya pilih SPK "SPK-100"
    Then detail bahan auto-fill dari sub-detail SPK
    When saya isi kuantitas 100 + Gudang "G1"
    And klik Simpan + Otorisasi L1
    Then stok BRG-A berkurang 100 (jadi 400)
    And jurnal: Debit WIP / Credit Stok Bahan

  @smoke @regression
  Skenario: Pilih bahan di luar SPK → ditolak
    Given saya di Pengeluaran Bahan untuk SPK-100
    When saya coba tambah bahan "BRG-C" (bukan di sub-detail SPK)
    Then sistem menolak: "Bahan harus ada di sub-detail SPK"

  @regression
  Skenario: Pengeluaran Bahan tanpa otorisasi → stok belum berkurang
    Given saya sudah simpan Pengeluaran Bahan (status: Draft)
    When saya cek stok BRG-A
    Then stok masih 500 (belum berkurang, menunggu otorisasi)

  @smoke @regression @requires-otorisasi
  Skenario: Otorisasi Pengeluaran Bahan L1 → stok berkurang + jurnal
    Given Pengeluaran Bahan status Draft
    When user L1 klik Otorisasi
    Then status: L1 approved
    And stok BRG-A berkurang sesuai qty
    And jurnal terbentuk di buku besar

  @regression
  Skenario: Qty pengambilan > qty rencana SPK → ditolak
    Given SPK-100 punya rencana BRG-A qty 100
    When saya buat Pengeluaran Bahan qty 150
    Then sistem menolak: "Tidak bisa melebihi rencana SPK"

  @regression
  Skenario: Pengeluaran Bahan dari multi-gudang
    Given saya buat Pengeluaran Bahan dengan 2 gudang (G1, G2)
    When saya isi qty 50 dari G1 dan qty 30 dari G2
    Then masing-masing gudang track terpisah
    And total qty keluar = 80

  # ============================================================
  # RETUR BAHAN
  # ============================================================

  @smoke @regression @requires-otorisasi
  Skenario: Retur Bahan valid → stok bertambah
    Given Penyerahan BRG-A qty 100 sudah diotorisasi
    When saya buat Retur Bahan qty 30
    And otorisasi L1
    Then stok BRG-A bertambah 30
    And jurnal retur terbentuk

  @smoke @regression
  Skenario: Retur Bahan dengan qty > qty ambil → ditolak
    Given saya pernah ambil BRG-A qty 100 dari SPK
    When saya buat Retur Bahan qty 150
    Then sistem menolak: "Qty retur tidak boleh > qty pernah keluar"

  @regression
  Skenario: Retur Bahan tanpa nomor penyerahan asal → ditolak
    Given saya buat Retur Bahan
    When saya tidak pilih Penyerahan asal
    And klik Simpan
    Then sistem menolak: "Pilih nomor penyerahan asal"

  # ============================================================
  # KOREKSI BAHAN (ADJUSTMENT)
  # ============================================================

  @smoke @regression @requires-otorisasi
  Skenario: Koreksi Bahan masuk (qty +) → stok bertambah
    Given saya buat Koreksi Bahan dengan tipe "Masuk"
    And isi BRG-A qty +50, alasan "Barang ditemukan di gudang lain"
    When otorisasi L1
    Then stok BRG-A bertambah 50
    And jurnal terbentuk

  @smoke @regression @requires-otorisasi
  Skenario: Koreksi Bahan keluar (qty −) → stok berkurang
    Given saya buat Koreksi Bahan dengan tipe "Keluar"
    And isi BRG-A qty -20, alasan "Barang rusak"
    When otorisasi L1
    Then stok BRG-A berkurang 20
    And jurnal terbentuk

  @regression
  Skenario: Koreksi Bahan tanpa alasan → ditolak
    Given saya buat Koreksi Bahan
    When saya tidak isi alasan
    And klik Simpan
    Then sistem menolak: "Alasan koreksi wajib diisi"

  # ============================================================
  # OPNAME
  # ============================================================

  @smoke @regression @requires-otorisasi
  Skenario: Opname menghasilkan selisih → Koreksi Bahan auto-generate
    Given saya jalankan Opname Gudang
    And stok sistem BRG-A = 100
    And stok fisik = 95 (selisih -5)
    When opname selesai
    Then sistem auto-generate Koreksi Bahan qty -5
    And tunggu otorisasi L1
    When saya otorisasi koreksi
    Then stok BRG-A menjadi 95

  @regression
  Skenario: Opname tanpa hasil input → ditolak
    Given saya jalankan Opname Gudang
    When saya tidak input hasil opname
    And klik Selesaikan
    Then sistem menolak: "Hasil opname belum lengkap"

  @regression
  Skenario: Opname tanpa selisih → tidak generate koreksi
    Given saya jalankan Opname Gudang
    And stok sistem = stok fisik (selisih = 0)
    When opname selesai
    Then tidak ada Koreksi Bahan yang ter-generate

  # ============================================================
  # VALIDASI UMUM
  # ============================================================

  @requires-otorisasi
  Skenario: Edit Pengeluaran Bahan yang sudah diotorisasi ditolak
    Given Pengeluaran Bahan status L1 approved
    When saya coba Edit
    Then sistem menolak: "Batalkan otorisasi dulu"

  @regression
  Skenario: Otorisasi L1 tanpa entry → ditolak
    Given saya belum entry Pengeluaran Bahan
    When saya langsung klik tombol Otorisasi
    Then sistem menolak: "Harus entry dulu sebelum otorisasi"
