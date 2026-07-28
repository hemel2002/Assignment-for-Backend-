# Common Module (`apps/api/src/common`)

The **Common Module** provides shared infrastructure, HTTP utilities, authentication & authorization middleware, DTO validation helpers, parameter guards, and standardized error handling for the Trends Bird API.

## Responsibilities

- **Authentication Middleware**: Verifying Bearer JWT access tokens on protected routes.
- **Permission Guards**: Enforcing granular `module:action` permissions per request.
- **Response Standardization**: Formatting all API success responses and error payloads predictably.
- **DTO & Query Validation**: Validating request body/query parameters using `class-validator` and `class-transformer`.
- **UUID Validation**: Guarding route parameters against non-UUID inputs.
- **Error Handling**: Centralizing error translation and preventing leak of internal stack traces, DB messages, or server paths.

## Directory Overview

```
apps/api/src/common/
├── audit.service.ts              # System audit logging service helper
├── http.ts                       # sendSuccess helper and asyncHandler wrapper
├── auth/
│   ├── access-token.middleware.ts  # Bearer JWT verification & active identity reload
│   └── permissions.middleware.ts   # requirePermissions guard
├── errors/
│   ├── http-error.ts               # Custom HttpError hierarchy (BadRequest, Unauthorized, Forbidden, etc.)
│   └── error-handler.middleware.ts # Global Express error handling middleware
├── validation/
│   ├── params.ts                   # requireUuid parameter guard middleware
│   ├── query.dto.ts                # PageQueryDto, pageMeta, pagination utilities
│   └── validate.ts                 # validateDto middleware pipe
└── README.md                     # Module documentation
```

---

## Core Components & Utilities

### 1. HTTP Response Helpers (`common/http.ts`)

- **`asyncHandler(fn)`**: Wraps asynchronous Express route handlers to automatically catch unhandled rejections and forward them to `next(err)`.
- **`sendSuccess(req, res, data, status = 200)`**: Formats API output into a consistent envelope:

#### Standardized Success Response Shape
```json
{
  "success": true,
  "data": { ... },
  "meta": { ... },
  "path": "/api/example",
  "timestamp": "2026-07-29T00:00:00.000Z"
}
```

---

### 2. Error Handling & Standardization (`common/errors/`)

Centralized custom error class hierarchy inheriting from `HttpError`:

| Error Class | HTTP Status | Code | Usage |
|---|---|---|---|
| `BadRequestError` | `400` | `BAD_REQUEST` | Validation failures, cycle detections, invalid input |
| `UnauthorizedError` | `401` | `UNAUTHORIZED` | Missing/invalid access token or refresh cookie |
| `ForbiddenError` | `403` | `FORBIDDEN` | Missing required `module:action` permission |
| `NotFoundError` | `404` | `NOT_FOUND` | Requested entity ID does not exist |
| `ConflictError` | `409` | `CONFLICT` | Entity deletion blocked by existing references |
| `TooManyRequestsError` | `429` | `TOO_MANY_REQUESTS` | Rate limit window exceeded |

#### Standardized Error Response Shape
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Missing required permission: product:delete"
  },
  "path": "/api/products/123",
  "timestamp": "2026-07-29T00:00:00.000Z"
}
```

---

### 3. Authentication & Authorization Middleware (`common/auth/`)

- **`authenticate(prisma)`**: Extracts `Authorization: Bearer <token>`, verifies JWT signature, loads active user profile and current permissions from database. Rejects if user or role is inactive (`401 Unauthorized`).
- **`requirePermissions(...required)`**: Checks if the authenticated `req.user.permissions` array contains all specified `module:action` permissions. Throws `403 Forbidden` if missing any permission.

---

### 4. Validation Utilities (`common/validation/`)

- **`validateDto(DtoClass, target = "body")`**: Middleware that transforms plain request body/query into DTO instance via `class-transformer` and validates via `class-validator`.
- **`requireUuid(...paramNames)`**: Ensures target route parameter(s) (e.g. `:id`, `:valueId`) are valid UUID strings before hitting service logic.
- **`PageQueryDto`**: Shared pagination DTO supporting `page`, `limit`, `search`, `sortBy`, `sortOrder`.
