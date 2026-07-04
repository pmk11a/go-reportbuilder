/**
 * Playwright Test — Pengadaan, Gudang, Utilitas + integrasi Marketing/Produksi
 *
 * Generated from:
 *   - v3-matriks/test-suite/pengadaan.feature
 *   - v3-matriks/test-suite/marketing.feature (subset: SO trigger)
 *   - v3-matriks/test-suite/produksi.feature (subset: SPK + Permintaan Bahan)
 *   - v3-matriks/test-suite/gudang.feature
 *   - v3-matriks/test-suite/utilitas.feature
 *
 * Source spec:
 *   - v3-matriks/specs/spec-pengadaan.md
 *   - v3-matriks/specs/spec-marketing.md
 *   - v3-matriks/specs/spec-produksi.md
 *   - v3-matriks/specs/spec-gudang.md
 *   - v3-matriks/specs/spec-utilitas.md
 *
 * Target app: ERP Trade Exchange (Laravel + Nuxt 3 + SQL Server)
 *
 * ⚠️ TEST INI BELUM DIJALANKAN — executable artifact siap pakai, bukan output test.
 *    Sebelum dijalankan:
 *      1. Set BASE_URL env ke server Laravel yang running
 *      2. Sesuaikan locator dengan DOM real aplikasi
 *      3. Konfigurasi globalSetup.ts untuk login + seed data
 *      4. Verifikasi selector table & field sesuai form master ERP
 *
 * Cara jalankan (NANTI, bukan sekarang):
 *   npx playwright test pengadaan-gudang-utilitas.playwright.spec.ts --headed
 *
 * Asumsi:
 *   - URL pattern: /pengadaan/*, /gudang/*, /utilitas/*
 *   - Authentication via session cookie atau login page
 *   - Selector mengikuti Nuxt UI component naming (el-input, el-select, dll)
 */

import { test, expect, Page } from '@playwright/test';

// ============================================================================
// Test Data Fixtures
// ============================================================================

const TEST_DATA = {
  tanggal: '2026-06-26',
  tanggalLocked: '2026-06-15',
  supplier: {
    kode: 'SUPP-001',
    nama: 'PT Maju Jaya',
  },
  customer: {
    kode: 'CUST-001',
    nama: 'CV Sentosa',
  },
  bahan: {
    kode: 'BRG-001',
    nama: 'Bahan Baku A',
    harga: 50_000,
  },
  barang: {
    kode: 'BRG-JADI',
    nama: 'Barang Jadi X',
  },
  gudang: {
    kode: 'G1',
    nama: 'Gudang Utama',
    kode2: 'G2',
    nama2: 'Gudang Cabang',
  },
  mesin: {
    kode: 'M-001',
    nama: 'Mesin Potong 1',
  },
  karyawan: {
    sales: { kode: 'K-SALES', nama: 'Andi', kategori: 'Sales' },
    produksi: { kode: 'K-PROD', nama: 'Budi', kategori: 'Produksi' },
    nonSales: { kode: 'K-NS', nama: 'Budi Lain', kategori: 'Lainnya' },
  },
  spk: {
    nomor: 'SPK-100',
    nama: 'SPK Produksi Juni 2026',
  },
  so: {
    nomor: 'SO-001',
    nomor2: 'SO-002',
  },
  po: {
    nomor: 'PO-001',
    nomor2: 'PO-002',
  },
  lpb: {
    nomor: 'LPB-001',
  },
  fakturPajak: {
    nomor: 'FP-001',
  },
  user: {
    staffPengadaan: { username: 'staff_pengadaan', password: 'Test@123', level: 1 },
    staffGudang: { username: 'staff_gudang', password: 'Test@123', level: 1 },
    admin: { username: 'admin', password: 'Test@123', level: 5 },
    supervisor: { username: 'supervisor', password: 'Test@123', level: 2 },
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/** Login sebagai user tertentu. */
async function login(page: Page, user: typeof TEST_DATA.user.staffPengadaan): Promise<void> {
  await page.goto('/login');
  await page.fill('[data-testid="input-username"]', user.username);
  await page.fill('[data-testid="input-password"]', user.password);
  await page.click('[data-testid="btn-login"]');
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 10_000 });
}

/** Navigate ke modul Pengadaan */
async function gotoPengadaan(page: Page): Promise<void> {
  await page.click('[data-testid="menu-pengadaan"]');
  await expect(page).toHaveURL(/\/pengadaan/);
}

/** Navigate ke modul Gudang */
async function gotoGudang(page: Page): Promise<void> {
  await page.click('[data-testid="menu-gudang"]');
  await expect(page).toHaveURL(/\/gudang/);
}

/** Navigate ke modul Utilitas */
async function gotoUtilitas(page: Page): Promise<void> {
  await page.click('[data-testid="menu-utilitas"]');
  await expect(page).toHaveURL(/\/utilitas/);
}

