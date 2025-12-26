# Slash Backend API

Express server API for Chrome extension snippet management with **JWT-based authentication**, Firebase integration, and MongoDB.

## Features

- **🔐 JWT Authentication** - Secure token-based auth with access & refresh token rotation
- **🔥 Firebase Integration** - User identity verification via Firebase ID tokens
- **🏗️ Modular MVC Architecture** - Clean separation with controllers, models, routes, and middleware
- **🔒 Encrypted Storage** - Snippet values encrypted at rest using AES-256
- **📊 Comprehensive Audit Logging** - Track all user actions and API operations
- **💾 MongoDB Database** - Scalable NoSQL database with Mongoose ODM
- **🚀 RESTful API** - Full CRUD operations for snippet and user management
- **📈 Usage Analytics** - Track snippet usage count and timestamps
- **🌐 CORS Support** - Browser extension ready configuration
- **⚡ Token Refresh** - Automatic token rotation with secure refresh tokens

## Architecture Overview

### Two-Tier Authentication System

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Client    │─────▶│   Firebase   │─────▶│   Backend   │
│  (Extension)│      │ Auth (Google)│      │  (Express)  │
└─────────────┘      └──────────────┘      └─────────────┘
       │                                           │
       │  1. Sign in with Google                   │
       │  2. Get Firebase ID Token                 │
       │                                           │
       │  3. POST /auth/firebase                   │
       │     Authorization: Bearer <Firebase_Token>│
       ├───────────────────────────────────────────▶
       │                                           │
       │  4. Receive Backend Tokens                │
       │     {accessToken, refreshToken}           │
       ◀───────────────────────────────────────────┤
       │                                           │
       │  5. API Calls with Access Token           │
       │     Authorization: Bearer <Access_Token>  │
       ├───────────────────────────────────────────▶
       │                                           │
       │  6. Token expired? Refresh                │
       │     POST /auth/refresh                    │
       │     Authorization: Bearer <Refresh_Token> │
       ├───────────────────────────────────────────▶
       │                                           │
       │  7. New tokens (rotation)                 │
       ◀───────────────────────────────────────────┤
```
**WHY TWO TIER?:**

- ✅ **Before:** Clients sent Firebase ID token with every request
- ✅ **After:** Clients exchange Firebase token once, then use short-lived JWT access tokens
- ✅ **Why:** Better performance, reduced Firebase API calls, token rotation security


### Middleware Chain

```
Request → CORS → Body Parser → Request Logger → Audit Logger → Security Headers → Routes → Error Handler → Response
```

### Data Flow

1. **User signs in** with Google/Firebase (frontend handles this)
2. **Frontend receives** Firebase ID token from Firebase Auth
3. **Exchange token** at `/auth/firebase` for backend JWT tokens
4. **Access token** (15 min) used for all API calls
5. **Refresh token** (180 days) used to get new access tokens
6. **Logout** revokes refresh token from database

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 3. Firebase Configuration

Download your Firebase service account key:

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save as `serviceAccountKey.json` in project root

To minify the json: 

```bash
cat serviceAccountKey.json | jq -c
```


### 4. Environment Configuration

Create `.env` file:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/slash-backend

# Firebase
FIREBASE_SERVICE_ACCOUNT_KEY="minified-json"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
REFRESH_TOKEN_SECRET=your-refresh-token-secret-here-generate-a-strong-one
ACCESS_TOKEN_EXPIRY=900          # 15 minutes in seconds
REFRESH_TOKEN_EXPIRY=15552000    # 180 days in seconds
```

**⚠️ IMPORTANT**: Generate strong secrets for production:

### 5. Start the Server

```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

Server will start on `http://localhost:5000`


### Security Features

- ✅ **Token Rotation** - Refresh tokens are single-use (invalidated on refresh)
- ✅ **HMAC-SHA256 Hashing** - Refresh tokens stored hashed, never plaintext
- ✅ **Short-lived Access** - 15-minute access tokens minimize exposure
- ✅ **TTL Index** - Expired refresh tokens auto-deleted from database
- ✅ **Audit Logging** - All auth operations logged for security tracking


## Project Structure

