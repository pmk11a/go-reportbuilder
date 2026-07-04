# Hari 10: Troubleshooting — FAQ Semua Modul

> *"Hari terakhir dari seri panduan ini. Bukan hari untuk belajar fitur baru, tapi hari untuk memperkuat pemahaman dengan menjawab pertanyaan-pertanyaan yang sering muncul. Saya kumpulkan di sini 50+ pertanyaan dan solusi dari 8 modul yang sudah kita pelajari."*

Gunakan bab ini sebagai **referensi cepat** saat Anda menemui masalah dalam pekerjaan sehari-hari. Pertanyaan disusun per modul.

---

## Checklist Hari 10

- [ ] Memahami pola troubleshooting umum
- [ ] Mengenali error yang sering muncul per modul
- [ ] Tahu kapan harus eskalasi ke admin
- [ ] Punya referensi cepat untuk masalah harian

---

## A. Setup & Master Data

**Pertanyaan:** Tidak bisa login. Aplikasi bilang "user tidak dikenal".  \
**Jawaban:** Hubungi administrator untuk verifikasi username dan password. Mungkin akun belum diaktifkan atau password sudah expired.

**Pertanyaan:** Login berhasil tapi semua menu disabled.  \
**Jawaban:** Hak akses user Anda belum di-setup. Minta admin untuk atur **Set Pemakaian** — centang Tampil/Tambah/Koreksi/Hapus/Otorisasi sesuai jabatan Anda.

**Pertanyaan:** Periode kerja tidak muncul atau salah bulan.  \
**Jawaban:** Buka **Menu Berkas > Setup Periode Kerja**, pilih bulan & tahun yang sesuai, lalu klik Simpan. Tanpa periode aktif, transaksi tidak bisa dijalankan.

**Pertanyaan:** Master COA kosong.  \
**Jawaban:** COA harus diinput manual atau import dari file Excel. Hubungi admin atau konsultan untuk setup awal COA. Tidak ada COA default di sistem.

**Pertanyaan:** Saldo awal tidak bisa diinput.  \
**Jawaban:** Pastikan periode sudah dibuka (di-unlock) dan akun COA sudah dipilih dengan benar. Saldo awal biasanya diinput per akun.

---

## B. Akunting — Transaksi Kas Bank & Memorial

**Pertanyaan:** Transaksi tidak bisa disimpan, tombol Simpan abu-abu.  \
**Jawaban:** Ada field wajib yang belum diisi. Cek field mandatory: Jenis transaksi, Mata uang, Tanggal, Lawan (akun pasangan), dan Nominal.

**Pertanyaan:** Kurs mata uang tidak muncul otomatis.  \
**Jawaban:** Pastikan mata uang sudah di-master, dan tanggal transaksi valid (tidak di masa lalu yang terlalu jauh). Kurs harian biasanya auto-update dari sistem.

**Pertanyaan:** Daftar sub-ledger supplier/customer tidak muncul saat pilih Lawan.  \
**Jawaban:** Pastikan akun COA yang Anda pilih terhubung dengan master supplier/customer. Cek di **Master Supplier > Sub-Detail Akun** — tambahkan akun utang dagang di situ.

**Pertanyaan:** Transaksi Memorial debit ≠ kredit dan Neraca jadi tidak balance.  \
**Jawaban:** Cari transaksi Memorial yang asimetris. Buka Buku Besar, sortir per tanggal, dan cek transaksi dengan nominal debit/credit yang tidak cocok. Koreksi dan simpan ulang.

**Pertanyaan:** Penambahan aktiva di Memorial tidak auto-create Master Aktiva.  \
**Jawaban:** Pastikan Anda klik tombol **Tambah** di sub-form aktiva dan simpan data aktiva baru dengan lengkap (nama, tanggal perolehan, persentase penyusutan). Hanya transaksi tersimpan penuh yang auto-create.