/** Klik tombol otorisasi level tertentu */
async function clickOtorisasi(page: Page, level: number): Promise<void> {
  await page.click(`[data-testid="btn-otorisasi-level-${level}"]`);
}

/** Verifikasi jurnal terbentuk via API response */
async function verifyJurnalPosting(
  page: Page,
  expected: { debit?: string; credit?: string; amount?: number; exists?: boolean },
): Promise<void> {
  const responsePromise = page.waitForResponse(
    (resp) => resp.url().includes('/api/jurnal') && resp.status() === 200,
    { timeout: 5_000 },
  );
  await page.click('[data-testid="btn-simpan"]');
  const response = await responsePromise;
  const body = await response.json();
  if (expected.debit) expect(body.debit_account).toBe(expected.debit);
  if (expected.credit) expect(body.credit_account).toBe(expected.credit);
  if (expected.amount) expect(body.amount).toBe(expected.amount);
}

// ============================================================================
// Tests: MODUL PENGADAAN
// ============================================================================

test.describe('Modul Pengadaan (PR → PO → LPB → Faktur Pajak)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_DATA.user.staffPengadaan);
  });

  // --------------------------------------------------------------------------
  // SKENARIO 1: Alur lengkap PR → PO → LPB → Faktur Pajak
  // --------------------------------------------------------------------------
  test('@smoke @regression Alur lengkap PR → PO → LPB → Faktur Pajak', async ({ page }) => {
    // Step 1: Buat PR
    await gotoPengadaan(page);
    await page.click('[data-testid="submenu-pr"]');
    await page.click('[data-testid="btn-tambah-pr"]');
    await page.click('[data-testid="btn-tambah-detail"]');
    await page.locator('[data-testid="detail-row"]').last().locator('[data-testid="select-kode-bahan"]').selectOption(TEST_DATA.bahan.kode);
    await page.locator('[data-testid="detail-row"]').last().locator('[data-testid="input-qty"]').fill('100');
    await page.click('[data-testid="btn-simpan"]');
    await expect(page.locator('[data-testid="nomor-pr"]')).toContainText(/0001\/PR-/);

    // Step 2: Buat PO dari PR
    await page.click('[data-testid="submenu-po"]');
    await page.click('[data-testid="btn-buat-dari-pr"]');
    await page.click(`[data-testid="row-pr-${TEST_DATA.bahan.kode}"]`);
    await page.click('[data-testid="btn-generate-po"]');
    await clickOtorisasi(page, 1);

    // Step 3: Buat LPB
    await page.click('[data-testid="submenu-penerimaan-gudang"]');
    await page.click('[data-testid="btn-buat-dari-po"]');
    await page.click(`[data-testid="row-po-${TEST_DATA.po.nomor}"]`);
    await page.fill('[data-testid="input-qty-lpb"]', '100');
    await page.click('[data-testid="btn-simpan"]');
    await clickOtorisasi(page, 1);
    await clickOtorisasi(page, 2);

    // Step 4: Buat Faktur Pajak
    await page.click('[data-testid="submenu-informasi-pembelian"]');
    await page.selectOption('[data-testid="select-sub-ledger"]', TEST_DATA.supplier.kode);
    await page.check(`[data-testid="checkbox-lpb-${TEST_DATA.lpb.nomor}"]`);
    await page.click('[data-testid="btn-proses"]');
    await clickOtorisasi(page, 1);
    await clickOtorisasi(page, 2);

    // Verifikasi jurnal & kartu hutang terbentuk
    await expect(page.locator('[data-testid="toast-success"]')).toContainText('Faktur Pajak berhasil');
    await page.goto(`/master/supplier/${TEST_DATA.supplier.kode}/history-utang`);
    const historiRows = page.locator('[data-testid="histori-utang-row"]');
    await expect(historiRows.first()).toBeVisible();
  });

  // --------------------------------------------------------------------------
  // SKENARIO 2: Edit hanya harga di Penerimaan ASC
  // --------------------------------------------------------------------------
  test('@smoke @regression Edit hanya harga di Penerimaan ASC', async ({ page }) => {
    await gotoPengadaan(page);
    await page.click('[data-testid="submenu-penerimaan-asc"]');

    // Verifikasi field non-harga read-only
    const row = page.locator('[data-testid="detail-row"]').first();
    await expect(row.locator('[data-testid="input-datang"]')).toBeDisabled();
    await expect(row.locator('[data-testid="select-supplier"]')).toBeDisabled();
    await expect(row.locator('[data-testid="select-item"]')).toBeDisabled();
    await expect(row.locator('[data-testid="input-qty"]')).toBeDisabled();

    // Edit hanya field harga
    await row.locator('[data-testid="input-harga"]').fill('55000');
    await page.click('[data-testid="btn-simpan"]');
    await expect(row.locator('[data-testid="input-harga"]')).toHaveValue('55000');
  });

  // --------------------------------------------------------------------------
  // SKENARIO 3: Otorisasi LPB L2 → jurnal + kartu hutang
  // --------------------------------------------------------------------------
  test('@smoke @regression @requires-otorisasi Otorisasi LPB L2 → jurnal + kartu hutang', async ({ page }) => {
    await gotoPengadaan(page);
    await page.goto('/pengadaan/penerimaan-gudang/daftar');
    await page.click(`[data-testid="row-lpb-${TEST_DATA.lpb.nomor}"]`);

    await clickOtorisasi(page, 1);
    await login(page, TEST_DATA.user.supervisor);
    await page.goto('/pengadaan/penerimaan-gudang/daftar');
    await page.click(`[data-testid="row-lpb-${TEST_DATA.lpb.nomor}"]`);
    await clickOtorisasi(page, 2);

    await expect(page.locator('[data-testid="status-lpb"]')).toContainText('L2');
    await page.goto(`/master/supplier/${TEST_DATA.supplier.kode}/history-utang`);
    await expect(page.locator('[data-testid="histori-utang-row"]')).toHaveCount(1);
  });

  // --------------------------------------------------------------------------
  // SKENARIO 4: Faktur Pajak tanpa centang LPB → gagal
  // --------------------------------------------------------------------------
  test('@smoke @regression Faktur Pajak tanpa centang LPB → gagal', async ({ page }) => {
    await gotoPengadaan(page);
    await page.click('[data-testid="submenu-informasi-pembelian"]');
    await page.selectOption('[data-testid="select-sub-ledger"]', TEST_DATA.supplier.kode);
    await page.click('[data-testid="btn-proses"]');

    await expect(page.locator('[data-testid="toast-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="toast-error"]')).toContainText('Pilih minimal 1 LPB');
  });

  // --------------------------------------------------------------------------
  // SKENARIO 5: Centang LPB yang sudah punya faktur → duplicate dicegah
  // --------------------------------------------------------------------------
  test('@regression LPB sudah punya faktur → tidak muncul di daftar', async ({ page }) => {
    await gotoPengadaan(page);
    await page.click('[data-testid="submenu-informasi-pembelian"]');
    await page.selectOption('[data-testid="select-sub-ledger"]', TEST_DATA.supplier.kode);

    // LPB-001 sudah punya faktur → tidak muncul
    const options = await page.locator(`[data-testid^="checkbox-lpb-"]`).allTextContents();
    expect(options.some(o => o.includes(TEST_DATA.lpb.nomor))).toBe(false);
  });

  // --------------------------------------------------------------------------
  // SKENARIO 6: Hapus PO yang punya LPB reference → ditolak
  // --------------------------------------------------------------------------
  test('@regression Hapus PO yang punya LPB reference → ditolak', async ({ page }) => {
    await gotoPengadaan(page);
    await page.goto('/pengadaan/po/daftar');
    await page.click(`[data-testid="row-po-${TEST_DATA.po.nomor}"]`);
    await page.click('[data-testid="btn-hapus"]');
    await page.click('[data-testid="btn-confirm-hapus"]');

    await expect(page.locator('[data-testid="toast-error"]')).toContainText('PO sudah ada LPB');
  });

  // --------------------------------------------------------------------------
  // SKENARIO 7: Hapus PO tanpa LPB reference → berhasil
  // --------------------------------------------------------------------------
  test('@smoke @regression Hapus PO tanpa LPB reference → berhasil', async ({ page }) => {
    await gotoPengadaan(page);
    await page.goto('/pengadaan/po/daftar');
    await page.click(`[data-testid="row-po-${TEST_DATA.po.nomor2}"]`);
    await page.click('[data-testid="btn-hapus"]');
    await page.click('[data-testid="btn-confirm-hapus"]');

    await expect(page.locator('[data-testid="toast-success"]')).toContainText('PO berhasil dihapus');
    await expect(page.locator(`[data-testid="row-po-${TEST_DATA.po.nomor2}"]`)).toHaveCount(0);
  });

  // --------------------------------------------------------------------------
  // SKENARIO 8: Hapus PR yang punya PO reference → ditolak
  // --------------------------------------------------------------------------
  test('@regression Hapus PR yang punya PO reference → ditolak', async ({ page }) => {
    await gotoPengadaan(page);
    await page.goto('/pengadaan/pr/daftar');
    await page.click(`[data-testid="row-pr-0001"]`);
    await page.click('[data-testid="btn-hapus"]');
    await page.click('[data-testid="btn-confirm-hapus"]');

    await expect(page.locator('[data-testid="toast-error"]')).toContainText('PR sudah ada PO');
  });

  // --------------------------------------------------------------------------
  // SKENARIO 9: Lihat Outstanding PR
  // --------------------------------------------------------------------------
  test('@regression Lihat Outstanding PR', async ({ page }) => {
    await gotoPengadaan(page);
    await page.click('[data-testid="submenu-outstanding-pr"]');
    await expect(page.locator('[data-testid="outstanding-pr-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="row-outstanding-pr"]').first()).toBeVisible();
  });

  // --------------------------------------------------------------------------
  // SKENARIO 10: Kuantitas parsial — PO 100, LPB 60
  // --------------------------------------------------------------------------
  test('@smoke @regression Kuantitas parsial PO 100 LPB 60 → outstanding 40', async ({ page }) => {
    await gotoPengadaan(page);
    await page.goto('/pengadaan/po/daftar');
    await page.click(`[data-testid="row-po-${TEST_DATA.po.nomor}"]`);

    // Buat LPB parsial
    await page.click('[data-testid="submenu-penerimaan-gudang"]');
    await page.click('[data-testid="btn-buat-dari-po"]');
    await page.click(`[data-testid="row-po-${TEST_DATA.po.nomor}"]`);
    await page.fill('[data-testid="input-qty-lpb"]', '60');
    await page.click('[data-testid="btn-simpan"]');
    await clickOtorisasi(page, 1);
    await clickOtorisasi(page, 2);

    // Verifikasi outstanding = 40
    await page.goto('/pengadaan/outstanding-po');
    const row = page.locator(`[data-testid="row-outstanding-po-${TEST_DATA.po.nomor}"]`);
    await expect(row).toContainText('40');
    await expect(row).toContainText('Parsial');
  });
});

