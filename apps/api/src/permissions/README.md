# Permissions Module (`apps/api/src/permissions`)

The **Permissions Module** manages system capability definitions, permission groups, action assignments (`module:action`), and role capability link cascades in the Trends Bird API.

## Responsibilities

- **Permission Naming Convention**: Standardizing permissions using lower-case `<groupSlug>:<action>` format (e.g. `product:create`, `role:delete`).
- **Group Management**: Managing permission groups (modules) and their available actions (e.g. `read`, `create`, `update`, `delete`).
- **Cascade Behavior**: Deleting a permission group automatically cascades and removes all linked role-permission bindings without deleting roles.
- **Transaction Safety**: Atomic creation, updating, and removal of action permissions per group inside `prisma.$transaction`.

## File Structure

```
apps/api/src/permissions/
├── permissions.controller.ts   # Express endpoints for permission group CRUD
├── permissions.dto.ts          # Validation DTOs (CreatePermissionGroupDto, UpdatePermissionGroupDto)
├── permissions.service.ts     # Group/action upserting logic, slug formatting, cascade management
└── README.md                   # Module documentation
```

## API Endpoints

| Method | Endpoint | Required Permission | Description |
|---|---|---|---|
| `GET` | `/api/permissions` | `permission:read` | Returns paginated list of permission groups and actions |
| `GET` | `/api/permissions/:id` | `permission:read` | Retrieves single permission group details |
| `POST` | `/api/permissions` | `permission:create` | Creates a permission group with associated actions |
| `PATCH` | `/api/permissions/:id` | `permission:update` | Updates group name and updates/syncs action list |
| `DELETE` | `/api/permissions/:id` | `permission:delete` | Deletes permission group and cascades role-permission links |

---

## Endpoint Details & Schemas

### 1. `GET /api/permissions`

Lists all permission groups and actions.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "p1p2p3p4-5p6p-7p8p-9p0p-1p2p3p4p5p6p",
        "name": "Product",
        "slug": "product",
        "description": "Product catalog permissions",
        "permissions": [
          {
            "id": "action-1",
            "action": "create",
            "name": "product:create",
            "description": "create Product"
          },
          {
            "id": "action-2",
            "action": "read",
            "name": "product:read",
            "description": "read Product"
          }
        ]
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "totalItems": 1,
      "totalPages": 1
    }
  },
  "path": "/api/permissions",
  "timestamp": "2026-07-29T00:00:00.000Z"
}
```

---

### 2. `POST /api/permissions`

Creates a new permission group and auto-generates permissions for each provided action.

#### Request Body (`CreatePermissionGroupDto`)
```json
{
  "name": "Product",
  "description": "Product management capabilities",
  "actions": ["read", "create", "update", "delete"]
}
```

---

### 3. `DELETE /api/permissions/:id`

Deletes a permission group.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "message": "Permission group deleted; role links were cascaded"
  },
  "path": "/api/permissions/p1p2p3p4-5p6p-7p8p-9p0p-1p2p3p4p5p6p",
  "timestamp": "2026-07-29T00:00:00.000Z"
}
```

---

## Key Domain Rules

1. **Permission String Format**: Permissions are generated as `<groupSlug>:<action>`.
2. **Cascade Isolation**: Deleting a permission removes role-permission links (`RolePermission` rows), but does not alter or delete roles or users holding those roles.
