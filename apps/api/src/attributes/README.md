# Attributes Module (`apps/api/src/attributes`)

The **Attributes Module** manages product variant attributes (e.g. Size, Color, Material) and their predefined values in the Trends Bird API.

## Responsibilities

- **Attribute Definition**: Managing product attributes (e.g. `Color`, `Size`).
- **Attribute Values**: Managing nested attribute values (e.g. `Red`, `Blue`, `XL`, `Cotton`) with optional color hex/code references and swatch media links.
- **Variant Guarding**: Guarding attributes and attribute values against deletion when they are in use by product variants.
- **Pagination & Search**: Supporting case-insensitive search and page-based listing.

## File Structure

```
apps/api/src/attributes/
├── attributes.controller.ts   # Express router for attributes and attribute-value endpoints
├── attributes.dto.ts          # Validation DTOs for attribute & value create/update
├── attributes.service.ts     # Business logic, Prisma queries, variant deletion guards
└── README.md                 # Module documentation
```

## API Endpoints

| Method | Endpoint | Required Permission | Description |
|---|---|---|---|
| `GET` | `/api/attributes` | `attribute:read` | Returns paginated list of attributes with nested values |
| `GET` | `/api/attributes/:id` | `attribute:read` | Retrieves a single attribute and its values |
| `POST` | `/api/attributes` | `attribute:create` | Creates a new attribute with initial values |
| `PATCH` | `/api/attributes/:id` | `attribute:update` | Updates an attribute name/slug/type |
| `DELETE` | `/api/attributes/:id` | `attribute:delete` | Deletes an attribute (refused if used in variants) |
| `POST` | `/api/attributes/:id/values` | `attribute:update` | Adds a new value to an attribute |
| `PATCH` | `/api/attributes/:id/values/:valueId` | `attribute:update` | Updates a specific attribute value |
| `DELETE` | `/api/attributes/:id/values/:valueId` | `attribute:delete` | Deletes a value (refused if used in variants) |

---

## Endpoint Details & Schemas

### 1. `GET /api/attributes`

Lists attributes with pagination and optional search filter.

#### Query Parameters (`PageQueryDto`)
- `page` (number, default `1`)
- `limit` (number, default `20`)
- `search` (string, optional case-insensitive search by name)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "a1b2c3d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
        "name": "Color",
        "slug": "color",
        "type": "COLOR",
        "values": [
          {
            "id": "v1v2v3v4-5v6v-7v8v-9v0v-1v2v3v4v5v6v",
            "value": "Red",
            "slug": "red",
            "reference": "#FF0000",
            "mediaId": null
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
  "path": "/api/attributes",
  "timestamp": "2026-07-29T00:00:00.000Z"
}
```

---

### 2. `POST /api/attributes`

Creates an attribute along with its initial set of values.

#### Request Body (`CreateAttributeDto`)
```json
{
  "name": "Size",
  "slug": "size",
  "type": "SELECT",
  "values": [
    {
      "value": "Small",
      "slug": "small",
      "reference": "S"
    },
    {
      "value": "Medium",
      "slug": "medium",
      "reference": "M"
    }
  ]
}
```

---

### 3. `DELETE /api/attributes/:id`

Deletes an attribute.

#### Guard Rules
- Rejects deletion if any of the attribute's values are linked to product variants (`_count.variants > 0`).

#### Error Response (`409 Conflict`)
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Attribute is used by product variants and cannot be deleted"
  },
  "path": "/api/attributes/a1b2c3d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
  "timestamp": "2026-07-29T00:00:00.000Z"
}
```

---

## Key Domain Rules

1. **Value Protection**: An attribute value cannot be deleted if any product variant references it.
2. **Attribute Protection**: An attribute cannot be deleted if any of its values are in use by product variants.
3. **Reference Field**: The optional `reference` field on values allows storing hex codes (e.g. `#000000`) for `COLOR` attributes or size codes (`S`, `M`, `L`) for `SELECT` attributes.
