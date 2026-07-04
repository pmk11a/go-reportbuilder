# ERP User Manual Structure: Best Practices Research
## 3 Approaches Compared

---

## V1: Structural Reference (Odoo / SAP / Oracle ERP Cloud / Microsoft Dynamics 365)

### Recommended Template Format
- **Heading hierarchy:**
  - `# Produk Overview` — ringkasan modul, tujuan, dan skenario penggunaan
  - `## Pengenalan Modul` — fitur utama, prerequisit, akses navigasi
  - `### Sub-modul` — tiap fitur dalam 1 halaman terpisah
  - `#### Langkah-langkah` — langkah numbered, 1-per-paragraf
  - Bullet points untuk field/table description
  - `> **Tip:**` callout blocks untuk shortcuts/pro tips
- **File organization:**
  - `docs/` (root)
    - `_toc.yml` atau `SUMMARY.md` — table of contents terstruktur hierarkis
    - `01-overview.md`
    - `02-mulai.md` — setup awal, login, navigasi
    - `03-faktur-penjualan.md`
    - `04-pembelian.md`
    - `05-pembukuan.md`
    - `06-laporan.md`
    - `07-troubleshooting.md`
  - Satu halaman = satu topik fungsional end-to-end
  - Gambar/screenshot disimpan di `assets/screenshots/`
  - Navigasi: Sidebar kiri (tree navigasi) + Breadcrumb + Previous/Next link di bawah
- **Navigation pattern:**
  - Tree-based sidebar (collapsible categories)
  - Search bar dengan keyword indexing
  - Breadcrumbs: Home > Sales > Invoice > Buat Faktur Baru

### Public Document Examples
- **Microsoft Dynamics 365 Finance Docs** — `https://learn.microsoft.com/en-us/dynamics365/finance/`
  - Struktur: Get Started → Implement → Administer → Produk fungsional → Troubleshooting
  - Setiap artikel memiliki: Tujuan, Prerequisit, Langkah-langkah, Lihat juga, Umpan balik
  - Kategori: card-based landing page, deep hierarchical sections
- **SAP S/4HANA Cloud Help Portal** — `https://help.sap.com/docs/SAP_S4HANA_CLOUD`
  - Struktur: Product Landing Page → Modules → Features → Configuration Guides
  - Per halaman: "Apa itu", "Cara lakukan", "Konfigurasi", "Troubleshooting"
  - Side-by-side comparison table, role-based navigation (Accountant vs Manager vs Admin)
- **Oracle ERP Cloud Documentation** — `https://docs.oracle.com/en/cloud/sa-enter-clouddb/index.html`
  - Struktur: Task-based chapters, "What's New" section per release
  - Per artikel: Introduction → Setup → Task → Procedure → See Also → Related Tasks
  - Cross-linking antar modul sangat kuat

### Tips untuk End-User Non-Teknis
- Gunakan screenshot ANNOTATED dengan nomor langkah langsung di gambar
- Hindari jargon teknis — gunakan bahasa bisnis ("buat faktur" bukan "generate invoice document via module interface")
- Setiap langkah maksimal 3-5 sub-step, jangan lebih panjang dari itu
- Selalu sertakan "hasil yang diharapkan" setelah setiap prosedur (contoh: "Invoice ditandai sebagai Posted")
- Sertakan tabel mapping field/formulir dengan deskripsi sederhana (nama field → artinya apa)

### Common Pitfalls
- Terlalu banyak informasi dalam satu halaman → user kewalahan
- Struktur berdasarkan menu system, bukan berdasarkan alur kerja bisnis
- Tidak ada konteks "kenapa" sebelum "bagaimana" (user tidak paham alasan melakukan sesuatu)
- Dokumentasi konfigurasi campur dengan dokumentasi operasional
- Update jarang: screenshots tidak sinkron dengan versi terbaru sistem
- Tidak ada bagian troubleshooting → user bingung saat error muncul

---

## V2: Narrative Walkthrough (Microsoft Learn / Vue.js Guide)

### Recommended Template Format
- **Heading hierarchy:**
  - `# Mulai dengan ERP Anda` — naratif pembuka, tujuan belajar
  - `## Skenario: Proses Bulanan Pembukuan` — cerita end-to-end
  - `### Langkah 1: Buka Dashboard` — naratif + screenshot + penjelasan konteks
  - `### Langkah 2: Input Data Pertama` — "Apa yang kamu lihat", "Mengapa penting"
  - `### Langkah 3: Review & Submit` — "Bagaimana cara tahu berhasil?"
  - `## Latihan Mandiri` — challenge kecil untuk practice
  - `> **Catatan:**` contextual notes
  - `> **💡 Tip:**` pro tips dalam format conversational
