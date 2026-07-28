# Dashboard Module (`apps/api/src/dashboard`)

The **Dashboard Module** provides key metric summaries and analytical counters for the admin web panel in the Trends Bird API.

## Responsibilities

- **Metrics Aggregation**: Querying database counters in a single optimized database transaction (`prisma.$transaction`).
- **Low-Stock Alerting**: Counting active product variants with stock `<= 5`.
- **System Overview**: Providing high-level counts for products, active products, categories, brands, media assets, and registered users.

## File Structure

```
apps/api/src/dashboard/
├── dashboard.controller.ts   # Express router for dashboard summary metrics
└── README.md                 # Module documentation
```

## API Endpoints

| Method | Endpoint | Required Permission | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/summary` | `dashboard:watch` | Returns analytical metrics and system counts |

---

## Endpoint Details & Schemas

### 1. `GET /api/dashboard/summary`

Fetches system summary stats in a single database transaction.

#### Headers Required
```
Authorization: Bearer <accessToken>
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "products": 45,
    "activeProducts": 38,
    "categories": 12,
    "brands": 8,
    "media": 120,
    "users": 15,
    "lowStockVariants": 3
  },
  "path": "/api/dashboard/summary",
  "timestamp": "2026-07-29T00:00:00.000Z"
}
```

#### Error Response (`403 Forbidden`)
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Missing required permission: dashboard:watch"
  },
  "path": "/api/dashboard/summary",
  "timestamp": "2026-07-29T00:00:00.000Z"
}
```

---

## Key Domain Rules

1. **Permission Guard**: Requires explicit `dashboard:watch` permission. Users without this capability receive `403 Forbidden`.
2. **Transactional Consistency**: All counter queries are executed simultaneously inside `prisma.$transaction` to guarantee point-in-time accuracy.
3. **Low-Stock Criteria**: `lowStockVariants` is calculated as `stock <= 5` for active product variants.
