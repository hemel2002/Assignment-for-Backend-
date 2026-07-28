# Roles Module (`apps/api/src/roles`)

The **Roles Module** manages RBAC (Role-Based Access Control) role definitions, permission mappings, active role options, user assignment checks, and lock-out protection guards in the Trends Bird API.

## Responsibilities

- **Role Management**: Creating, updating, listing, and deleting roles.
- **Permission Assignment**: Mapping permissions to roles, with optional `grantAll: true` shortcut to assign all available permissions.
- **User Assignment Guard**: Refusing role deletion if any active or inactive user accounts are currently assigned to the role.
- **Role Manager Lockout Guard**: Ensuring at least one active role maintains `role:update` permission before permitting any role update, deactivation, or deletion.
- **Options Endpoint**: Providing a lightweight `/roles/options` dropdown payload of active roles.

## File Structure

```
apps/api/src/roles/
├── roles.controller.ts   # Express router for role CRUD operations and options
├── roles.dto.ts          # Validation DTOs (CreateRoleDto, UpdateRoleDto)
├── roles.service.ts     # RBAC logic, permission resolution, user & lockout guards
└── README.md             # Module documentation
```

## API Endpoints

| Method | Endpoint | Required Permission | Description |
|---|---|---|---|
| `GET` | `/api/roles` | `role:read` | Returns paginated list of roles with user and permission counts |
| `GET` | `/api/roles/options` | `role:read` | Returns lightweight ID and name list of active roles for UI dropdowns |
| `GET` | `/api/roles/:id` | `role:read` | Retrieves single role with detailed permission mappings |
| `POST` | `/api/roles` | `role:create` | Creates a new role with assigned permissions |
| `PATCH` | `/api/roles/:id` | `role:update` | Updates role details and permission mappings |
| `DELETE` | `/api/roles/:id` | `role:delete` | Deletes a role (refused if assigned to users or leaves no role manager) |

---

## Endpoint Details & Schemas

### 1. `GET /api/roles`

Lists roles with pagination, search, and active filters.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "r1r2r3r4-5r6r-7r8r-9r0r-1r2r3r4r5r6r",
        "name": "Catalog Manager",
        "description": "Manages categories, brands, attributes, and products",
        "active": true,
        "_count": {
          "users": 3,
          "permissions": 16
        }
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "totalItems": 1,
      "totalPages": 1
    }
  },
  "path": "/api/roles",
  "timestamp": "2026-07-29T00:00:00.000Z"
}
```

---

### 2. `POST /api/roles`

Creates a new role.

#### Request Body (`CreateRoleDto`)
```json
{
  "name": "Catalog Manager",
  "description": "Manages catalog modules only",
  "active": true,
  "permissionIds": [
    "perm-cat-read-id",
    "perm-cat-create-id",
    "perm-prod-read-id"
  ]
}
```
*Note: Setting `"grantAll": true` automatically grants all existing permissions in the system.*

---

### 3. `DELETE /api/roles/:id`

Deletes a role.

#### Guard Rules
1. **User Guard**: Rejects deletion with `409 Conflict` if `_count.users > 0`.
2. **Lockout Guard**: Rejects deletion with `409 Conflict` if removing this role would leave zero active roles possessing `role:update` permission.

#### Error Response Example
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Role cannot be deleted while users are assigned to it"
  },
  "path": "/api/roles/r1r2r3r4-5r6r-7r8r-9r0r-1r2r3r4r5r6r",
  "timestamp": "2026-07-29T00:00:00.000Z"
}
```

---

## Key Domain Rules

1. **Assigned Role Protection**: A role assigned to users cannot be deleted.
2. **Lockout Safety**: The system prevents deactivating or stripping `role:update` from the last remaining role manager to prevent lockout scenarios.
3. **Grant All Flag**: Setting `grantAll: true` expands to all system permissions at creation/update time.