- **File organization:**
  - `docs/` (root)
    - `00-pengantar.md` — Welcome, cara baca dokumen ini
    - `01-getting-started.md` — Quick Start style: dalam 5 menit sudah bisa jalankan transaksi pertama
    - `02-your-first-invoice.md` — Narrative walkthrough pertama
    - `03-monthly-accounting.md` — Narrative walkthrough kedua (lebih kompleks)
    - `04-common-workflows.md` — Collection of mini-tutorials
    - `05-troubleshooting.md` — "Apa yang salah?" section
  - Satu dokumen = satu cerita/transaksi end-to-end
  - Naratif dimulai dari sudut pandang user ("Anda ingin membuat faktur? Mari mulai...")
  - Navigasi: Table of Contents vertikal (sticky) + progress indicator + Next: What's Next
- **Navigation pattern:**
  - Progress bar atau step indicator (Step 2 of 5)
  - "What's next?" link di akhir setiap section
  - Interactive TOC di sidebar kanan (highlight active section)
  - Quick jump links: "Langsung ke [Bagian]"

### Public Document Examples
- **Vue.js Guide** — `https://vuejs.org/guide/introduction.html`
  - Struktur: Intro → What is Vue? → Quick Start → Core Concepts → Essentials → Deep Dive
  - Gaya: conversational ("You may already have questions — don't worry")
  - Setiap section punya: penjelasan konseptual → contoh → "di mana ini masuk?"
  - Strong use of "Learn more" inline links, tidak overwhelming
- **Microsoft Learn Product Documentation** — `https://learn.microsoft.com/en-us/dynamics365/finance/`
  - Struktur: Welcome → Get Started → Product Overview → Key Capabilities → Try/Buy → Training
  - Gaya: Task-oriented narrative ("In this topic, you will learn how to...")
  - Setiap artikel memiliki: Purpose statement → Prerequisites → What happens → Steps → Expected result
  - Strong contextual navigation: related articles, training modules, video links

### Tips untuk End-User Non-Teknis
- Mulai dengan "cerita" — "Bayangkan Anda adalah akuntan yang harus membuat faktur di awal bulan..."
- Gunakan bahasa pertama/orang kedua: "Anda melihat...", "Klik tombol..."
- Sertakan screenshot di SETIAP langkah, bukan hanya di awal
- Berikan "Apa yang terjadi?" explanation — bukan hanya "klik di sini", tapi "klik di sini karena..."
- Akhiri setiap walkthrough dengan "Apa selanjutnya?" dan "Bagaimana cara tahu berhasil?"
- Sertakan "Common Mistakes" box: "Jika tidak bisa menemukan tombol X, pastikan Anda sudah login sebagai role Y"

### Common Pitfalls
- Terlalu fokus pada "cara klik" tanpa menjelaskan konteks bisnis
- Cerita terlalu panjang sehingga user hilang arah
- Tidak memberikan "escape hatch" — user yang sudah tahu dasar harus bisa skip
- Screenshot terlalu padat (tidak ada highlight/callout)
- Asumsi level pengetahuan user tidak konsisten (kadang teknis, kadang dasar)

---

## V3: Test-Driven Matrix (Cucumber Gherkin / Playwright Specs)

### Recommended Template Format
- **Heading hierarchy:**
  - `# Panduan Prosedur ERP`
  - `## Fitur: Buat Faktur Penjualan`
    - `> Deskripsi singkat bisnis: "Sebagai operator sales, saya bisa membuat faktur untuk..."`
  - `### Skenario 1: Membuat faktur baru untuk customer terdaftar`
    - `Diberi: Saya sudah login dan berada di halaman Daftar Customer`
    - `Saat: Saya klik "Buat Faktur Baru"`
    - `Dan: Saya mengisi Nama Customer, Tanggal Invoice, dan Item Produk`
    - `Maka: Sistem menampilkan pratinjau faktur dengan total otomatis`
    - `Dan: Tombol "Post Invoice" aktif dan berwarna hijau`
  - `### Skenario 2: Error handling — Customer tidak ditemukan`
    - `Diberi: Saya berada di halaman Buat Faktur`
    - `Saat: Saya mencari customer dengan nama "XYZ NonExistent"`
    - `Maka: Sistem menampilkan pesan error: "Customer tidak ditemukan"`
    - `Dan: Formulir tidak bisa disubmit`
  - `### Tabel Contoh (Scenario Outline)`
    - | Role | Input Valid | Expected Result |
    - |---|---|---|
    - | Operator | Semua field terisi | Invoice Posted sukses |
    - | Supervisor | Hanya sebagian field | Warning: lengkapi semua field |
