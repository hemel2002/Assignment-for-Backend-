# Brands Module (`apps/api/src/brands`)

The **Brands Module** manages manufacturer/vendor brand entities, logo assets, active statuses, and product reference checks in the Trends Bird API.

## Responsibilities

- **Brand Management**: Creating, updating, listing, and deleting brands.
- **Logo Media Integration**: Linking brands to uploaded media assets for brand logos.
- **Product Safety Guard**: Refusing brand deletion if products currently reference the brand.
- **Search & Filtering**: Paginated listing with optional search (by name) and `active` boolean filtering.

## File Structure

```
apps/api/src/brands/
├── brands.controller.ts   # Express endpoints for brand CRUD operations
├── brands.dto.ts          # Validation DTOs (CreateBrandDto, UpdateBrandDto, BrandQueryDto)
├── brands.service.ts     # Business logic, slug processing, product reference checks
└── README.md             # Module documentation
```

## API Endpoints

| Method | Endpoint | Required Permission | Description |
|---|---|---|---|
| `GET` | `/api/brands` | `brand:read` | Returns paginated list of brands with optional search/active filter |
| `GET` | `/api/brands/:id` | `brand:read` | Retrieves details for a specific brand |
| `POST` | `/api/brands` | `brand:create` | Creates a new brand entity |
| `PATCH` | `/api/brands/:id` | `brand:update` | Updates an existing brand |
| `DELETE` | `/api/brands/:id` | `brand:delete` | Deletes a brand (refused if referenced by products) |

---

## Endpoint Details & Schemas

### 1. `GET /api/brands`

Lists brands with pagination, search, and active filtering.

#### Query Parameters (`BrandQueryDto`)
- `page` (number, default `1`)
- `limit` (number, default `20`)
- `search` (string, optional case-insensitive search by brand name)
- `active` (boolean, optional filter by active status)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "b1b2c3d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
        "name": "Trends Bird Studio",
        "slug": "trends-bird-studio",
        "active": true,
        "description": "Official clothing line",
        "logoId": "m1m2m3m4-5m6m-7m8m-9m0m-1m2m3m4m5m6m",
        "logo": {
          "id": "m1m2m3m4-5m6m-7m8m-9m0m-1m2m3m4m5m6m",
          "publicUrl": "https://res.cloudinary.com/.../image.jpg",
          "thumbnailUrl": "https://res.cloudinary.com/.../c_thumb,w_200/image.jpg",
          "altText": "Trends Bird Logo"
        },
        "_count": {
          "products": 5
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
  "path": "/api/brands",
  "timestamp": "2026-07-29T00:00:00.000Z"
}
```

---

### 2. `POST /api/brands`

Creates a new brand.

#### Request Body (`CreateBrandDto`)
```json
{
  "name": "Trends Bird Studio",
  "slug": "trends-bird-studio",
  "logoId": "m1m2m3m4-5m6m-7m8m-9m0m-1m2m3m4m5m6m",
  "active": true,
  "description": "Official clothing and apparel line"
}
```

---

### 3. `DELETE /api/brands/:id`

Deletes a brand.

#### Guard Rules
- Rejects deletion if `_count.products > 0`.

#### Error Response (`409 Conflict`)
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Brand cannot be deleted while products reference it"
  },
  "path": "/api/brands/b1b2c3d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
  "timestamp": "2026-07-29T00:00:00.000Z"
}
```

---

## Key Domain Rules

1. **Product Guard**: Deleting a brand associated with one or more products is refused to prevent orphaned references.
2. **Slug Sanitization**: Slugs are generated strictly using `slugify` with `lower: true` and `strict: true`.
