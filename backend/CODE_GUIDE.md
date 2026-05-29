# DAPEN Backend Architecture & Code Patterns

## Overview
This backend is built using **Go** and the **Gin** web framework. It follows **Clean Architecture** principles to ensure maintainability, scalability, and testability.

## Project Structure
```text
backend/
├── cmd/
│   └── main.go           # Application entry point
├── internal/
│   ├── config/           # Configuration management (.env)
│   ├── db/               # Database initialization, migrations, & seeds
│   ├── dto/              # Data Transfer Objects (Request/Response Structs)
│   ├── handlers/         # Delivery Layer (HTTP Handlers)
│   ├── middleware/       # HTTP Middlewares (Auth, Logging, CORS)
│   ├── models/           # Domain Layer (Entities/Structs)
│   ├── repositories/     # Data Layer (Interfaces & Implementations)
│   ├── routes/           # Routing Layer (Separated by scope)
│   ├── services/         # Business Logic Layer (Use Cases)
│   └── utils/            # Shared utilities
├── pkg/                  # Public shared libraries
└── go.mod                # Dependency management
```

## Naming Conventions (Strict & Mandatory)
- **Interface**: Wajib diawali huruf `I` kapital (contoh: `type IUserRepository interface`).
- **Struct/Type**: Wajib diawali huruf `S` kapital (contoh: `type SUser struct`, `type SAuthHandler struct`).
- **Props**: Jika ada struktur props/options, wajib diawali `P` kapital.
- **Catatan GORM**: Saat mengubah nama *struct* model dari `Model` menjadi `SModel`, WAJIB mendefinisikan metode `TableName() string` agar nama tabel di database tidak rusak.

## Layers & Patterns

### 1. Domain Layer (`internal/models`)
- Contains core entities and business models.
- These should be "plain" Go structs without external dependencies.
- **CRITICAL RULE**: Database Model Structs (e.g., `DbMenu`, `User`) MUST NOT be defined inside Handler or Service files. They must exclusively reside in the `models/` directory to ensure global reusability and strictly uphold Separation of Concerns.

### 2. DTO Layer (`internal/dto`)
- Responsibility: Defines structures for Data Transfer Objects.
- **CRITICAL RULE**: Structs used for JSON HTTP Requests (Payloads) and Responses MUST NOT be defined inside Handler files. They must be centralized in the `dto/` directory.

### 3. Repository Layer (`internal/repositories`)
- Responsibility: Data persistence and retrieval.
- Pattern: **Repository Pattern**.
- Always define an interface in the same package to allow mocking.
- Example: `UserRepository` interface with a `PostgresUserRepository` implementation.

### 3. Service Layer (`internal/services`)
- Responsibility: Business logic orchestration.
- Depends on: Repository interfaces.
- Pattern: **Service Pattern / Use Cases**.
- This is where the core logic lives (e.g., password hashing, complex calculations).

### 4. Delivery Layer (`internal/handlers`)
- Responsibility: Handling HTTP requests/responses.
- Depends on: Service interfaces.
- Pattern: **REST Handlers**.
- Uses Gin for routing and context management.

## Dependency Injection
We use **Constructor-based Dependency Injection**.
- Handlers are injected with Services.
- Services are injected with Repositories.
- This happens in `main.go` or a dedicated `wire` setup.

## Error Handling
- Use custom error types or standardized error wrappers.
- Handlers are responsible for mapping domain errors to HTTP status codes.

## Middleware & Security
- **JWT Auth**: Use `middleware.AuthMiddleware` to protect routes.
- **RBAC**: Use `middleware.RoleMiddleware("admin")` for role-based access control.
- **Hashing**: Use `bcrypt` for secure password storage.
- **Security Middlewares**:
  - **Trusted Proxies**: Gunakan `engine.SetTrustedProxies(nil)` untuk mematikan warning dan meningkatkan keamanan header IP.
  - **Rate Limiting**: Gunakan **Dual-Layer Rate Limiting** (Global & Per-IP) dengan algoritma **Token Bucket** (`golang.org/x/time/rate`).
  - **Request Timeout**: Gunakan `middleware.TimeoutMiddleware` (default: 60 detik) untuk mengontrol durasi eksekusi goroutine secara aman.

