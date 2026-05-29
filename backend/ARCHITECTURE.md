# Panduan Arsitektur & Alur Kerja Golang Backend

Dokumen ini menjelaskan secara komprehensif bagaimana backend Golang pada proyek ini bekerja, teknologi yang digunakan, serta alur data dari *request* hingga *response*.

## 1. Framework & Teknologi Utama
- **Gin Web Framework**: Digunakan sebagai *router* dan penanganan HTTP. Sangat cepat dan efisien dalam melakukan *routing* serta pengelolaan *middleware*.
- **GORM**: Object-Relational Mapping (ORM) untuk menghubungkan kode Golang dengan database SQL Server.
- **Clean Architecture**: Pola desain struktur folder yang memisahkan antara entitas, akses data, logika bisnis, dan pengiriman HTTP.

---

## 2. Pola Arsitektur (Clean Architecture)
Backend ini menggunakan *Clean Architecture* dengan pendekatan *Layered* dan *Dependency Injection*:
1. **`models/` (Domain Layer)**: Berisi struktur data murni (struct) yang memetakan tabel database. **Aturan Mutlak: Struct model database (misal `DbMenu`) TIDAK BOLEH diletakkan menyatu di dalam file handler.** Hal ini memastikan *Separation of Concerns* agar model dapat dipanggil lintas *service*. Tidak ada logika bisnis di sini.
2. **`repositories/` (Data Layer)**: Satu-satunya layer yang berinteraksi dengan database via GORM. Bertugas melakukan operasi CRUD (Create, Read, Update, Delete).
3. **`services/` (Business Logic/Usecase Layer)**: Layer ini memegang aturan bisnis. Menerima data dari repository, melakukan validasi atau kalkulasi, dan mengembalikannya ke handler.
4. **`handlers/` (Delivery Layer / Controllers)**: Menangani *HTTP Request*, membaca parameter atau body JSON, memanggil Service, dan memformat *HTTP Response* standar ke *client*.
5. **`routes/`**: Tempat mendaftarkan semua endpoint URL ke handler masing-masing beserta *middleware*-nya.

Setiap layer saling berhubungan melalui antarmuka (*Interface*) dan disuntikkan (*Injected*) saat aplikasi pertama berjalan di `cmd/main.go`.

---

## 3. Alur Kerja: Dari Request Hingga Response (Lifecycle)

Mari kita bedah apa yang terjadi ketika Frontend (klien) menembak URL seperti `GET /api/customers`:

1. **Request Masuk (Gin Engine)**
   Permintaan masuk ke *Gin Engine* di port 8080.
2. **Melewati Global Middleware**
   - **Logger & Recovery**: Mencatat log request dan mencegah aplikasi *crash* jika terjadi *panic*.
   - **Rate Limiter**: Mengecek apakah IP klien mengirim terlalu banyak request dalam satu waktu (Token Bucket). Jika ya, tolak dengan 429 Too Many Requests.
   - **Timeout**: Memastikan request tidak menggantung lebih dari batas maksimal.
3. **Melewati Route Middleware (Auth)**
   Karena rute `/api/customers` berada di grup *protected*, request akan melewati `AuthMiddleware`. Middleware mengecek keberadaan JWT di *header* atau *cookie*. Jika valid, ID user dimasukkan ke dalam Context (`c.Set("user_id")`). Jika tidak, ditolak 401 Unauthorized.
4. **Route Matching & Handler**
   Gin menemukan rute `/customers` dan meneruskan Context (`c *gin.Context`) ke fungsi `FilterHandler.GetCustomers(c)`.
5. **Handler (Parsing & Validasi)**
   Handler membaca parameter *query* (misal `?search=xyz`). Kemudian, Handler memanggil Service: `h.service.GetCustomers(jenis, search, page, limit)`.
