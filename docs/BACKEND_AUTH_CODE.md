# Backend Authentication System

## Summary

The backend authentication system has been successfully implemented and is now running on `http://localhost:5000`. All required routes, models, and middleware are in place.

## What Was Implemented

### 1. **Models Created** 

#### RefreshToken Model (`src/models/refreshTokenModel.js`)
- Stores hashed refresh tokens in MongoDB
- TTL index for automatic token cleanup
- Token rotation support
- HMAC-SHA256 token hashing

#### User Model Updates (`src/models/userModel.js`)
- Added `findById()` method for MongoDB _id lookups
- Returns user with `firebaseUid` field for compatibility

### 2. **Token Utilities** 

Created `src/utils/tokenUtils.js`:
- `generateAccessToken()` - Creates JWT with 15-minute expiry
- `verifyAccessToken()` - Validates JWT tokens
- `getAccessTokenExpiry()` - Returns token lifetime
- Proper error handling for expired/invalid tokens

### 3. **Middleware** 

Created `src/middleware/verifyAccessToken.js`:
- Extracts and validates JWT from Authorization header
- Attaches user info to `req.userId` and `req.user`
- Returns appropriate error codes (TOKEN_EXPIRED, INVALID_TOKEN, etc.)

### 4. **Authentication Routes** 

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Chrome Extension                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  LOGIN FLOW:                                                 │
│  ┌─────────────┐                                            │
│  │  User Click │                                            │
│  │   "Login"   │                                            │
│  └──────┬──────┘                                            │
│         │                                                    │
│         ▼                                                    │
│  ┌─────────────────┐                                        │
│  │ Chrome Identity │ → Google OAuth Dialog                  │
│  │  getAuthToken() │                                        │
│  └────────┬────────┘                                        │
│           │                                                  │
│           │ OAuth Token                                      │
│           ▼                                                  │
│  ┌──────────────────┐                                       │
│  │   Firebase Auth  │ → signInWithCredential()              │
│  └────────┬─────────┘                                       │
│           │                                                  │
│           │ Firebase ID Token                                │
│           ▼                                                  │
│  ┌───────────────────────────────────┐                      │
│  │  exchangeFirebaseTokenForBackend  │                      │
│  │  POST /auth/firebase              │ ─────────┐           │
│  └───────────────────────────────────┘          │           │
│                                                  │           │
│  ┌──────────────────────┐                       │           │
│  │  Firebase Sign Out   │ (cleanup)             │           │
│  └──────────────────────┘                       │           │
│           │                                      │           │
│           ▼                                      │           │
│  ┌──────────────────────┐                       │           │
│  │   Store Backend      │                       │           │
│  │   Access + Refresh   │ ◄─────────────────────┘           │
│  │      Tokens          │                                   │
│  └──────────┬───────────┘                                   │
│             │                                                │
│             ▼                                                │
│  ┌──────────────────────┐                                   │
│  │   Load User Data     │                                   │
│  │  (snippets, profile) │                                   │
│  └──────────────────────┘                                   │
│                                                               │
│  API CALL FLOW:                                              │
│  ┌─────────────────────┐                                    │
│  │   makeApiCall()     │                                    │
│  └──────────┬──────────┘                                    │
│             │                                                │
│             ▼                                                │
│  ┌──────────────────────┐                                   │
│  │ getBackendAccessToken│                                   │
│  └──────────┬───────────┘                                   │
│             │                                                │
│             │ Check Expiry (5s buffer)                       │
│             ├─── Expired? ───► refreshBackendToken()        │
│             │                          │                     │
│             │ ◄────────────────────────┘                     │
│             │ New Token                                      │
│             ▼                                                │
│  ┌──────────────────────┐                                   │
│  │  Fetch API Endpoint  │                                   │
│  │  Authorization:      │                                   │
│  │  Bearer {access_token│                                   │
│  └──────────┬───────────┘                                   │
│             │                                                │
│             ├─── 401? ───► refreshBackendToken()            │
│             │                    │                           │
│             │                    │ Retry Request             │
│             │ ◄──────────────────┘                           │
│             │                                                │
│             ▼                                                │
│  ┌──────────────────────┐                                   │
│  │  Return Response     │                                   │
│  └──────────────────────┘                                   │
│                                                               │
│  LOGOUT FLOW:                                                │
│  ┌─────────────────────┐                                    │
│  │ User Click "Logout" │                                    │
│  └──────────┬──────────┘                                    │
│             │                                                │
│             ▼                                                │
│  ┌──────────────────────┐                                   │
│  │  POST /auth/logout   │ (revoke refresh token)            │
│  └──────────┬───────────┘                                   │
│             │                                                │
│             ▼                                                │
│  ┌──────────────────────┐                                   │
│  │ clearBackendTokens() │                                   │
│  └──────────┬───────────┘                                   │
│             │                                                │
│             ▼                                                │
│  ┌──────────────────────┐                                   │
│  │  Reset Local State   │                                   │
│  └──────────────────────┘                                   │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

Created `src/routes/authRoutes.js` with three endpoints:

#### POST `/auth/firebase`
**Purpose:** Exchange Firebase ID token for backend tokens

**Request:**
```bash
curl -X POST http://localhost:5000/auth/firebase \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <firebase-id-token>"
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "rtk_abc123...",
  "expiresIn": 900
}
```

**Process:**
1. Verifies Firebase ID token with Firebase Admin SDK
2. Creates/updates user in MongoDB
3. Generates JWT access token (15 min)
4. Generates refresh token (180 days)
5. Returns both tokens

#### POST `/auth/refresh`
**Purpose:** Refresh access token using refresh token

**Request:**
```bash
curl -X POST http://localhost:5000/auth/refresh \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <refresh-token>"
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "rtk_xyz789...",
  "expiresIn": 900
}
```

**Process:**
1. Validates refresh token from database
2. Generates new access token
3. **Rotates refresh token** (old one deleted, new one created)
4. Returns new tokens

#### POST `/auth/logout`
**Purpose:** Revoke refresh token

**Request:**
```bash
curl -X POST http://localhost:5000/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <refresh-token>"
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Process:**
1. Deletes refresh token from database
2. Token can no longer be used for refresh

### 5. **User Endpoint** 

Added `GET /api/user/me` to `src/routes/userRoutes.js`:

**Request:**
```bash
curl -X GET http://localhost:5000/api/user/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access-token>"
```

**Response:**
```json
{
  "user": {
    "firebaseUid": "abc123...",
    "email": "user@example.com",
    "displayName": "John Doe",
    "photoURL": "https://...",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "lastLoginAt": "2025-01-01T12:00:00.000Z"
  }
}
```

### 6. **App Configuration** 

Updated `src/app.js`:
- Mounted auth routes at `/auth`
- Updated root endpoint to list all auth endpoints
- Auth routes accessible without `/api` prefix

### 7. **Environment Variables** 

Added to `.env`:
```env
JWT_SECRET=99OWemQFIkjfRy2DOVuUYywCrNNFnQFRK4Wf0zFFCun+Eqgt1DkOk/NMKyDxs1HDg3mMViUFu98u2cqGmH1oHA==
REFRESH_TOKEN_SECRET=Jh+jGJcytT76TDOTeZk8j1Plv2b53PYDS+MDSOYglyuuMu1HhG1bQ1E0Mi19AbHfYOD0k8CVXmPSSV6oidh93g==
ACCESS_TOKEN_EXPIRY=900          # 15 minutes
REFRESH_TOKEN_EXPIRY=15552000    # 180 days
```

## API Endpoints Available

### Auth Endpoints (No Authentication Required)
- `POST /auth/firebase` - Exchange Firebase token for backend tokens
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Revoke refresh token

### Protected Endpoints (Require Access Token)
- `GET /api/user/me` - Get current user (new auth system)
- `GET /api/snippets` - Get all snippets
- `POST /api/snippets` - Create snippet
- `PUT /api/snippets/:id` - Update snippet
- `DELETE /api/snippets/:id` - Delete snippet
- `POST /api/snippets/:id/usage` - Increment usage count

### Health Check
- `GET /health` - Server health status
- `GET /` - API information and endpoint list
