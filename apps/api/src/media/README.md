# Media Module (`apps/api/src/media`)

The **Media Module** provides centralized cloud media storage, direct file upload processing via Cloudinary, thumbnail generation, metadata management, and reference check deletion guards in the Trends Bird API.

## Responsibilities

- **Direct Cloud Upload**: Ingesting files (`multipart/form-data`) via Multer memory storage and streaming directly to Cloudinary (`folder: "trends-bird"`).
- **Magic Bytes Validation**: Inspecting file binary headers (magic numbers) to strictly restrict uploads to valid JPEG, PNG, WebP, and MP4 formats.
- **Dynamic WebP Thumbnails**: Generating auto-quality, WebP-formatted 360x360 thumbnails for image assets via Cloudinary transformations.
- **Reference Check Deletion Guard**: Refusing media asset deletion if it is attached to any products, variants, categories, brands, attribute values, or user avatars.
- **Paginated Listing**: Searching media by title/original name and filtering by type (`IMAGE` vs `VIDEO`).

## File Structure

```
apps/api/src/media/
├── media.controller.ts   # Express router for file uploads (Multer), listing, metadata updates, deletion
├── media.dto.ts          # Validation DTOs (UpdateMediaDto, MediaQueryDto)
├── media.service.ts     # Magic-bytes detector, Cloudinary SDK stream integration, DB reference checks
└── README.md             # Module documentation
```

## API Endpoints

| Method | Endpoint | Required Permission | Description |
|---|---|---|---|
| `GET` | `/api/media` | `media:read` | Returns paginated list of uploaded media assets |
| `POST` | `/api/media/upload` | `media:upload` | Uploads up to 10 files (`multipart/form-data`) |
| `GET` | `/api/media/:id` | `media:read` | Retrieves single media asset record |
| `PATCH` | `/api/media/:id` | `media:write` | Updates media metadata (title, altText) |
| `DELETE` | `/api/media/:id` | `media:delete` | Deletes media record from DB and asset from Cloudinary |

---

## Endpoint Details & Schemas

### 1. `POST /api/media/upload`

Uploads files directly to Cloudinary storage.

#### Request Headers & Body
- `Content-Type: multipart/form-data`
- `files`: Array of file binaries (max 10 files per request). Max file size configurable via `MAX_UPLOAD_BYTES` (default: 5MB).

#### Allowed Formats (Magic Bytes Checked)
- **JPEG**: `0xFF 0xD8 0xFF`
- **PNG**: `0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A`
- **WebP**: `RIFF....WEBP`
- **MP4**: `....ftyp`

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "data": [
    {
      "id": "m1m2m3m4-5m6m-7m8m-9m0m-1m2m3m4m5m6m",
      "fileName": "trends-bird/abc123xyz",
      "originalName": "product-hero.jpg",
      "storedPath": "cloudinary://trends-bird/abc123xyz",
      "publicUrl": "https://res.cloudinary.com/demo/image/upload/v123456/trends-bird/abc123xyz.jpg",
      "thumbnailUrl": "https://res.cloudinary.com/demo/image/upload/c_limit,h_360,w_360/f_webp,q_auto/v123456/trends-bird/abc123xyz.jpg",
      "mimeType": "image/jpeg",
      "type": "IMAGE",
      "size": 245120,
      "width": 1200,
      "height": 800,
      "title": "product-hero",
      "altText": null,
      "uploadedById": "c1f7b8a2-3e4d-4e5f-9a0b-1c2d3e4f5a6b"
    }
  ],
  "path": "/api/media/upload",
  "timestamp": "2026-07-29T00:00:00.000Z"
}
```

---

### 2. `DELETE /api/media/:id`

Deletes a media asset record from PostgreSQL and removes the asset from Cloudinary storage.

#### Reference Checks (Deletion Guard)
Before deletion, the service verifies that `_count` across all related entities is zero:
- `productMedia === 0`
- `variantMedia === 0`
- `categories === 0`
- `brands === 0`
- `attributeValues === 0`
- `userAvatars === 0`

#### Error Response (`409 Conflict`)
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Media is attached to another record and cannot be deleted"
  },
  "path": "/api/media/m1m2m3m4-5m6m-7m8m-9m0m-1m2m3m4m5m6m",
  "timestamp": "2026-07-29T00:00:00.000Z"
}
```

---

## Key Domain Rules

1. **Security & Validation**: File extensions are ignored; MIME type and format are strictly verified using buffer magic numbers.
2. **Cloud Storage**: Media binaries are stored in Cloudinary, with `storedPath` containing the internal `cloudinary://` reference.
3. **Automatic Cleanup**: If database record creation fails after Cloudinary upload succeeds, the service triggers an immediate rollback destruction call on Cloudinary.