**Pertanyaan:** Status transaksi Pending Otorisasi — apa artinya?  \
**Jawaban:** Transaksi sudah disimpan tapi menunggu validasi dari user level yang lebih tinggi. Anda tidak bisa edit/delete selama status ini, harus tunggu otorisasi atau Batal Otorisasi oleh admin.

---

## C. Pengadaan (Procurement)

**Pertanyaan:** Tidak bisa buat PO — sistem minta PR dulu.  \
**Jawaban:** Benar. PO harus reference ke PR yang ada. Buat PR dulu, lalu buat PO dari PR tersebut. Ini dependency chain Pengadaan.

**Pertanyaan:** Tidak bisa hapus PO.  \
**Jawaban:** PO yang sudah punya LPB atau Penerimaan ASC reference tidak bisa dihapus. Ini proteksi integritas data. Batalkan LPB dulu jika perlu, atau hubungi admin.

**Pertanyaan:** Otorisasi L2 LPB sudah diklik, tapi jurnal tidak terbentuk.  \
**Jawaban:** Pastikan Anda login dengan user yang punya hak Otorisasi L2 (cek Set Pemakaian). Cek juga periode kerja — periode yang dikunci tidak bisa otorisasi.

**Pertanyaan:** Kuantitas LPB lebih besar dari PO, ditolak.  \
**Jawaban:** Sistem hanya izinkan LPB sampai kuantitas PO. Jika kelebihan barang datang, catat sebagai koreksi stok via **Koreksi Bahan** di Gudang (bukan lewat LPB).

**Pertanyaan:** Faktur Pajak kosong — LPB tidak muncul di daftar.  \
**Jawaban:** LPB yang sudah punya faktur tidak muncul lagi (sekali pakai). Pilih LPB yang memang belum punya faktur. Cek juga supplier yang Anda pilih.

**Pertanyaan:** Tidak bisa buat Faktur Pajak tanpa centang LPB.  \
**Jawaban:** Minimal satu LPB harus dicentang — sistem butuh referensi untuk generate faktur. Centang LPB yang sesuai dengan faktur pajak dari supplier.

**Pertanyaan:** Laporan Outstanding PR kosong padahal saya yakin ada PR outstanding.  \
**Jawaban:** Cek filter periode — laporan outstanding biasanya per bulan. Pastikan Anda pilih bulan yang sesuai dengan PR Anda.

---

## D. Marketing (Sales)

**Pertanyaan:** Dropdown Sales kosong di form SO.  \
**Jawaban:** Pastikan karyawan yang Anda pilih berstatus "Sales" di Master Karyawan. Karyawan non-sales tidak muncul di dropdown SO.

**Pertanyaan:** SO sudah diotorisasi tapi tidak muncul di Outstanding Produksi.  \
**Jawaban:** Refresh halaman Produksi. Cek juga filter periode — pastikan periode Produksi menampilkan SO yang baru saja Anda otorisasi.

**Pertanyaan:** Tidak bisa isi detail bahan di SPK.  \
**Jawaban:** Isi **Detail Mesin** dulu. Ini dependency chain — sistem tidak izinkan isi bahan sebelum mesin terisi dan disimpan.

**Pertanyaan:** Harga barang tidak auto-load saat pilih barang di SO.  \
**Jawaban:** Pastikan Master Item sudah punya harga jual. Jika belum, input harga manual di baris detail SO.

**Pertanyaan:** Retur qty > qty asal ditolak.  \
**Jawaban:** Sistem validasi: retur tidak boleh melebihi kuantitas yang pernah dikirim di Surat Jalan. Sesuaikan qty retur dengan qty kirim di SJ asal.

**Pertanyaan:** Credit Note tidak mengurangi piutang customer.  \
**Jawaban:** Pastikan Credit Note sudah diotorisasi **Level 2**. Hanya L2 yang trigger update ke kartu piutang customer.

**Pertanyaan:** Invoice tidak muncul di daftar Faktur Pajak.  \
**Jawaban:** Invoice yang sudah punya faktur pajak tidak muncul lagi. Pilih invoice yang memang belum punya faktur.

