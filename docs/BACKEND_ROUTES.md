## Authentication

### Overview

This backend uses a **two-tier authentication system**:

1. **Firebase Authentication** - Validates user identity (Google sign-in)
2. **JWT Tokens** - Manages backend sessions with short-lived access tokens

### Token Types

| Token Type | Duration | Purpose | Storage | Format |
|------------|----------|---------|---------|--------|
| **Firebase ID Token** | 1 hour | One-time exchange for backend tokens | Not stored | Firebase JWT |
| **Access Token** | 15 minutes | API authentication | Client memory/storage | Backend JWT |
| **Refresh Token** | 180 days | Renew access tokens | Database (hashed) | `rtk_` + random |

### Authentication Flow

#### Step 1: Exchange Firebase Token for Backend Tokens

After user signs in with Google (frontend), exchange Firebase ID token:

```bash
POST /auth/firebase
Content-Type: application/json
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "rtk_abc123def456...",
  "expiresIn": 900
}
```

#### Step 2: Use Access Token for API Calls

```bash
GET /api/snippets
Authorization: Bearer <ACCESS_TOKEN>
```

#### Step 3: Refresh Access Token (when expired)

```bash
POST /auth/refresh
Authorization: Bearer <REFRESH_TOKEN>
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "rtk_new789xyz...",
  "expiresIn": 900
}
```

**Note:** Refresh tokens are **rotated** - old token is invalidated, new one issued.

#### Step 4: Logout (revoke refresh token)

```bash
POST /auth/logout
Authorization: Bearer <REFRESH_TOKEN>
```

**Response:**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Security Features

- ✅ **Token Rotation** - Refresh tokens are single-use (invalidated on refresh)
- ✅ **HMAC-SHA256 Hashing** - Refresh tokens stored hashed, never plaintext
- ✅ **Short-lived Access** - 15-minute access tokens minimize exposure
- ✅ **TTL Index** - Expired refresh tokens auto-deleted from database
- ✅ **Audit Logging** - All auth operations logged for security tracking


## API Endpoints

### Authentication Endpoints

**Base Path:** `/auth` (no authentication required)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/firebase` | Exchange Firebase ID token for backend tokens | Firebase Token |
| POST | `/auth/refresh` | Refresh access token (with rotation) | Refresh Token |
| POST | `/auth/logout` | Revoke refresh token | Refresh Token |

---

### Health Check Endpoints

**Base Path:** `/health` (no authentication required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |

---

### User Endpoints

**Base Path:** `/api/user` (requires `Authorization: Bearer <ACCESS_TOKEN>`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/me` | Get current authenticated user |
| POST | `/api/user/sync` | Sync user data on login |
| GET | `/api/user/profile` | Get user profile |
| GET | `/api/user/stats` | Get user statistics |
| PUT | `/api/user/login` | Update last login time |
| DELETE | `/api/user/account` | Delete user account |

---

### Snippet Endpoints

**Base Path:** `/api/snippets` (requires `Authorization: Bearer <ACCESS_TOKEN>`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/snippets` | Get all snippets for user |
| POST | `/api/snippets` | Create new snippet |
| GET | `/api/snippets/:id` | Get specific snippet by ID |
| PUT | `/api/snippets/:id` | Update snippet |
| DELETE | `/api/snippets/:id` | Delete snippet |
| POST | `/api/snippets/:id/usage` | Increment usage count |

---

### Audit Log Endpoints

**Base Path:** `/api/audit-logs` (requires `Authorization: Bearer <ACCESS_TOKEN>`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/audit-logs/logs` | Get user's audit logs (paginated) |
| GET | `/api/audit-logs/action/:action` | Get logs by action type |
| GET | `/api/audit-logs/resource/:resource` | Get logs by resource |
| GET | `/api/audit-logs/status/:status` | Get logs by status |
| GET | `/api/audit-logs/all` | Get all audit logs (admin only) |
| GET | `/api/audit-logs/stats` | Get audit statistics (admin only) |

---

## Detailed API Documentation

### POST /auth/firebase

Exchange Firebase ID token for backend access and refresh tokens.

**Request:**

```bash
curl -X POST http://localhost:5000/auth/firebase \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json"
```

**Success Response (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2N...",
  "refreshToken": "rtk_33f6c5313c5d4fdeb7e09ca6bc85914b2df4c4a247862c64...",
  "expiresIn": 900
}
```

**Error Responses:**

```json
// No token provided (401)
{
  "error": "No Firebase token provided",
  "code": "NO_TOKEN"
}

// Invalid Firebase token (401)
{
  "error": "Invalid Firebase token",
  "code": "INVALID_FIREBASE_TOKEN"
}

// Expired Firebase token (401)
{
  "error": "Firebase token expired",
  "code": "FIREBASE_TOKEN_EXPIRED"
}
```

---

### GET /api/user/me

Get current authenticated user's information.

**Request:**

```bash
curl -X GET http://localhost:5000/api/user/me \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response (200):**

```json
{
  "user": {
    "firebaseUid": "abc123xyz789",
    "email": "user@example.com",
    "displayName": "John Doe",
    "photoURL": "https://lh3.googleusercontent.com/a/...",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "lastLoginAt": "2025-12-26T08:30:00.000Z"
  }
}
```

**Error Responses:**

```json
// No token (401)
{
  "error": "No access token provided",
  "code": "NO_TOKEN"
}

// Expired token (401)
{
  "error": "Token expired",
  "code": "TOKEN_EXPIRED"
}

// User not found (401)
{
  "error": "User not found",
  "code": "USER_NOT_FOUND"
}
```

---

### GET /api/snippets

Get all snippets for the authenticated user.

**Request:**

```bash
curl -X GET http://localhost:5000/api/snippets \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response (200):**

```json
{
  "success": true,
  "snippets": [
    {
      "id": "507f1f77bcf86cd799439011",
      "keyword": "/email",
      "value": "john.doe@example.com",
      "usageCount": 5,
      "lastUsed": "2025-12-26T10:30:00.000Z",
      "createdAt": "2025-12-01T08:00:00.000Z",
      "updatedAt": "2025-12-26T10:30:00.000Z"
    },
    {
      "id": "507f1f77bcf86cd799439012",
      "keyword": "/signature",
      "value": "Best regards,\nJohn Doe",
      "usageCount": 12,
      "lastUsed": "2025-12-25T14:20:00.000Z",
      "createdAt": "2025-12-05T09:15:00.000Z",
      "updatedAt": "2025-12-25T14:20:00.000Z"
    }
  ]
}
```

---

### POST /api/snippets

Create a new snippet.

**Request:**

```bash
curl -X POST http://localhost:5000/api/snippets \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "/address",
    "value": "123 Main St, City, State 12345"
  }'