- **File organization:**
  - `docs/` (root)
    - `features/` (folder)
      - `01-faktur-penjualan.feature`
      - `02-pembelian.feature`
      - `03-pembukuan.feature`
      - `04-laporan.feature`
      - `05-user-management.feature`
    - `README.md` — penjelasan cara baca dokumen
    - `GLOSARIUM.md` — istilah teknis → bahasa bisnis
  - Setiap file `.feature` = 1 modul/fungsi besar
  - Di dalam file: Feature header → Scenario Outline → individual Scenarios → Tables
  - Navigasi: Sidebar fitur index (click-to-jump), search per keyword GIVEN/WHEN/THEN

### Public Document Examples
- **Cucumber Gherkin Reference** — `https://cucumber.io/docs/gherkin/reference/`
  - Struktur: Feature → Background → Scenario/Scenario Outline → Given/When/Then/And/But
  - Keyword-driven format: kondisi awal → aksi → hasil yang diharapkan
  - Contoh: `Feature: Guess the word` → `Scenario: Maker starts a game` → `Given`, `And`
  - Doc Strings untuk detail tambahan: multi-line text blocks
  - Tables untuk parameterisasi: kolom input → kolom expected output
- **Playwright Best Practices** — `https://playwright.dev/docs/best-practices`
  - Struktur: Testing Philosophy → Resilient Locators → Assertions → Isolation → Auto-waiting
  - Setiap panduan: "Goal → Why it matters → How to do it → Example"
  - Strong emphasis on "what success looks like" — visual/behavioral criteria
  - File-based organization: `src/tests/` → `specs/` → `tests/unit/` hierarchy

### Tips untuk End-User Non-Teknis
- Terjemahkan Gherkin keywords ke bahasa Indonesia sehari-hari:
  - `Given` = "Kondisi Awal" / "Sebelum Mulai"
  - `When` = "Yang Dilakukan" / "Langkah"
  - `Then` = "Hasil yang Diharapkan" / "Pastikan"
- Tambahkan kolom "Kenapa" — bukan hanya "apa yang terjadi", tapi "mengapa ini penting secara bisnis"
- Sertakan "Screenshot Bukti" per skenario — tangkapan layar hasil akhir yang diharapkan
- Gunakan tabel parameterisasi untuk variasi scenario (role-based: operator vs supervisor vs admin)
- Jangan gunakan syntax Gherkin mentah — gunakan format semi-natural language yang mirip tapi readable

### Common Pitfalls
- Format terlalu teknis — operator akuntansi tidak akan mengerti "Given/When/Then"
- Terlalu banyak detail implementasi (tombol mana, class CSS, XPath)
- Scenarios tidak mencakup edge cases penting (invalid input, permission denied, network failure)
- Tidak ada koneksi dengan proses bisnis nyata — hanya checklist teknis
- Maintenance overhead tinggi: setiap perubahan UI butuh update skenario
- Tidak bisa dipakai offline/printing dengan baik (format Gherkin tidak ramah cetak)

---

## Perbandingan Singkat

| Aspek | V1 Structural | V2 Narrative | V3 Test-Driven |
|---|---|---|---|
| Cocok untuk | Reference/lookup cepat | Pemula pertama kali | QA/verification |
| Tingkat detail | High (semua fitur) | Medium (utama saja) | Very High (per interaksi) |
| Maintenance | Mudah | Sedang | Sulit (sering berubah) |
| Bahasa non-teknis | ★★★★ | ★★★★★ | ★★☆☆☆ |
| Printable/PDF | ★★★★★ | ★★★★ | ★★☆☆☆ |
| Training onboard | ★★★ | ★★★★★ | ★★★ |
| Audit trail | ★★★ | ★★ | ★★★★★ |

## Rekomendasi untuk Proyek Ini

Karena target audiens adalah operator dan staf akuntansi Indonesia (non-teknis), kombinasi optimal:

1. **V2 sebagai basis utama** — naratif walkthrough untuk setiap prosedur bisnis utama (pembuatan faktur, pembukuan bulanan, dll)
2. **V1 sebagai referensi** — daftar semua modul + quick lookup di bagian akhir
3. **V3 sebagai appendum opsional** — bisa dipakai tim internal untuk verifikasi bahwa prosedur benar, tapi jangan ditampilkan ke end-user

Struktur file disarankan:
```
docs/
├── README.md                    # Cara baca, pengantar
├── 01-pengantar-erp.md          # V2: Welcome & orientation
├── 02-getting-started.md        # V2: Quick Start (5 menit)
├── 03-faktur-penjualan.md       # V2: Narrative walkthrough
├── 04-pembelian.md              # V2: Narrative walkthrough
├── 05-pembukuan.md              # V2: Narrative walkthrough
├── 06-laporan.md                # V2: Narrative walkthrough
├── 07-troubleshooting.md        # V1: Reference-style
└── 08-glossarium.md             # Istilah teknis → bahasa bisnis
```
