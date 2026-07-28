# Auth Module (`apps/api/src/auth`)

The **Auth Module** manages user authentication, session management, rotating refresh token cookies, and user session retrieval in the Trends Bird API.

## Responsibilities

- **User Authentication**: Validating credentials (email/password) using `bcrypt`.
- **Access Tokens**: Issuing short-lived JWT access tokens (default TTL: `15m`).
- **Refresh Token Rotation**: Issuing opaque, HTTP-only, `SameSite=Strict` refresh cookies (`trends_bird_refresh`) backed by database sessions.
- **Token Family Security**: Tracking token families (`familyId`) to detect and mitigate token reuse attacks by revoking the entire token family upon reuse attempt.
- **Login Rate Limiting**: Protecting against brute-force attacks by limiting login failures per IP (5 attempts per 15-minute window).
- **Session Resolution**: Providing current authenticated user identity and resolved permissions.

## File Structure

```
apps/api/src/auth/
├── auth.controller.ts   # Express router for login, refresh, logout, and session endpoints
├── auth.dto.ts          # Request body validation DTOs (LoginDto)
├── auth.service.ts      # Authentication logic, bcrypt comparisons, JWT signing, session rotation
└── README.md            # Module documentation
```

## API Endpoints

| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticates credentials, issues Bearer access token & sets HttpOnly refresh cookie |
| `POST` | `/api/auth/refresh` | Public (Cookie) | Rotates refresh token, issues new access token & updates refresh cookie |
| `POST` | `/api/auth/logout` | Public (Cookie) | Revokes active refresh token session & clears refresh cookie |
| `GET` | `/api/auth/session` | Bearer Token | Returns profile details and permission array for current user |

---

## Endpoint Details & Schemas

### 1. `POST /api/auth/login`

Authenticates a user with email and password.

#### Request Body (`LoginDto`)
```json
{
  "email": "admin@trendsbird.test",
  "password": "Admin@12345"
}
```

#### Success Response (`200 OK`)
Sets `trends_bird_refresh` HttpOnly cookie on path `/api/auth`.
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "path": "/api/auth/login",
  "timestamp": "2026-07-29T00:00:00.000Z"
}
```

#### Errors
- `400 Bad Request`: Validation failure (invalid email format or missing password).
- `401 Unauthorized`: Invalid email/password, or account/role is inactive.
- `429 Too Many Requests`: Exceeded 5 failed login attempts in 15 minutes.

---

### 2. `POST /api/auth/refresh`

Rotates the refresh token stored in the `trends_bird_refresh` HttpOnly cookie.

#### Cookies Required
- `trends_bird_refresh`: `<sessionId>.<randomBase64Url>`

#### Success Response (`200 OK`)
Updates `trends_bird_refresh` HttpOnly cookie with new token.
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "path": "/api/auth/refresh",
  "timestamp": "2026-07-29T00:00:00.000Z"
}
```

#### Security Behaviors
- **Token Rotation**: The old refresh token is marked as `revokedAt` and replaced with a new token in a database transaction (`prisma.$transaction`).
- **Reuse Detection**: If an already-revoked refresh token is presented, all active tokens in the same `familyId` are immediately revoked.

---

### 3. `POST /api/auth/logout`

Revokes the active refresh session and clears the cookie.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  },
  "path": "/api/auth/logout",
  "timestamp": "2026-07-29T00:00:00.000Z"
}
```

---

### 4. `GET /api/auth/session`

Retrieves user profile information and flattened permissions.

#### Headers Required
```
Authorization: Bearer <accessToken>
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "c1f7b8a2-3e4d-4e5f-9a0b-1c2d3e4f5a6b",
    "name": "Super Administrator",
    "email": "admin@trendsbird.test",
    "phone": "+1234567890",
    "avatar": null,
    "role": {
      "id": "e5f6a7b8-1c2d-3e4f-5a6b-7c8d9e0f1a2b",
      "name": "Super Admin"
    },
    "permissions": [
      "user:read",
      "user:create",
      "user:update",
      "user:delete",
      "role:read",
      "category:read",
      "product:read"
    ]
  },
  "path": "/api/auth/session",
  "timestamp": "2026-07-29T00:00:00.000Z"
}
```

---

## Key Domain Rules

1. **Password Hashing**: User passwords are stored as `bcrypt` hashes (salt rounds = 10).
2. **Session Storage**: Database stores only SHA-256 digests (`tokenHash`) of refresh tokens, never plain text tokens.
3. **Cookie Configuration**:
   - `httpOnly: true` (prevents XSS access)
   - `sameSite: "strict"` (CSRF protection)
   - `path: "/api/auth"` (scoped strictly to auth endpoints)
   - `secure: true` in production environment