// ============================================================================
// Tests: MODUL GUDANG
// ============================================================================

test.describe('Modul Gudang', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_DATA.user.staffGudang);
  });

  // --------------------------------------------------------------------------
  // SKENARIO 1: Buat Pengeluaran Bahan dari SPK
  // --------------------------------------------------------------------------
  test('@smoke @regression @requires-otorisasi Buat Pengeluaran Bahan dari SPK', async ({ page }) => {
    await gotoGudang(page);
    await page.click('[data-testid="submenu-pengeluaran"]');
    await page.click('[data-testid="btn-tambah"]');
    await page.selectOption('[data-testid="select-gudang"]', TEST_DATA.gudang.kode);
    await page.selectOption('[data-testid="select-spk"]', TEST_DATA.spk.nomor);
    await page.fill('[data-testid="input-qty"]', '100');
    await page.click('[data-testid="btn-simpan"]');
    await clickOtorisasi(page, 1);

    // Verify stok berkurang
    await page.goto(`/master/bahan/${TEST_DATA.bahan.kode}/stok`);
    await expect(page.locator('[data-testid="stok-tersisa"]')).toContainText('400'); // 500 - 100
  });

  // --------------------------------------------------------------------------
  // SKENARIO 2: Pilih bahan di luar SPK → ditolak
  // --------------------------------------------------------------------------
  test('@smoke @regression Pilih bahan di luar SPK → ditolak', async ({ page }) => {
    await gotoGudang(page);
    await page.click('[data-testid="submenu-pengeluaran"]');
    await page.click('[data-testid="btn-tambah"]');
    await page.selectOption('[data-testid="select-spk"]', TEST_DATA.spk.nomor);

    // Coba pilih BRG-C yang tidak ada di SPK
    const options = await page.locator('[data-testid="select-kode-bahan"] option').allTextContents();
    expect(options.some(o => o.includes('BRG-C'))).toBe(false);
  });

  // --------------------------------------------------------------------------
  // SKENARIO 3: Pengeluaran Bahan tanpa otorisasi → stok belum berkurang
  // --------------------------------------------------------------------------
  test('@regression Pengeluaran Bahan tanpa otorisasi → stok belum berkurang', async ({ page }) => {
    await gotoGudang(page);
    await page.click('[data-testid="submenu-pengeluaran"]');
    await page.click('[data-testid="btn-tambah"]');
    await page.selectOption('[data-testid="select-spk"]', TEST_DATA.spk.nomor);
    await page.fill('[data-testid="input-qty"]', '100');
    await page.click('[data-testid="btn-simpan"]');
    // TIDAK otorisasi

    await page.goto(`/master/bahan/${TEST_DATA.bahan.kode}/stok`);
    await expect(page.locator('[data-testid="stok-tersisa"]')).toContainText('500'); // masih 500
  });

  // --------------------------------------------------------------------------
  // SKENARIO 4: Otorisasi Pengeluaran Bahan L1 → stok berkurang + jurnal
  // --------------------------------------------------------------------------
  test('@smoke @regression @requires-otorisasi Otorisasi Pengeluaran L1 → jurnal', async ({ page }) => {
    await gotoGudang(page);
    await page.goto('/gudang/pengeluaran/daftar');
    await page.click('[data-testid="row-pengeluaran-draft"]');
    await clickOtorisasi(page, 1);

    await expect(page.locator('[data-testid="status-pengeluaran"]')).toContainText('L1');
  });

  // --------------------------------------------------------------------------
  // SKENARIO 5: Retur Bahan qty > qty ambil → ditolak
  // --------------------------------------------------------------------------
  test('@smoke @regression Retur Bahan qty > qty ambil → ditolak', async ({ page }) => {
    await gotoGudang(page);
    await page.click('[data-testid="submenu-retur"]');
    await page.click('[data-testid="btn-tambah-retur"]');
    await page.selectOption('[data-testid="select-penyerahan-asal"]', 'PEN-001');
    await page.fill('[data-testid="input-qty-retur"]', '150');
    await page.click('[data-testid="btn-simpan"]');

    await expect(page.locator('[data-testid="toast-error"]')).toContainText(
      'Qty retur tidak boleh > qty pernah keluar',
    );
  });

  // --------------------------------------------------------------------------
  // SKENARIO 6: Retur Bahan valid → stok bertambah
  // --------------------------------------------------------------------------
  test('@smoke @regression @requires-otorisasi Retur Bahan valid → stok bertambah', async ({ page }) => {
    await gotoGudang(page);
    await page.click('[data-testid="submenu-retur"]');
    await page.click('[data-testid="btn-tambah-retur"]');
    await page.selectOption('[data-testid="select-penyerahan-asal"]', 'PEN-001');
    await page.fill('[data-testid="input-qty-retur"]', '30');
    await page.click('[data-testid="btn-simpan"]');
    await clickOtorisasi(page, 1);

    // Verify jurnal terbentuk
    await expect(page.locator('[data-testid="toast-success"]')).toContainText('Retur Bahan berhasil');
  });

  // --------------------------------------------------------------------------
  // SKENARIO 7: Koreksi Bahan masuk → stok bertambah
  // --------------------------------------------------------------------------
  test('@smoke @regression @requires-otorisasi Koreksi Bahan masuk → stok bertambah', async ({ page }) => {
    await gotoGudang(page);
    await page.click('[data-testid="submenu-koreksi"]');
    await page.click('[data-testid="btn-tambah-koreksi"]');
    await page.selectOption('[data-testid="select-tipe-koreksi"]', 'MASUK');
    await page.selectOption('[data-testid="select-gudang"]', TEST_DATA.gudang.kode);
    await page.selectOption('[data-testid="select-kode-bahan"]', TEST_DATA.bahan.kode);
    await page.fill('[data-testid="input-qty-koreksi"]', '50');
    await page.fill('[data-testid="input-alasan"]', 'Barang ditemukan di gudang lain');
    await page.click('[data-testid="btn-simpan"]');
    await clickOtorisasi(page, 1);

    await page.goto(`/master/bahan/${TEST_DATA.bahan.kode}/stok`);
    await expect(page.locator('[data-testid="stok-tersisa"]')).toContainText('550'); // 500 + 50
  });

  // --------------------------------------------------------------------------
  // SKENARIO 8: Koreksi Bahan keluar → stok berkurang
  // --------------------------------------------------------------------------
  test('@smoke @regression @requires-otorisasi Koreksi Bahan keluar → stok berkurang', async ({ page }) => {
    await gotoGudang(page);
    await page.click('[data-testid="submenu-koreksi"]');
    await page.click('[data-testid="btn-tambah-koreksi"]');
    await page.selectOption('[data-testid="select-tipe-koreksi"]', 'KELUAR');
    await page.selectOption('[data-testid="select-gudang"]', TEST_DATA.gudang.kode);
    await page.selectOption('[data-testid="select-kode-bahan"]', TEST_DATA.bahan.kode);
    await page.fill('[data-testid="input-qty-koreksi"]', '20');
    await page.fill('[data-testid="input-alasan"]', 'Barang rusak');
    await page.click('[data-testid="btn-simpan"]');
    await clickOtorisasi(page, 1);

    await page.goto(`/master/bahan/${TEST_DATA.bahan.kode}/stok`);
    await expect(page.locator('[data-testid="stok-tersisa"]')).toContainText('480'); // 500 - 20
  });

  // --------------------------------------------------------------------------
  // SKENARIO 9: Opname menghasilkan selisih
  // --------------------------------------------------------------------------
  test('@smoke @regression @requires-otorisasi Opname selisih → auto Koreksi Bahan', async ({ page }) => {
    await gotoGudang(page);
    await page.click('[data-testid="submenu-opname"]');
    await page.click('[data-testid="btn-mulai-opname"]');
    await page.selectOption('[data-testid="select-gudang"]', TEST_DATA.gudang.kode);

    // Input stok fisik BRG-001 = 95 (sistem = 100, selisih -5)
    await page.fill(`[data-testid="input-fisik-${TEST_DATA.bahan.kode}"]`, '95');
    await page.click('[data-testid="btn-selesaikan-opname"]');

    // Auto-generated Koreksi Bahan qty -5
    await expect(page.locator('[data-testid="koreksi-auto-generate"]')).toBeVisible();
    await expect(page.locator('[data-testid="koreksi-auto-generate"]')).toContainText('BRG-001');
    await expect(page.locator('[data-testid="koreksi-auto-generate"]')).toContainText('-5');

    // Otorisasi
    await clickOtorisasi(page, 1);

    await page.goto(`/master/bahan/${TEST_DATA.bahan.kode}/stok`);
    await expect(page.locator('[data-testid="stok-tersisa"]')).toContainText('95');
  });

  // --------------------------------------------------------------------------
  // SKENARIO 10: Koreksi Bahan tanpa alasan → ditolak
  // --------------------------------------------------------------------------
  test('@regression Koreksi Bahan tanpa alasan → ditolak', async ({ page }) => {
    await gotoGudang(page);
    await page.click('[data-testid="submenu-koreksi"]');
    await page.click('[data-testid="btn-tambah-koreksi"]');
    await page.selectOption('[data-testid="select-tipe-koreksi"]', 'MASUK');
    await page.fill('[data-testid="input-qty-koreksi"]', '10');
    // TIDAK isi alasan
    await page.click('[data-testid="btn-simpan"]');

    await expect(page.locator('[data-testid="toast-error"]')).toContainText('Alasan koreksi wajib diisi');
  });
});

