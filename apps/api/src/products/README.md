# Products Module (`apps/api/src/products`)

The **Products Module** manages e-commerce product catalog items, handling simple products vs. variable products with variants, transactional updates, HTML sanitization, SKU uniqueness, and media attachments in the Trends Bird API.

## Responsibilities

- **Product Types**: Supporting Simple products (holding product-level price/stock) and Variable products (holding variants with attribute value combinations).
- **Transactional Writes**: Creating and updating products, categories, media, and variants inside `prisma.$transaction`. Update operations safely replace relations.
- **SKU Uniqueness**: Enforcing globally unique SKUs for simple products and variants across the entire catalog.
- **Price & Stock Validation**: Validating non-negative prices and stock, ensuring `salePrice <= price`, and automatically deriving `stockStatus` (`IN_STOCK`, `OUT_OF_STOCK`).
- **HTML Description Sanitization**: Sanitizing long descriptions against an allowed HTML element list (removing scripts, event attributes, and unapproved tags).
- **Media Preservation**: Deleting a product cascades variants and relational links (`ProductMedia`, `VariantMedia`), but preserves shared media assets in Cloudinary and the `Media` table.

## File Structure

```
apps/api/src/products/
├── product-validation.spec.ts  # Jest unit tests for product validation & price/combination rules
├── products.controller.ts     # Express router endpoints for product CRUD
├── products.dto.ts            # DTOs (UpsertProductDto, ProductVariantDto, ProductQueryDto)
├── products.service.ts       # Core catalog engine, HTML sanitizer, SKU uniqueness, database transaction wrapper
└── README.md                  # Module documentation
```

## API Endpoints

| Method | Endpoint | Required Permission | Description |
|---|---|---|---|
| `GET` | `/api/products` | `product:read` | Returns paginated products with search, category, brand, and sorting filters |
| `GET` | `/api/products/:id` | `product:read` | Retrieves full product details including variants, media, and categories |
| `POST` | `/api/products` | `product:create` | Creates a new simple or variable product inside a database transaction |
| `PATCH` | `/api/products/:id` | `product:update` | Replaces product details, variants, and links inside a database transaction |
| `DELETE` | `/api/products/:id` | `product:delete` | Deletes product and variant rows (shared media assets are preserved) |

---

## Endpoint Details & Schemas

### 1. `GET /api/products`

Lists products with filters, price ranges, and aggregated stock totals.

#### Query Parameters (`ProductQueryDto`)
- `page` (number, default `1`)
- `limit` (number, default `20`)
- `search` (string, optional search by product name, product SKU, or variant SKU)
- `categoryId` (UUID, optional category filter)
- `brandId` (UUID, optional brand filter)
- `active` (boolean, optional active status filter)
- `sortBy` (`createdAt` | `name` | `price`, default `createdAt`)
- `sortOrder` (`asc` | `desc`, default `desc`)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "p1p2p3p4-5p6p-7p8p-9p0p-1p2p3p4p5p6p",
        "name": "Classic T-Shirt",
        "slug": "classic-t-shirt",
        "sku": "TSHIRT-001",
        "hasVariants": true,
        "active": true,
        "priceRange": {
          "min": 19.99,
          "max": 24.99
        },
        "totalStock": 45
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "totalItems": 1,
      "totalPages": 1
    }
  },
  "path": "/api/products",
  "timestamp": "2026-07-29T00:00:00.000Z"
}
```

---

### 2. `POST /api/products` & `PATCH /api/products/:id`

Creates or updates a product (`UpsertProductDto`).

#### Request Body (Simple Product Example)
```json
{
  "name": "Classic Mug",
  "slug": "classic-mug",
  "sku": "MUG-001",
  "hasVariants": false,
  "price": 12.99,
  "salePrice": 9.99,
  "stock": 50,
  "brandId": "b1b2c3d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
  "categoryIds": ["c1f7b8a2-3e4d-4e5f-9a0b-1c2d3e4f5a6b"],
  "media": [
    {
      "mediaId": "m1m2m3m4-5m6m-7m8m-9m0m-1m2m3m4m5m6m",
      "sortOrder": 1,
      "isThumbnail": true
    }
  ],
  "variants": []
}
```

#### Request Body (Variable Product Example)
```json
{
  "name": "Cotton T-Shirt",
  "slug": "cotton-t-shirt",
  "hasVariants": true,
  "brandId": "b1b2c3d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
  "categoryIds": ["c1f7b8a2-3e4d-4e5f-9a0b-1c2d3e4f5a6b"],
  "variants": [
    {
      "sku": "TSHIRT-RED-S",
      "price": 19.99,
      "salePrice": null,
      "stock": 20,
      "attributeValueIds": ["val-red-id", "val-small-id"]
    }
  ]
}
```

---

## Key Domain Rules

1. **Type Rules**:
   - Simple products (`hasVariants: false`) MUST provide product-level `price` and `stock`, and MUST NOT contain variants.
   - Variable products (`hasVariants: true`) MUST NOT store product-level `price` or `stock`, and MUST contain at least one variant.
2. **Pricing & Stock Rules**:
   - `salePrice` cannot exceed regular `price`.
   - Prices and stock values cannot be negative.
   - Stock status is auto-derived: `stock > 0 ? IN_STOCK : OUT_OF_STOCK`.
3. **SKU Uniqueness**: Simple product SKUs and variant SKUs must be globally unique across all active and inactive products.
4. **Thumbnail Rule**: A product (or variant) can have at most one thumbnail assigned (`isThumbnail: true`).
5. **HTML Sanitization**: Long descriptions are sanitized using a strict tag allow-list (`<p>`, `<b>`, `<i>`, `<ul>`, `<li>`, `<a>`, `<h3>`, etc.). Dangerous scripts and event attributes are stripped.
