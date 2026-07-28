# Categories Module (`apps/api/src/categories`)

The **Categories Module** manages hierarchical catalog categories, tree structure resolution, cycle prevention, and product categorization in the Trends Bird API.

## Responsibilities

- **Hierarchy Management**: Supporting parent-child category relationships with infinite depth.
- **Tree Resolution**: Converting flat database categories into a nested tree structure.
- **Cycle Prevention**: Ensuring parent updates walk the ancestor chain to reject cyclic references.
- **Deletion Safety**: Preventing category deletion if it contains child categories or linked products.
- **Slug Generation**: Automatically formatting and enforcing strict URL-friendly slugs using `slugify`.

## File Structure

```
apps/api/src/categories/
├── categories.controller.ts   # Express endpoints for listing, tree view, CRUD operations
├── categories.dto.ts          # Validation DTOs for category creation and updates
├── categories.service.ts     # Hierarchy tree builder, cycle assertion, deletion safety checks
└── README.md                 # Module documentation
```

## API Endpoints

| Method | Endpoint | Required Permission | Description |
|---|---|---|---|
| `GET` | `/api/categories` | `category:read` | Returns full nested category tree |
| `GET` | `/api/categories/tree` | `category:read` | Returns full nested category tree (alias) |
| `GET` | `/api/categories/:id` | `category:read` | Retrieves a single category with image and parent info |
| `POST` | `/api/categories` | `category:create` | Creates a new category |
| `PATCH` | `/api/categories/:id` | `category:update` | Updates an existing category (with cycle checking) |
| `DELETE` | `/api/categories/:id` | `category:delete` | Deletes a category (refused if children/products exist) |

---

## Endpoint Details & Schemas

### 1. `GET /api/categories` / `GET /api/categories/tree`

Retrieves all categories formatted as a nested tree structure.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "c1f7b8a2-3e4d-4e5f-9a0b-1c2d3e4f5a6b",
      "name": "Electronics",
      "slug": "electronics",
      "description": "Gadgets and tech products",
      "parentId": null,
      "active": true,
      "sortOrder": 1,
      "image": null,
      "_count": {
        "products": 12,
        "children": 2
      },
      "children": [
        {
          "id": "d2e8c9b3-4f5a-5e6f-0b1c-2d3e4f5a6b7c",
          "name": "Smartphones",
          "slug": "smartphones",
          "description": "Mobile phones",
          "parentId": "c1f7b8a2-3e4d-4e5f-9a0b-1c2d3e4f5a6b",
          "active": true,
          "sortOrder": 1,
          "children": []
        }
      ]
    }
  ],
  "path": "/api/categories",
  "timestamp": "2026-07-29T00:00:00.000Z"
}
```

---

### 2. `POST /api/categories`

Creates a new category.

#### Request Body (`CreateCategoryDto`)
```json
{
  "name": "Smartphones",
  "slug": "smartphones",
  "description": "Mobile phones and handheld devices",
  "parentId": "c1f7b8a2-3e4d-4e5f-9a0b-1c2d3e4f5a6b",
  "imageId": null,
  "active": true,
  "sortOrder": 1
}
```

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "data": {
    "id": "d2e8c9b3-4f5a-5e6f-0b1c-2d3e4f5a6b7c",
    "name": "Smartphones",
    "slug": "smartphones",
    "description": "Mobile phones and handheld devices",
    "parentId": "c1f7b8a2-3e4d-4e5f-9a0b-1c2d3e4f5a6b",
    "active": true,
    "sortOrder": 1,
    "createdAt": "2026-07-29T00:00:00.000Z",
    "updatedAt": "2026-07-29T00:00:00.000Z"
  },
  "path": "/api/categories",
  "timestamp": "2026-07-29T00:00:00.000Z"
}
```

---

### 3. `PATCH /api/categories/:id`

Updates an existing category.

#### Request Body (`UpdateCategoryDto`)
All fields are optional: `name`, `slug`, `description`, `parentId`, `imageId`, `active`, `sortOrder`.

#### Validation & Guard Rules
- **Self Parent Check**: `parentId` cannot equal the category `id`.
- **Cycle Prevention**: Walks the parent chain of `parentId` to ensure it does not trace back to `id`. If a cycle is detected, returns `400 Bad Request`.

---

### 4. `DELETE /api/categories/:id`

Deletes a category.

#### Guard Rules
- **Children Guard**: Rejects deletion if `_count.children > 0`.
- **Products Guard**: Rejects deletion if `_count.products > 0`.

#### Error Response (`409 Conflict`)
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Category cannot be deleted while it has children or products"
  },
  "path": "/api/categories/d2e8c9b3-4f5a-5e6f-0b1c-2d3e4f5a6b7c",
  "timestamp": "2026-07-29T00:00:00.000Z"
}
```

---

## Key Domain Rules

1. **Hierarchy Integrity**: Categories are organized hierarchically via `parentId`.
2. **Cycle Safety**: Cycle validation checks prevent circular parent references (A -> B -> A).
3. **Slug Formatting**: Slugs are generated strictly using lower-case, strict URL characters.
4. **Deletion Protection**: Non-empty categories (with active products or sub-categories) are protected from accidental deletion.