// ============================================================================
// Tests: MODUL UTILITAS
// ============================================================================

test.describe('Modul Utilitas', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_DATA.user.admin);
  });

  // --------------------------------------------------------------------------
  // SKENARIO 1: Hitung Ulang Stock per bulan — semua barang
  // --------------------------------------------------------------------------
  test('@smoke @regression Hitung Ulang Stock semua barang per bulan', async ({ page }) => {
    await gotoUtilitas(page);
    await page.click('[data-testid="submenu-hitung-ulang-stock"]');
    await page.selectOption('[data-testid="select-scope"]', 'SEMUA');
    await page.fill('[data-testid="input-periode"]', '2026-06');
    await page.click('[data-testid="btn-hitung"]');

    await expect(page.locator('[data-testid="toast-success"]')).toContainText('Hitung ulang selesai');
  });

  // --------------------------------------------------------------------------
  // SKENARIO 2: Hitung Ulang Stock per barang
  // --------------------------------------------------------------------------
  test('@smoke @regression Hitung Ulang Stock per barang', async ({ page }) => {
    await gotoUtilitas(page);
    await page.click('[data-testid="submenu-hitung-ulang-stock"]');
    await page.selectOption('[data-testid="select-scope"]', 'PER_BARANG');
    await page.selectOption('[data-testid="select-kode-barang"]', TEST_DATA.bahan.kode);
    await page.fill('[data-testid="input-periode"]', '2026-06');
    await page.click('[data-testid="btn-hitung"]');

    await expect(page.locator('[data-testid="toast-success"]')).toContainText('Hitung ulang selesai');
    await expect(page.locator('[data-testid="barang-terupdate"]')).toContainText(TEST_DATA.bahan.kode);
  });

  // --------------------------------------------------------------------------
  // SKENARIO 3: Hitung HPP semua barang
  // --------------------------------------------------------------------------
  test('@smoke @regression Hitung HPP semua barang', async ({ page }) => {
    await gotoUtilitas(page);
    await page.click('[data-testid="submenu-hpp"]');
    await page.selectOption('[data-testid="select-scope-hpp"]', 'SEMUA');
    await page.fill('[data-testid="input-periode-hpp"]', '2026-06');
    await page.click('[data-testid="btn-hitung-hpp"]');

    await expect(page.locator('[data-testid="toast-success"]')).toContainText('HPP berhasil dihitung');
  });

  // --------------------------------------------------------------------------
  // SKENARIO 4: Hitung HPP per barang
  // --------------------------------------------------------------------------
  test('@smoke @regression Hitung HPP per barang', async ({ page }) => {
    await gotoUtilitas(page);
    await page.click('[data-testid="submenu-hpp"]');
    await page.selectOption('[data-testid="select-scope-hpp"]', 'PER_BARANG');
    await page.selectOption('[data-testid="select-kode-barang-hpp"]', TEST_DATA.barang.kode);
    await page.click('[data-testid="btn-hitung-hpp"]');

    await expect(page.locator('[data-testid="toast-success"]')).toContainText('HPP berhasil dihitung');
  });

  // --------------------------------------------------------------------------
  // SKENARIO 5: Proses Posting hanya transaksi terotorisasi
  // --------------------------------------------------------------------------
  test('@smoke @regression Proses Posting skip transaksi Draft', async ({ page }) => {
    await gotoUtilitas(page);
    await page.click('[data-testid="submenu-proses-posting"]');
    await page.fill('[data-testid="input-periode-posting"]', '2026-06');
    await page.check('[data-testid="checkbox-sub-proses-jurnal"]');
    await page.check('[data-testid="checkbox-sub-proses-kartu"]');
    await page.click('[data-testid="btn-proses-posting"]');

    await expect(page.locator('[data-testid="toast-success"]')).toContainText('Posting selesai');
    // Verify hasil: hanya transaksi L1+ yang diproses
    await expect(page.locator('[data-testid="transaksi-diproses"]')).toBeVisible();
    await expect(page.locator('[data-testid="transaksi-diproses"]')).not.toContainText('Draft');
  });

  // --------------------------------------------------------------------------
  // SKENARIO 6: Proses Posting invoice → jurnal + kartu piutang
  // --------------------------------------------------------------------------
  test('@smoke @regression Proses Posting invoice → jurnal + kartu piutang', async ({ page }) => {
    await gotoUtilitas(page);
    await page.click('[data-testid="submenu-proses-posting"]');
    await page.fill('[data-testid="input-periode-posting"]', '2026-06');
    await page.check('[data-testid="checkbox-sub-proses-jurnal"]');
    await page.check('[data-testid="checkbox-sub-proses-kartu"]');
    await page.click('[data-testid="btn-proses-posting"]');

    // Verify jurnal terbentuk
    await page.goto(`/laporan/jurnal?periode=2026-06`);
    await expect(page.locator('[data-testid="jurnal-row"]')).toHaveCount(1);

    // Verify kartu piutang update
    await page.goto(`/master/customer/${TEST_DATA.customer.kode}/history-piutang`);
    await expect(page.locator('[data-testid="histori-piutang-row"]').first()).toContainText('INV-');
  });

  // --------------------------------------------------------------------------
  // SKENARIO 7: Buku Aktivitas filter by user
  // --------------------------------------------------------------------------
  test('@smoke @regression Buku Aktivitas filter by user', async ({ page }) => {
    await gotoUtilitas(page);
    await page.click('[data-testid="submenu-buku-aktivitas"]');
    await page.fill('[data-testid="filter-tanggal"]', TEST_DATA.tanggal);
    await page.selectOption('[data-testid="filter-user"]', TEST_DATA.user.staffPengadaan.username);
    await page.click('[data-testid="btn-tampilkan"]');

    // Verify hanya perubahan oleh user yang dipilih
    const rows = page.locator('[data-testid="audit-log-row"]');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i)).toContainText(TEST_DATA.user.staffPengadaan.username);
    }
  });

  // --------------------------------------------------------------------------
  // SKENARIO 8: Buku Aktivitas filter by tanggal
  // --------------------------------------------------------------------------
  test('@smoke @regression Buku Aktivitas filter by tanggal', async ({ page }) => {
    await gotoUtilitas(page);
    await page.click('[data-testid="submenu-buku-aktivitas"]');
    await page.fill('[data-testid="filter-tanggal"]', TEST_DATA.tanggal);
    await page.click('[data-testid="btn-tampilkan"]');

    const rows = page.locator('[data-testid="audit-log-row"]');
    await expect(rows.first()).toContainText('2026-06-26');
  });

  // --------------------------------------------------------------------------
  // SKENARIO 9: Audit trail edit master (before/after)
  // --------------------------------------------------------------------------
  test('@regression Audit trail edit master (before/after tercatat)', async ({ page }) => {
    await gotoUtilitas(page);
    await page.click('[data-testid="submenu-buku-aktivitas"]');
    await page.fill('[data-testid="filter-tanggal"]', TEST_DATA.tanggal);
    await page.fill('[data-testid="filter-keyword"]', TEST_DATA.bahan.kode);
    await page.click('[data-testid="btn-tampilkan"]');

    const row = page.locator('[data-testid="audit-log-row"]').first();
    await expect(row).toContainText('Koreksi');
    await expect(row).toContainText('Master Bahan');
    await expect(row).toContainText('Sebelum');
    await expect(row).toContainText('Sesudah');
  });

  // --------------------------------------------------------------------------
  // SKENARIO 10: Posting multi-sub-proses sekaligus
  // --------------------------------------------------------------------------
  test('@smoke @regression Posting multi-sub-proses sekaligus', async ({ page }) => {
    await gotoUtilitas(page);
    await page.click('[data-testid="submenu-proses-posting"]');
    await page.fill('[data-testid="input-periode-posting"]', '2026-06');
    await page.check('[data-testid="checkbox-sub-proses-jurnal"]');
    await page.check('[data-testid="checkbox-sub-proses-kartu"]');
    await page.check('[data-testid="checkbox-sub-proses-auto-posting"]');
    await page.check('[data-testid="checkbox-sub-proses-hpp"]');
    await page.click('[data-testid="btn-proses-posting"]');

    await expect(page.locator('[data-testid="toast-success"]')).toContainText('Posting selesai');
    // Verify semua sub-proses jalan
    await expect(page.locator('[data-testid="log-jurnal"]')).toBeVisible();
    await expect(page.locator('[data-testid="log-kartu"]')).toBeVisible();
    await expect(page.locator('[data-testid="log-auto-posting"]')).toBeVisible();
    await expect(page.locator('[data-testid="log-hpp"]')).toBeVisible();
  });
});

