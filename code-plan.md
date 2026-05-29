# 🛠️ Code Implementation Plan - Golang + NextJS BFF

## 📑 Table of Contents
1. [Go Backend Architecture](#go-backend-architecture)
2. [NextJS Frontend Architecture](#nextjs-frontend-architecture)
3. [API Contract](#api-contract)
4. [Implementation Checklist](#implementation-checklist)
5. [Key Files & Patterns](#key-files--patterns)

---

## Go Backend Architecture

### Directory Structure
```
backend/
├── cmd/
│   └── main.go                    # Entry point
├── internal/
│   ├── config/
│   │   ├── config.go              # Configuration loading
│   │   └── database.go            # DB connection
│   ├── handlers/
│   │   ├── auth/
│   │   │   ├── login.go
│   │   │   ├── logout.go
│   │   │   ├── refresh.go
│   │   │   └── current.go
│   │   ├── dashboard/
│   │   │   └── stats.go
│   │   ├── users/
│   │   │   ├── list.go
│   │   │   ├── create.go
│   │   │   ├── update.go
│   │   │   └── delete.go
│   │   └── berkas/
│   │       └── ...
│   ├── models/
│   │   ├── user.go
│   │   ├── berkas.go
│   │   └── activity_log.go
│   ├── services/
│   │   ├── auth_service.go        # Business logic
│   │   ├── user_service.go
│   │   └── dashboard_service.go
│   ├── repositories/
│   │   ├── user_repo.go           # Data access layer
│   │   ├── berkas_repo.go
│   │   └── activity_repo.go
│   ├── middleware/
│   │   ├── cors.go
│   │   ├── logger.go
│   │   ├── auth.go                # JWT verification
│   │   └── error_handler.go
│   └── utils/
│       ├── jwt.go                 # Token generation
│       ├── crypto.go              # Password hashing
│       ├── response.go            # Response builder
│       └── errors.go              # Error types
└── go.mod
```

### Key Patterns

#### 1. Response Format (utils/response.go)
```go
type Response struct {
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
    Message string      `json:"message,omitempty"`
    Error   string      `json:"error,omitempty"`
}

type ErrorResponse struct {
    Code    string `json:"code"`
    Message string `json:"message"`
}

func Success(data interface{}, message string) Response
func Error(code string, message string) Response
func BadRequest(message string) Response
func Unauthorized(message string) Response
func NotFound(message string) Response
func InternalError(message string) Response
```

#### 2. User Model (models/user.go)
```go
type User struct {
    ID        string    `json:"id" gorm:"primaryKey"`
    Email     string    `json:"email" gorm:"uniqueIndex"`
    Name      string    `json:"name"`
    Password  string    `json:"-"` // Never return password
    IsActive  bool      `json:"is_active"`
    Role      string    `json:"role"` // admin, user
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}
```

#### 3. JWT Strategy (utils/jwt.go)
```go
type Claims struct {
    UserID string `json:"user_id"`
    Email  string `json:"email"`
    Role   string `json:"role"`
    jwt.RegisteredClaims
}

// Tokens
type TokenResponse struct {
    AccessToken  string `json:"access_token"`
    RefreshToken string `json:"refresh_token"`
    ExpiresIn    int64  `json:"expires_in"`
}

const (
    AccessTokenExpire  = 15 * time.Minute
    RefreshTokenExpire = 7 * 24 * time.Hour
)
```

#### 4. Repository Pattern (repositories/user_repo.go)
```go
type UserRepository interface {
    Create(ctx context.Context, user *User) error
    GetByID(ctx context.Context, id string) (*User, error)
    GetByEmail(ctx context.Context, email string) (*User, error)
    GetAll(ctx context.Context) ([]*User, error)
    Update(ctx context.Context, user *User) error
    Delete(ctx context.Context, id string) error
}

type userRepository struct {
    db *gorm.DB
}
```

#### 5. Middleware Pattern (middleware/auth.go)
```go
func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.GetHeader("Authorization")
        // Verify token
        claims, err := jwt.ValidateToken(token)
        if err != nil {
            c.JSON(401, ErrorResponse{...})
            c.Abort()
            return
        }
        c.Set("user_id", claims.UserID)
        c.Set("user_email", claims.Email)
        c.Next()
    }
}
```

---

## NextJS Frontend Architecture

### Directory Structure
```
frontend/src/
├── app/                           # Next.js app router
│   ├── layout.tsx                 # Root layout with providers
│   ├── page.tsx                   # Home/redirect to dashboard
│   ├── globals.css                # Global styles + theme vars
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── reset-password/page.tsx
│   └── (admin)/
│       ├── layout.tsx             # Admin layout
│       ├── dashboard/page.tsx
│       ├── master/
│       │   ├── users/page.tsx
│       │   ├── berkas/page.tsx
│       │   └── activity/page.tsx
│       ├── kepesertaan/
│       │   ├── page.tsx
│       │   └── [id]/page.tsx
│       └── karyawan/
│           ├── page.tsx
│           └── [id]/page.tsx
├── features/                      # Feature-based components
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── PasswordInput.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   └── schemas/
│   │       └── auth.schema.ts
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── StatCard.tsx
│   │   │   ├── Charts.tsx
│   │   │   └── RecentActivity.tsx
│   │   └── hooks/
│   │       └── useDashboard.ts
│   └── master/
│       ├── users/
│       │   ├── components/
│       │   ├── hooks/
│       │   └── schemas/
│       └── berkas/
│           └── ...
├── components/
│   ├── ui/                        # From template/src/components/ui/
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   ├── toast/toaster.tsx
│   │   └── ...
│   └── layouts/
│       ├── AdminLayout.tsx
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
├── lib/
│   ├── theme.ts                   # Theme config
│   ├── api.ts                     # BFF client
│   └── utils.ts
├── hooks/
│   ├── useTheme.ts
│   └── useToast.ts
├── store/
│   ├── authStore.ts               # Zustand auth store
│   ├── appStore.ts                # Global app state
│   └── index.ts
├── types/
│   ├── api.ts
│   ├── user.ts
│   ├── dashboard.ts
│   └── index.ts
└── providers/
    ├── ThemeProvider.tsx
    ├── ToastProvider.tsx
    └── index.tsx
```

### Key Patterns

#### 1. Theme Configuration (lib/theme.ts)
```typescript
export type ThemeConfig = {
  name: string;
  colors: {
    border: string;
    input: string;
    ring: string;
    background: string;
    foreground: string;
    primary: { light: string; dark: string };
    secondary: { light: string; dark: string };
    accent: { light: string; dark: string };
    destructive: { light: string; dark: string };
    muted: { light: string; dark: string };
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
  };
};

export const LIGHT_THEME: ThemeConfig = { /* ... */ };
export const DARK_THEME: ThemeConfig = { /* ... */ };

export function getThemeConfig(themeName?: string): ThemeConfig {
  const name = themeName || process.env.NEXT_PUBLIC_THEME || 'light';
  return THEME_MAP[name.toLowerCase()] || LIGHT_THEME;
}
```

#### 2. API Client (lib/api.ts)
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

interface FetchOptions extends RequestInit {
  params?: Record<string, any>;
}

async function fetchAPI(endpoint: string, options: FetchOptions = {}) {
  const url = new URL(`${API_BASE}${endpoint}`);
  
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new APIError(response.status, await response.json());
  }

  return response.json();
}

export const apiClient = {
  auth: {
    login: (email: string, password: string) =>
      fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    logout: () =>
      fetchAPI('/auth/logout', { method: 'POST' }),
  },
  dashboard: {
    getStats: () =>
      fetchAPI('/dashboard/stats'),
  },
};
```

#### 3. Zustand Auth Store (store/authStore.ts)
```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: localStorage.getItem('access_token'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.auth.login(email, password);
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      set({ user: data.user, accessToken: data.access_token });
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await apiClient.auth.logout();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, accessToken: null });
  },

  setUser: (user) => set({ user }),
  clearError: () => set({ error: null }),
}));
```

#### 4. Form Validation with Zod (features/auth/schemas/auth.schema.ts)
```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
```

#### 5. Custom Hook (features/auth/hooks/useAuth.ts)
```typescript
export function useAuth() {
  const { user, isLoading, login, logout, error, clearError } = useAuthStore();
  const router = useRouter();

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      toast.error('Login failed');
    }
  };

  return {
    user,
    isLoading,
    error,
    login: handleLogin,
    logout,
    clearError,
    isAuthenticated: !!user,
  };
}
```

#### 6. Global Styles (app/globals.css)
```css
@import 'tailwindcss';