```
slash-backend/
├── src/
│   ├── config/
│   │   ├── database.js          # MongoDB connection setup
│   │   └── firebase.js          # Firebase Admin SDK initialization
│   │
│   ├── controllers/
│   │   ├── auditController.js   # Audit log query handlers
│   │   ├── snippetController.js # Snippet CRUD business logic
│   │   └── userController.js    # User management handlers
│   │
│   ├── middleware/
│   │   ├── auth.js              # Legacy Firebase auth (not actively used)
│   │   ├── auditLogger.js       # Request/response audit logging
│   │   ├── requestLogger.js     # Console request logging
│   │   └── verifyAccessToken.js # JWT access token verification ⭐
│   │
│   ├── models/
│   │   ├── auditModel.js        # Audit log schema & queries
│   │   ├── refreshTokenModel.js # Refresh token storage & rotation ⭐
│   │   ├── snippetModel.js      # Snippet schema with encryption
│   │   └── userModel.js         # User schema & sync methods
│   │
│   ├── routes/
│   │   ├── auditRoutes.js       # Audit log endpoints
│   │   ├── authRoutes.js        # Authentication endpoints ⭐
│   │   ├── healthRoutes.js      # Health check endpoint
│   │   ├── index.js             # Route aggregator
│   │   ├── snippetRoutes.js     # Snippet CRUD routes
│   │   └── userRoutes.js        # User management routes
│   │
│   ├── utils/
│   │   ├── errorHandler.js      # Global error handling middleware
│   │   ├── logger.js            # Logging utilities
│   │   └── tokenUtils.js        # JWT generation & verification ⭐
│   │
│   └── app.js                   # Express app configuration
│
├── server.js                    # Application entry point
├── package.json
├── .env                         # Environment variables (gitignored)
├── env.example                  # Environment template
└── serviceAccountKey.json       # Firebase credentials (gitignored)
```

⭐ = New files for JWT authentication system

## Security Features

### 🔐 Authentication & Authorization

- **Two-factor token system** - Firebase validates identity, JWT manages sessions
- **Short-lived access tokens** - 15-minute expiration minimizes exposure window
- **Refresh token rotation** - Old refresh tokens invalidated on use (prevents replay attacks)
- **HMAC-SHA256 hashing** - Refresh tokens stored hashed, never plaintext
- **TTL auto-cleanup** - Expired tokens automatically removed from database

### 🔒 Data Protection

- **AES-256-GCM encryption** - Snippet values encrypted with PBKDF2-derived keys (keyword + userId, 100k iterations)
- **Per-snippet encryption** - Each snippet encrypted with unique key and IV
- **Environment secrets** - JWT and refresh token secrets stored in environment variables
- **HTTPS recommended** - SSL/TLS for production deployments
- **No plaintext tokens** - Tokens never logged or stored in plaintext

### 🛡️ Request Security

- **CORS configuration** - Controlled cross-origin access
- **Security headers**:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
- **Input validation** - All inputs validated before processing
- **Rate limiting** - (Recommended: add express-rate-limit for production)

### 📊 Audit & Monitoring

- **Comprehensive audit logging** - All operations logged with timestamps
- **User action tracking** - Track create, read, update, delete operations
- **Request/response logging** - Debug and security analysis
- **Error tracking** - Detailed error logs for debugging

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses `nodemon` to automatically restart the server when files change.

### Testing the API

#### 1. Get Firebase ID Token

You need a Firebase ID token to test. Get one from your frontend or use Firebase SDK:

```javascript
// In browser console (if you have Firebase Auth set up)
firebase.auth().currentUser.getIdToken(true)
  .then(token => console.log(token));
```

#### 2. Test Authentication Flow

```bash
# Step 1: Exchange Firebase token for backend tokens
FIREBASE_TOKEN="your-firebase-id-token"
RESPONSE=$(curl -s -X POST http://localhost:5000/auth/firebase \
  -H "Authorization: Bearer $FIREBASE_TOKEN")

# Extract tokens
ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.accessToken')
REFRESH_TOKEN=$(echo $RESPONSE | jq -r '.refreshToken')

echo "Access Token: $ACCESS_TOKEN"
echo "Refresh Token: $REFRESH_TOKEN"
```

#### 3. Test API Endpoints

```bash
# Get current user
curl -X GET http://localhost:5000/api/user/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Get all snippets
curl -X GET http://localhost:5000/api/snippets \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Create snippet
curl -X POST http://localhost:5000/api/snippets \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "/test",
    "value": "This is a test snippet"
  }'
```

#### 4. Test Token Refresh

```bash
# Refresh access token
curl -X POST http://localhost:5000/auth/refresh \
  -H "Authorization: Bearer $REFRESH_TOKEN"
```

#### 5. Test Logout

```bash
# Logout (revoke refresh token)
curl -X POST http://localhost:5000/auth/logout \
  -H "Authorization: Bearer $REFRESH_TOKEN"
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues or questions:

- Open an issue on GitHub
- Check [BACKEND_AUTH_READY.md](./BACKEND_AUTH_READY.md) for authentication details
- Review [READY_TO_TEST.md](./READY_TO_TEST.md) for testing instructions