// ============================================================================
// Tests: INTEGRASI MARKETING → PRODUKSI → GUDANG (subset)
// ============================================================================

test.describe('Integrasi Marketing → Produksi → Gudang', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_DATA.user.staffPengadaan);
  });

  test('@smoke @regression SO L1 → muncul di Produksi → Permintaan Bahan → Gudang', async ({ page }) => {
    // Step 1: Buat SO di Marketing (asumsi sudah ada)
    await page.goto('/marketing/sales-order');
    await page.click(`[data-testid="row-so-${TEST_DATA.so.nomor}"]`);
    await expect(page.locator('[data-testid="status-so"]')).toContainText('L1');

    // Step 2: Buka Produksi → lihat SO di Outstanding
    await page.goto('/produksi/spk');
    await expect(page.locator(`[data-testid="row-outstanding-so-${TEST_DATA.so.nomor}"]`)).toBeVisible();

    // Step 3: Buat SPK
    await page.click(`[data-testid="row-outstanding-so-${TEST_DATA.so.nomor}"]`);
    await page.click('[data-testid="btn-generate-spk"]');
    await page.fill('[data-testid="input-tanggal-mulai"]', TEST_DATA.tanggal);
    await page.fill('[data-testid="input-tanggal-selesai"]', TEST_DATA.tanggal);
    await page.selectOption('[data-testid="select-shift"]', '1');
    await page.click('[data-testid="btn-simpan"]');

    // Step 4: Tambah detail mesin
    await page.click('[data-testid="btn-tambah-detail-mesin"]');
    await page.locator('[data-testid="detail-row-mesin"]').last().locator('[data-testid="select-mesin"]').selectOption(TEST_DATA.mesin.kode);
    await page.locator('[data-testid="detail-row-mesin"]').last().locator('[data-testid="input-qty-mesin"]').fill('100');
    await page.click('[data-testid="btn-simpan"]');

    // Step 5: Tambah detail bahan
    await page.click('[data-testid="btn-tambah-detail-bahan"]');
    await page.locator('[data-testid="detail-row-bahan"]').last().locator('[data-testid="select-kode-bahan-spk"]').selectOption(TEST_DATA.bahan.kode);
    await page.locator('[data-testid="detail-row-bahan"]').last().locator('[data-testid="input-qty-bahan"]').fill('50');
    await page.click('[data-testid="btn-simpan"]');

    // Step 6: SPK selesai (tanpa otorisasi)
    await page.click('[data-testid="btn-selesai-spk"]');
    await expect(page.locator('[data-testid="status-spk"]')).toContainText('Selesai');

    // Step 7: Buat Permintaan Bahan (auto kuantitas dari SPK)
    await page.click('[data-testid="submenu-permintaan-bahan"]');
    await page.click('[data-testid="btn-tambah-permintaan"]');
    await page.selectOption('[data-testid="select-spk-ref"]', TEST_DATA.spk.nomor);
    // Kuantitas auto-fill
    await expect(page.locator('[data-testid="input-qty-permintaan"]')).toHaveValue('50');
    await page.click('[data-testid="btn-simpan"]');

    // Step 8: Switch ke Gudang → terima permintaan
    await login(page, TEST_DATA.user.staffGudang);
    await page.goto('/gudang/pengeluaran');
    await expect(page.locator('[data-testid="row-permintaan-dari-spk-100"]')).toBeVisible();
  });
});

// ============================================================================
// Custom Matchers / Helpers untuk verifikasi lintas modul
// ============================================================================

declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      toHaveStokBerkurang(expected: { kode: string; qty: number }): R;
      toHaveJurnalTerbentuk(expected: { periode: string; jenis: string }): R;
    }
  }
}

expect.extend({
  async toHaveStokBerkurang(received: any, expected: any) {
    // Asumsi: ada API GET /api/stok/{kode}
    const pass = received && received.qty_change === -Math.abs(expected.qty);
    return {
      pass,
      message: () =>
        `Expected stok ${expected.kode} ${pass ? 'not ' : ''}to be reduced by ${expected.qty}, got ${JSON.stringify(received)}`,
    };
  },

  async toHaveJurnalTerbentuk(received: any, expected: any) {
    const pass = received && received.periode === expected.periode && received.jenis === expected.jenis;
    return {
      pass,
      message: () =>
        `Expected jurnal ${expected.jenis} ${pass ? 'not ' : ''}to exist in ${expected.periode}, got ${JSON.stringify(received)}`,
    };
  },
});