:root {
  /* Light theme colors */
  --color-primary: 215 90% 56%;
  --color-secondary: 160 84% 39%;
  --color-accent: 280 85% 55%;
  --color-destructive: 0 84% 60%;
  --color-muted: 215 14% 88%;
  --color-background: 0 0% 100%;
  --color-foreground: 215 15% 15%;
  --color-border: 215 28% 88%;
  --color-input: 215 34% 97%;
  --color-ring: 215 90% 56%;

  /* Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
}

[data-theme='dark'] {
  --color-primary: 215 90% 56%;
  --color-secondary: 160 84% 39%;
  /* ... */
  --color-background: 215 28% 7%;
  --color-foreground: 0 0% 98%;
}

body {
  @apply bg-background text-foreground;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

---

## API Contract

### Auth Endpoints
```
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
Response:
{
  "success": true,
  "data": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_in": 900,
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "User Name",
      "role": "admin"
    }
  }
}

POST /api/auth/logout
Response:
{
  "success": true,
  "message": "Logged out successfully"
}

POST /api/auth/refresh
{
  "refresh_token": "refresh_token"
}
Response:
{
  "success": true,
  "data": {
    "access_token": "new_jwt_token",
    "expires_in": 900
  }
}

GET /api/auth/me (requires auth)
Response:
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "admin"
  }
}
```

### Dashboard Endpoints
```
GET /api/dashboard/stats (requires auth)
Response:
{
  "success": true,
  "data": {
    "total_users": 150,
    "total_karyawan": 500,
    "total_kepesertaan": 300,
    "activity_count": 1200
  }
}
```

### Error Response Format
```json
{
  "success": false,
  "error": "error_code",
  "message": "Error description"
}
```

---

## Implementation Checklist

### Phase 1: Setup
- [ ] Create folder structure
- [ ] Initialize Go module
- [ ] Initialize NextJS project
- [ ] Setup Tailwind & theme
- [ ] Copy UI components

### Phase 2: Go Backend
- [ ] Setup middleware
- [ ] Setup database connection
- [ ] Create response handlers
- [ ] Implement JWT auth
- [ ] Create user model & repo

### Phase 3: Frontend Design
- [ ] Integrate theme system
- [ ] Setup global styles
- [ ] Create layout components
- [ ] Setup Zustand stores

### Phase 4: Auth Feature
- [ ] Create auth handlers in Go
- [ ] Create login/register pages
- [ ] Create auth components
- [ ] Setup auth middleware
- [ ] Test full auth flow

### Phase 5+: Continue with other features...

---

## Key Files & Patterns

### Go Best Practices
1. **Interface-based design**: Use interfaces for repositories & services
2. **Error handling**: Custom error types with error codes
3. **Logging**: Structured logging for debugging
4. **Testing**: Unit tests for services & handlers
5. **Configuration**: Environment-based config

### NextJS Best Practices
1. **Type safety**: Full TypeScript usage
2. **Component composition**: Small, reusable components
3. **State management**: Zustand for global state
4. **Form validation**: Zod for runtime validation
5. **API abstraction**: Centralized API client
6. **Error handling**: Consistent error boundaries

### Files to Create First
```
backend/
├── cmd/main.go
├── internal/config/config.go
├── internal/middleware/cors.go
├── internal/utils/response.go
└── go.mod

frontend/
├── src/app/layout.tsx
├── src/app/globals.css
├── src/lib/theme.ts
├── src/lib/api.ts
├── src/store/authStore.ts
└── tailwind.config.ts
```

---

**Ready to implement?** Start with Phase 1 todos! 🚀