**Pertanyaan:** SO tidak bisa dihapus padahal belum dipakai.  \
**Jawaban:** Cek referensi — SO yang sudah punya Surat Jalan, Invoice, atau SPK reference tidak bisa dihapus. Ini proteksi data historis.

---

## E. Produksi

**Pertanyaan:** SPK tidak perlu otorisasi — apakah ini benar?  \
**Jawaban:** Benar. SPK langsung final setelah entry disimpan. Berbeda dengan transaksi keuangan (SO, Invoice, dll) yang butuh otorisasi bertingkat. Ini by design agar produksi tidak terhambat.

**Pertanyaan:** Hasil Produksi saya — stok barang jadi tidak bertambah.  \
**Jawaban:** Pastikan input di kolom **Hasil Baik**, bukan Hasil Rusak. Hanya barang baik yang menambah stok barang jadi.

**Pertanyaan:** Permintaan Bahan tidak muncul di Menu Gudang.  \
**Jawaban:** Pastikan Permintaan Bahan sudah tersimpan (bukan Draft). Cek juga apakah user gudang punya akses untuk melihat permintaan.

**Pertanyaan:** Tombol tambah bahan disabled di SPK.  \
**Jawaban:** Anda harus isi **detail mesin** dulu. Dependency chain SPK: mesin dulu, baru bahan.

**Pertanyaan:** Barang rusak di Hasil Produksi — ke mana catatannya?  \
**Jawaban:** Tercatat di Hasil Produksi sebagai "Hasil Rusak" tapi **tidak menambah stok barang jadi**. Untuk adjustment stok keluar (misal: dibuang), gunakan **Koreksi Bahan** di Menu Gudang.

**Pertanyaan:** SPK tidak muncul di Outstanding Produksi.  \
**Jawaban:** Pastikan SO-nya sudah diotorisasi **Level 1** di Marketing. Refresh halaman atau cek filter periode aktif.

**Pertanyaan:** Finishing sudah ditandai tapi Surat Jalan tidak bisa dibuat.  \
**Jawaban:** Cek apakah Finishing sudah **Final/Disimpan**, bukan hanya di-checklist visual. Buka Form Finishing, pastikan semua kolom selesai dan klik Simpan.

---

## F. Gudang

**Pertanyaan:** Bahan yang mau saya ambil tidak muncul di Pengeluaran Bahan.  \
**Jawaban:** Bahan harus sudah didefinisikan di **sub-detail SPK** dan SPK-nya ada di status Outstanding/Sedang Jalan. Bahan di luar rencana SPK tidak bisa diambil.

**Pertanyaan:** Pengeluaran Bahan sudah disimpan tapi stok belum berkurang.  \
**Jawaban:** Stok baru berkurang setelah **Otorisasi Level 1**. Sebelum L1, transaksi masih Draft.

**Pertanyaan:** Retur Bahan ditolak karena qty melebihi.  \
**Jawaban:** Kuantitas retur tidak boleh lebih dari yang pernah dikeluarkan. Cek qty ambil di penyerahan asal, lalu sesuaikan qty retur.

**Pertanyaan:** Opname sudah selesai tapi stok fisik tidak berubah.  \
**Jawaban:** Klik tombol **Generate Koreksi** di Opname, lalu otorisasi dokumen **Koreksi Bahan** yang terbentuk. Opname sendiri tidak langsung ubah stok.

**Pertanyaan:** Bisa Koreksi Bahan tanpa otorisasi?  \
**Jawaban:** Bisa input datanya, tapi stok baru berubah setelah Otorisasi L1. Sebelum L1, koreksi masih Draft.

**Pertanyaan:** Bisa hapus Pengeluaran Bahan yang sudah diotorisasi?  \
**Jawaban:** Tidak bisa langsung. Harus **Batal Otorisasi** dulu oleh admin senior, baru bisa dihapus. Ini untuk menjaga integritas audit trail.

---

## G. Utilitas

