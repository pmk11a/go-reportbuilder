saya ingin anda melakukan analisa mendalam
saya ingin membuat dinamik laporan generator yang bisa membuat laporan secara dinamik, daftar laporan ada di DBMENUREPORT

ketika membuat konfigurasi laporan ada setting untuk
1. mengisi nama laporan, kode menu dari dbmenureport, deskripsi laporan dan status aktif
2. ada setting untuk crud filter laporan, filter bisa memilih untuk menggunakan component yang ada atau filter input select basic (contoh gambar 1)
3. bisa menentukan storage prosedur apa saja yang akan digunakan (contoh gambar 2)
4. bisa set content laporan
 - bisa set header, posisi header (kiri, tngah, kanan), berapa kolom dalam header, bisa col span header dan adjust lebar header
 -  body berisi data, dalam satu body bisa di set berapa  table secara horizontal, namun misal sudah ditentukan ada 3 table yang diperlukan 1-2 menyamping  1 lagi dibawahnya bisa lebar penuh, tiap table bisa custom header column, ambil data dari mana, size column, col/row span. saya ingin tiap table ini insert seperti bisa tentukan berapa baris header dan input tag <th>, body juga bisa set berapa column input td bisa custom class atau style, bisa buat seperti plain text
-  lalu footer. footer dibuat untuk setting tanda tangan, dalam satu horizontal bisa ditentukan berapa kolom tanda tangan, tapi maksimal 3 kolom, jika set 4  tanda tangan dengan 2 kolom tiap horizontal maka satunya berada dibawah

pastikan semua set ini bisa support untuk export pdf dengan backen golang