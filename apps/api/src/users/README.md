# Users Module (`apps/api/src/users`)

The **Users Module** manages user accounts, credentials, role assignments, avatar links, and security self-protection rules in the Trends Bird API.

## Responsibilities

- **User Account Management**: Creating, updating, searching, and deleting admin user accounts.
- **Password Security**: Hashing passwords using `bcrypt` (12 rounds) on create and update.
- **Self-Protection Safeguards**: Blocking users from deleting their own active account (`id === actorId`) or modifying their own role (`roleId`).
- **Role Link Verification**: Ensuring assigned roles exist and are active.
- **Safe Projections**: Excluding password hashes from all query outputs.

## File Structure

```
apps/api/src/users/
├── users.controller.ts   # Express router endpoints for user management
├── users.dto.ts          # Request DTOs (CreateUserDto, UpdateUserDto, UserQueryDto)
├── users.service.ts     # User CRUD operations, bcrypt hashing, self-protection guards
└── README.md             # Module documentation
```

## API Endpoints

| Method | Endpoint | Required Permission | Description |
|---|---|---|---|
| `GET` | `/api/users` | `user:read` | Returns paginated list of users with role and search filters |
| `GET` | `/api/users/:id` | `user:read` | Retrieves details for a specific user |
| `POST` | `/api/users` | `user:create` | Creates a new user account with hashed password |
| `PATCH` | `/api/users/:id` | `user:update` | Updates user details, role, status, or password |
| `DELETE` | `/api/users/:id` | `user:delete` | Permanently deletes a user account (refused if self) |

---

## Endpoint Details & Schemas

### 1. `GET /api/users`

Lists user accounts with pagination, search, roleId, and active status filters.

#### Query Parameters (`UserQueryDto`)
- `page` (number, default `1`)
- `limit` (number, default `20`)
- `search` (string, optional search by name or email)
- `roleId` (UUID, optional filter by assigned role)
- `active` (boolean, optional active status filter)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "u1u2u3u4-5u6u-7u8u-9u0u-1u2u3u4u5u6u",
        "name": "Jane Doe",
        "email": "jane@trendsbird.test",
        "phone": "+1234567890",
        "gender": "FEMALE",
        "active": true,
        "avatar": {
          "id": "m1m2m3m4-5m6m-7m8m-9m0m-1m2m3m4m5m6m",
          "publicUrl": "https://res.cloudinary.com/.../avatar.jpg",
          "thumbnailUrl": "https://res.cloudinary.com/.../thumb.jpg"
        },
        "role": {
          "id": "r1r2r3r4-5r6r-7r8r-9r0r-1r2r3r4r5r6r",
          "name": "Catalog Manager"
        },
        "createdAt": "2026-07-29T00:00:00.000Z",
        "updatedAt": "2026-07-29T00:00:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "totalItems": 1,
      "totalPages": 1
    }
  },
  "path": "/api/users",
  "timestamp": "2026-07-29T00:00:00.000Z"
}
```

---

### 2. `POST /api/users`

Creates a new user account.

#### Request Body (`CreateUserDto`)
```json
{
  "name": "Jane Doe",
  "email": "jane@trendsbird.test",
  "password": "SecurePassword@123",
  "phone": "+1234567890",
  "gender": "FEMALE",
  "roleId": "r1r2r3r4-5r6r-7r8r-9r0r-1r2r3r4r5r6r",
  "avatarId": null,
  "active": true
}
```

---

### 3. `PATCH /api/users/:id` & `DELETE /api/users/:id`

Updates or deletes a user.

#### Guard Rules & Security Checks
1. **Self-Role Modification Guard**: An authenticated user cannot change their own `roleId` (`id === actorId`). Attempting to do so returns `403 Forbidden`.
2. **Self-Deletion Guard**: An authenticated user cannot delete their own account (`id === actorId`). Attempting to do so returns `403 Forbidden`.
3. **Password Security**: Updating the `password` field hashes the new value with `bcrypt.hash(password, 12)`.

#### Error Response Example (`403 Forbidden`)
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You cannot delete your own account"
  },
  "path": "/api/users/u1u2u3u4-5u6u-7u8u-9u0u-1u2u3u4u5u6u",
  "timestamp": "2026-07-29T00:00:00.000Z"
}
```

---

## Key Domain Rules

1. **Self Protection**: Users cannot delete themselves or elevate/alter their own role.
2. **Active Role Required**: Users can only be assigned to existing, active roles.
3. **Sensitive Data Projection**: Passwords and password hashes are stripped from all API outputs.