**Pertanyaan:** Proses Posting tidak menghasilkan apa-apa (kosong).  \
**Jawaban:** Cek apakah ada transaksi **sudah diotorisasi final** di periode yang dipilih. Jika tidak ada, proses tidak menghasilkan apa-apa. Bukan error.

**Pertanyaan:** Buku Besar tidak ter-update padahal transaksi sudah diotorisasi.  \
**Jawaban:** Transaksi yang diotorisasi belum otomatis masuk Buku Besar. Anda harus jalankan **Proses Posting** di Menu Utilitas.

**Pertanyaan:** HPP terhitung tapi angkanya tidak masuk akal.  \
**Jawaban:** Cek kelengkapan master sumber data: Master Bahan (harga), Master Mesin (tarif), Master Karyawan (upah), Master Proses (biaya proses). HPP akurat hanya jika sumber data lengkap.

**Pertanyaan:** Audit trail tidak menampilkan perubahan user tertentu.  \
**Jawaban:** Cek filter User dan periode. Audit trail hanya mencatat **perubahan data**, bukan viewing. User yang cuma lihat-lihat tidak akan muncul.

**Pertanyaan:** Posting transaksi bulan lalu gagal.  \
**Jawaban:** Periode bulan lalu mungkin sudah dikunci (lock period). Hubungi admin untuk unlock periode jika memang perlu re-posting.

**Pertanyaan:** Hitung Ulang Stock lambat.  \
**Jawaban:** Untuk scope semua barang, ini normal karena sistem baca semua transaksi periode. Untuk satu item spesifik, gunakan scope **Per Barang** agar lebih cepat.

---

## H. Reporting

**Pertanyaan:** Laporan kosong padahal transaksi sudah ada.  \
**Jawaban:** Cek filter periode — mungkin Anda input di Juni tapi laporan menampilkan Mei. Atau periode sudah dikunci/di-unlock.

**Pertanyaan:** Neraca tidak balance (tidak seimbang).  \
**Jawaban:** Cari transaksi Memorial yang debit ≠ kredit. Biasanya user keliru input nominal atau salah sisi debit/kredit. Koreksi dan simpan ulang.

**Pertanyaan:** Total sub-ledger ≠ total akun kontrol di Buku Besar.  \
**Jawaban:** Ada transaksi yang melibatkan customer/supplier tapi belum melalui flow sub-ledger. Cek transaksi Memorial atau Kas Bank terkait. Jalankan ulang **Proses Posting**.

**Pertanyaan:** Tombol Cetak tidak ada di laporan.  \
**Jawaban:** Hak akses Anda belum termasuk "Akses" di **Set Report**. Hubungi admin untuk aktifkan akses cetak laporan.

**Pertanyaan:** Laporan lambat saat dibuka.  \
**Jawaban:** Biasanya karena rentang tanggal terlalu panjang. Persempit periode (bulanan, bukan tahunan) atau tambahkan filter spesifik.

**Pertanyaan:** Bisa custom layout laporan?  \
**Jawaban:** Hanya user dengan akses "Desain" yang bisa ubah layout. Biasanya admin atau manajer. Hubungi admin untuk permintaan custom layout.

---

## I. Otorisasi & Akses

**Pertanyaan:** Tombol Otorisasi tidak aktif.  \
**Jawaban:** Login user Anda belum punya hak Otorisasi di Set Pemakaian. Atau level Anda tidak cukup untuk transaksi tersebut (misal: butuh L2 tapi Anda cuma L1).

**Pertanyaan:** Batal Otorisasi ditolak.  \
**Jawaban:** Biasanya hanya admin senior atau level setara yang bisa Batal Otorisasi. Minta atasan Anda untuk melakukannya.

**Pertanyaan:** User baru ditambahkan tapi tidak bisa akses menu.  \
**Jawangan:** Pastikan **Set Pemakaian** sudah di-setup untuk user baru — centang Tampil untuk menu yang boleh diakses. Tanpa centang Tampil, menu tidak muncul.

**Pertanyaan:** Lupa password — gimana reset?  \
**Jawaban:** Hubungi admin untuk reset password. Anda juga bisa reset sendiri via **Menu Berkas > Ganti Password** jika masih ingat password lama.