6. **Service (Logika Bisnis)**
   Service memvalidasi nilai *page* (jika < 1 jadikan 1) dan mengkalkulasi angka *offset*. Lalu Service memanggil Repository: `s.repo.GetCustomers(...)`.
7. **Repository & GORM (Database)**
   Repository menggunakan objek GORM (`r.db`) untuk membuat perintah SQL Server. GORM mengambil data dari tabel `DBCUSTSUPP` dan mengisinya ke dalam struktur array `[]models.DbCustSupp`.
8. **Kembali ke Atas (Bubbling Up)**
   Repository mengembalikan data ke Service, lalu Service mengembalikannya ke Handler.
9. **Response (Format Standar)**
   Handler membungkus data ke dalam format JSON *enterprise standard* menggunakan `utils.Success(c, "Success", data)`.
10. **Response Terkirim**
    Gin mengubah struct tersebut menjadi JSON dan mengirim HTTP 200 OK ke frontend klien. Selesai.

---

## 4. Cara Kerja Middleware
Di Golang/Gin, *Middleware* adalah fungsi pelindung yang mengeksekusi kode **sebelum** atau **sesudah** Handler dipanggil.
- **`c.Next()`**: Perintah di dalam middleware untuk melanjutkan proses ke fungsi berikutnya (ke Handler).
- **`c.Abort()`**: Digunakan untuk menghentikan proses secara instan tanpa memanggil Handler (contoh: Token JWT tidak valid, langsung keluarkan 401).

---

## 5. Cara Kerja ORM (GORM)
GORM bertindak sebagai penerjemah dari tipe data Golang (`struct`) menjadi bahasa query SQL.
- **Mapping Tabel**: Melalui *struct tags* seperti `gorm:"column:NAMACUSTSUPP;primaryKey"`, GORM tahu secara presisi kolom mana yang harus dibaca.
- **Legacy Mapping**: GORM juga memiliki method `TableName()` untuk memaksakan nama tabel lama tanpa harus menggunakan nama *plural* bahasa Inggris (contoh: memaksakan `DBCUSTSUPP` alih-alih `db_cust_supps`).
- **Relasi**: Dengan tag *foreignKey* dan *references*, saat kita memanggil fungsi `Preload("KelompokKas")`, GORM secara otomatis akan membuat query `JOIN` atau menjalankan dua query berurutan secara transparan.

---

## 6. Schedulers & Background Jobs di Golang
Golang sangat unggul dalam memproses tugas di latar belakang (*background jobs*) karena arsitektur *Goroutine*. Ada beberapa pendekatan yang biasanya digunakan di enterprise:

1. **Simple Goroutine (Fire & Forget)**
   Jika ada tugas pengiriman email setelah pendaftaran, handler bisa langsung memanggil `go kirimEmail()`. Fungsi ini akan berjalan asinkron di *thread* lain tanpa menahan *response HTTP*.
2. **In-Memory Ticker (Cron Lokal)**
   Untuk rutinitas periodik kecil (misal: membersihkan cache setiap 1 jam), Golang menyediakan `time.Ticker` bawaan, atau kita bisa memakai pustaka `robfig/cron`. Ini sangat ringan karena berjalan satu memori dengan aplikasi web.
3. **Message Broker / Worker Queue (Skala Enterprise)**
   Untuk sistem besar (misalnya membuat ratusan laporan PDF massal), Golang menggunakan pustaka seperti **Asynq** atau **Machinery** yang di-backing oleh Redis/RabbitMQ.
   - **Flow**: Handler tidak membuat laporan secara langsung, melainkan melempar JSON *Job Task* ke dalam antrean Redis. Sebuah sistem Golang lain (Worker) akan mengonsumsi antrean tersebut secara berurutan secara terisolasi dari *traffic* web utama.

---