## API Communication
### Standardized JSON Responses
Every API response must follow the enterprise-standard envelope:
```json
{
  "success": boolean,
  "status": number,
  "message": "Human-readable description",
  "data": { ... } // Optional payload
}
```

Use `internal/utils/response.go` helpers:
- `utils.Success(c, message, data)`: For 200 OK responses.
- `utils.Error(c, status, message)`: For error responses.
- Specialized: `utils.BadRequest`, `utils.Unauthorized`, `utils.Forbidden`, `utils.InternalError`.

### Validation
- Always use Gin's `ShouldBindJSON` and validate struct tags.
- Return `utils.BadRequest` on validation failures.

## Automation Testing
- **Mandatory Tests (Wajib)**:
  - **Service Layer (`internal/services`)**: Semua logika bisnis, algoritma kalkulasi, dan aturan validasi *wajib* diuji secara menyeluruh (*Unit Test*). Gunakan *mocking* untuk Repositori.
  - **Handler Layer (`internal/handlers`)**: Penguraian HTTP request, *bind JSON*, *error mapping*, dan format respons JSON *wajib* diuji menggunakan `httptest`.
  - **Custom Middleware**: Logika *Auth*, *RBAC*, atau pembatas akses khusus wajib memiliki *test suite*.
- **Optional Tests (Tidak Wajib / Disarankan via Integration Test)**:
  - **Repository Layer (`internal/repositories`)**: Kueri standar GORM (seperti `Find`, `Create`) tidak wajib di *Unit Test* karena *mocking* GORM rumit dan rapuh. Uji kueri kompleks menggunakan *Integration Test* dengan DB sesungguhnya (contoh: *Testcontainers*).
  - **DTO & Model Layer**: Struct polos tanpa *methods* tidak perlu diuji.
  - **Routes & Config**: Registrasi *router* dan *parsing* file `.env` tidak wajib diuji.
- **Tools**: Gunakan bawaan Go `testing` dipadukan dengan pustaka `github.com/stretchr/testify/assert` untuk *assertions* dan `github.com/stretchr/testify/mock` untuk *mocking interface*.
- **Coverage**: *Test* harus mencakup *happy path* (sukses) dan simulasi *error* dari lapisan di bawahnya.

## Database Operations
### Migrations & Seeding (Enterprise Pattern)
To ensure database stability in production and ease of development, we use a CLI-based approach for database setup. Migrations and seeds are **not** run automatically on every app startup.

#### Commands:
- **Run Migrations**: `go run cmd/main.go --migrate`
- **Seed Initial Data**: `go run cmd/main.go --seed`
- **Both**: `go run cmd/main.go --migrate --seed`

#### Rules:
1. **Idempotency**: All migrations and seeders must be idempotent (safe to run multiple times).
2. **Selective AutoMigrate**: Avoid using `AutoMigrate` on legacy tables (e.g., `DBFLPASS`). Only migrate new tables owned by this application.
3. **Legacy Mapping**: Saat memetakan tabel legacy, pastikan **model GORM meniru persis** struktur model yang ada di aplikasi Laravel sebelumnya (`trade-exchange`). 
   - Gunakan fungsi `TableName()` untuk menentukan nama tabel eksplisit dengan huruf kapital (contoh: `DBCUSTSUPP`).
   - Tentukan *primary key* dan nama kolom menggunakan tag GORM (contoh: `gorm:"primaryKey;column:KODECUSTSUPP"`).
   - Jangan gunakan timestamps otomatis (matikan dengan tidak menyertakan `CreatedAt`/`UpdatedAt` atau konfigurasikan GORM agar tidak otomatis update) jika kolom tersebut tidak ada di legacy database.
   - Definisikan relasi `HasOne`, `BelongsTo`, dsb. dengan mendefinisikan foreign key dan references yang sesuai.

## Best Practices
- **Fail Fast**: Validate inputs at the handler level.
- **Username Login**: Use username instead of email for authentication as per project requirements.
- **SQL Server Indexing**: Always specify a `size` tag for string columns used in indexes (e.g., `size:100`) to prevent MSSQL index errors.