```

**Request Body:**

```json
{
  "keyword": "/address",
  "value": "123 Main St, City, State 12345"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "snippet": {
    "id": "507f1f77bcf86cd799439013",
    "keyword": "/address",
    "value": "123 Main St, City, State 12345",
    "usageCount": 0,
    "lastUsed": null,
    "createdAt": "2025-12-26T11:00:00.000Z",
    "updatedAt": "2025-12-26T11:00:00.000Z"
  }
}
```

**Error Responses:**

```json
// Missing fields (400)
{
  "success": false,
  "error": "Keyword and value are required"
}

// Duplicate keyword (409)
{
  "success": false,
  "error": "A snippet with this keyword already exists"
}

// Invalid keyword format (400)
{
  "success": false,
  "error": "Keyword must start with /"
}
```

---

### PUT /api/snippets/:id

Update an existing snippet.

**Request:**

```bash
curl -X PUT http://localhost:5000/api/snippets/507f1f77bcf86cd799439013 \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "/newaddress",
    "value": "456 New St, City, State 67890"
  }'
```

**Success Response (200):**

```json
{
  "success": true,
  "snippet": {
    "id": "507f1f77bcf86cd799439013",
    "keyword": "/newaddress",
    "value": "456 New St, City, State 67890",
    "usageCount": 0,
    "lastUsed": null,
    "createdAt": "2025-12-26T11:00:00.000Z",
    "updatedAt": "2025-12-26T11:15:00.000Z"
  }
}
```

---

### DELETE /api/snippets/:id

Delete a snippet.

**Request:**

```bash
curl -X DELETE http://localhost:5000/api/snippets/507f1f77bcf86cd799439013 \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Snippet deleted successfully"
}
```

**Error Response (404):**

```json
{
  "success": false,
  "error": "Snippet not found"
}
```

---

### POST /api/snippets/:id/usage

Increment usage count for a snippet (called when snippet is used).

**Request:**

```bash
curl -X POST http://localhost:5000/api/snippets/507f1f77bcf86cd799439011/usage \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response (200):**

```json
{
  "success": true,
  "usageCount": 6,
  "lastUsed": "2025-12-26T11:30:00.000Z"
}
```

---

### GET /health

Basic health check (no authentication required).

**Request:**

```bash
curl http://localhost:5000/health
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-12-26T11:30:00.000Z",
  "version": "1.0.0",
  "environment": "development",
  "database": "connected"
}
```

---

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

OR (for some endpoints):

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

### HTTP Status Codes

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input or malformed request |
| 401 | Unauthorized | Missing, invalid, or expired authentication |
| 403 | Forbidden | Authenticated but not authorized for resource |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists (duplicate) |
| 500 | Internal Server Error | Server-side error |

### Error Codes

#### Authentication Errors (401)

| Code | Description |
|------|-------------|
| `NO_TOKEN` | No access token provided in Authorization header |
| `TOKEN_EXPIRED` | Access token has expired - client should refresh |
| `INVALID_TOKEN` | Access token is invalid or malformed |
| `USER_NOT_FOUND` | User doesn't exist in database |
| `NO_FIREBASE_TOKEN` | No Firebase token provided for exchange |
| `FIREBASE_TOKEN_EXPIRED` | Firebase ID token has expired |
| `INVALID_FIREBASE_TOKEN` | Firebase token is invalid |
| `INVALID_REFRESH_TOKEN` | Refresh token is invalid or expired |
| `AUTH_FAILED` | General authentication failure |

#### Validation Errors (400)

- Invalid input format
- Missing required fields
- Invalid keyword format (must start with `/`)

#### Resource Errors

- `404` - Snippet not found
- `409` - Duplicate keyword for user