## 7. Migrasi & Seeder Database
Berbeda dengan Laravel yang memiliki `php artisan migrate`, ekosistem Golang lebih fleksibel. Di proyek ini:
- **Migrasi**: Diatur melalui *command-line flag* saat aplikasi dijalankan, misalnya `go run cmd/main.go --migrate`. Secara internal, ini akan memanggil `gorm.AutoMigrate(&models.User{})`. *AutoMigrate* GORM sangat aman karena tidak akan menghapus kolom atau data yang sudah ada, ia hanya menambah tabel atau kolom baru. Namun, **hindari AutoMigrate pada tabel legacy** yang tidak boleh dimodifikasi strukturnya oleh backend baru.
- **Seeder**: Dijalankan dengan `go run cmd/main.go --seed`. Biasanya digunakan untuk memasukkan data master statis (contoh: Role, Konfigurasi Sistem) saat aplikasi pertama kali di-_deploy_ di _environment_ baru.

---

## 8. Routing (Gin Framework)
Gin Framework memiliki sistem *routing* berbasis *Radix Tree* yang sangat kuat.
- **Prefix & Grouping Route**: Digunakan untuk mengelompokkan API agar rapi dan tidak menulis URL berulang-ulang.
  ```go
  api := r.Group("/api/v1") // Prefix global
  {
      users := api.Group("/users") // Menjadi /api/v1/users
      users.GET("/", GetUsers)
      users.POST("/", CreateUser)
  }
  ```
- **Menentukan Private Route (Protected)**: Untuk melindungi *endpoint*, kita menggunakan metode `.Use()` yang memasukkan middleware pengecekan otentikasi.
  ```go
  protected := api.Group("/admin")
  protected.Use(middleware.AuthMiddleware()) // Melindungi semua rute di bawah ini
  {
      protected.GET("/dashboard", AdminDashboard)
  }
  ```

---

## 9. Menangkap Parameter & Body Request
Di Handler, kita menangkap apa yang dikirim oleh Frontend menggunakan *Gin Context* (`c *gin.Context`).
- **Path Parameter** (`/users/:id`): Mengambil ID dari URL.
  `id := c.Param("id")`
- **Query Parameter** (`/users?search=agus&page=2`): Mengambil parameter URL opsional.
  `search := c.Query("search")`
  `page := c.DefaultQuery("page", "1")` // Beri nilai default jika kosong
- **Request Body (JSON)**: Golang menggunakan sistem *Binding* untuk memvalidasi dan memasukkan JSON langsung ke dalam bentuk *Struct*.
  ```go
  var req struct {
      Nama  string `json:"nama" binding:"required"`
      Email string `json:"email" binding:"required,email"`
  }
  if err := c.ShouldBindJSON(&req); err != nil {
      utils.BadRequest(c, err.Error())
      return
  }
  ```

---

## 10. File Upload & Kompresi
Golang sangat cepat untuk urusan I/O, menjadikannya pilihan sempurna untuk unggah file besar.
- **Menerima File Upload via Gin**:
  ```go
  // Baca file dari input name="document"
  file, err := c.FormFile("document")
  if err != nil { /* tangani error */ }

  // Simpan ke direktori lokal
  err = c.SaveUploadedFile(file, "storage/uploads/" + file.Filename)
  ```
- **Kompresi File (Zip)**: Golang memiliki pustaka bawaan `archive/zip` di *standard library*. Kita dapat membaca file yang diunggah dan secara dinamis (di memori) mengompresnya menjadi ZIP tanpa menulis ke disk sementara, yang menghemat I/O dan RAM.
- **Kompresi Gambar (Image Optimization)**: Jika pengguna mengunggah foto, kita bisa mengompres kualitasnya atau mengubah ukurannya sebelum menyimpannya ke disk menggunakan *standard library* `image/jpeg` untuk mengecilkan properti `jpeg.Options{Quality: 60}`, atau *library* pihak ketiga seperti `github.com/nfnt/resize` untuk mengubah resolusi (thumbnail). Hal ini di-_handle_ pada layer **Service**.