---

## J. Pola Troubleshooting Umum

Untuk sebagian besar masalah, coba pola ini:

1. **Cek pesan error/sistem** — biasanya jelas mengarahkan ke solusi
2. **Refresh halaman** — banyak masalah karena data belum sinkron
3. **Cek filter periode** — pastikan Anda melihat data yang benar
4. **Cek hak akses user** — banyak fitur yang hidden karena akses terbatas
5. **Cek status otorisasi** — banyak masalah karena transaksi belum final
6. **Cek dependency** — apakah prasyarat sudah dipenuhi (misal: PO butuh PR dulu)
7. **Konsultasi audit trail** — Buku Aktivitas Pemakai bisa menjelaskan perubahan data

> **Tips:** Sebelum hubungi admin, coba cek 7 hal di atas dulu. Seringkali solusi bisa ditemukan tanpa eskalasi.

---

## K. Kapan Harus Eskalasi ke Admin

Hubungi admin senior jika:

- Masalah melibatkan **batal otorisasi** transaksi yang sudah final
- Anda butuh **reset password** dan tidak bisa akses Menu Berkas
- Ada **perbedaan saldo** yang tidak bisa dijelaskan dari transaksi
- Anda menemukan **bug sistem** atau perilaku yang tidak sesuai ekspektasi
- Anda butuh **akses baru** yang tidak bisa di-set sendiri
- Ada kebutuhan **custom layout laporan** atau fitur baru

---

## Penutup Perjalanan 10 Hari

Anda telah menyelesaikan perjalanan dari **hari pertama (Setup) sampai hari kesepuluh (Troubleshooting)**. Recap singkat:

| Hari | Topik | Anda Mampu |
|------|-------|------------|
| 1 | Setup Awal | Membuka periode, setup user, perusahaan |
| 2 | Master Data | Input COA, supplier, customer, item, karyawan |
| 3 | Transaksi Harian | BKM/BKK, Memorial, pelunasan sub-ledger |
| 4 | Reporting | Buku besar, neraca, laba rugi, piutang/utang |
| 5 | Pengadaan | PR → PO → LPB → Faktur Pajak |
| 6 | Marketing | SO → SPK → Surat Jalan → Invoice → Retur |
| 7 | Produksi | SPK, mesin & TK, hasil produksi, finishing |
| 8 | Gudang | Pengeluaran, retur, koreksi, opname |
| 9 | Utilitas | Posting, HPP, hitung ulang stock, audit trail |
| 10 | Troubleshooting | Memecahkan masalah harian |

> **Selamat!** Anda sekarang punya bekal untuk jadi operator ERP Trade Exchange yang handal. Teruslah berlatih — setiap hari adalah kesempatan untuk belajar hal baru.

---

## Troubleshooting Q&A

**Pertanyaan:** Saya bingung harus mulai dari mana saat sistem error.  \
**Jawaban:** Mulai dari cek pesan error, refresh halaman, cek periode & hak akses. Jika masih bingung, gunakan bab ini sebagai referensi cari modul yang relevan.

**Pertanyaan:** Kapan saya boleh kontak support/vendor?  \
**Jawaban:** Setelah cek 7 pola troubleshooting umum di Bagian J dan belum solved. Siapkan screenshot error, langkah yang sudah dicoba, dan info user/periode yang terdampak.

**Pertanyaan:** Apakah ada cara backup data sebelum eksperimen?  \
**Jawaban:** Untuk transaksi yang belum diotorisasi, Anda bisa hapus langsung. Untuk yang sudah final, hubungi admin — mereka yang punya wewenang backup/restore.

**Pertanyaan:** Saya merasa panduan ini tidak cover skenario spesifik perusahaan saya.  \
**Jawaban:** Setiap perusahaan punya konfigurasi unik. Gunakan panduan ini sebagai fondasi, lalu adaptasi dengan setting spesifik Anda. Diskusi dengan admin untuk penyesuaian.