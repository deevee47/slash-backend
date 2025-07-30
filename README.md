# Slash Backend API

Express server API for Chrome extension snippet management with Firebase authentication and MongoDB.

## Features

- **Modular MVC Architecture** - Clean separation of concerns with controllers, models, routes, and middleware
- **Firebase Authentication** - Secure token-based authentication using Firebase ID tokens
- **MongoDB Database** - Scalable NoSQL database with Mongoose ODM
- **RESTful API** - Full CRUD operations for snippet management
- **Usage Analytics** - Track snippet usage count and timestamps
- **CORS Support** - Browser extension ready configuration
- **Error Handling** - Comprehensive error handling and logging
- **Graceful Shutdown** - Proper cleanup of database connections

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **MongoDB Setup:**

   ```bash
   # Install MongoDB locally or use MongoDB Atlas
   # Local installation: https://docs.mongodb.com/manual/installation/

   # Or use Docker:
   docker run -d -p 27017:27017 --name slash-mongodb mongo:latest
   ```

3. **Firebase Configuration:**

   Option A: Use service account key (recommended for development)

   - Download your Firebase service account key JSON file
   - Place it in the project root
   - Set the path in `.env` file:
     ```
     FIREBASE_SERVICE_ACCOUNT_KEY=./serviceAccountKey.json
     ```

   Option B: Use Application Default Credentials

   - Install Google Cloud SDK
   - Run: `gcloud auth application-default login`
   - The server will automatically use these credentials

4. **Environment Configuration:**

   ```bash
   cp env.example .env
   # Edit .env file with your configuration
   ```

   **Required environment variables:**

   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/slash-backend
   FIREBASE_SERVICE_ACCOUNT_KEY=./serviceAccountKey.json
   NODE_ENV=development
   ```

5. **Start the server:**

   ```bash
   # Development (with auto-restart)
   npm run dev

   # Production
   npm start
   ```

## API Endpoints

### Authentication

All API endpoints require a Firebase ID token in the Authorization header:

```
Authorization: Bearer {firebase-id-token}
```

### GET /api/snippets

Get all snippets for the authenticated user.

**Response:**

```json
{
  "success": true,
  "snippets": [
    {
      "id": "1",
      "keyword": "/email",
      "value": "john.doe@example.com",
      "usageCount": 5,
      "lastUsed": "2023-12-01T10:30:00.000Z",
      "createdAt": "2023-11-01T08:00:00.000Z",
      "updatedAt": "2023-12-01T10:30:00.000Z"
    }
  ]
}
```

### POST /api/snippets

Create a new snippet.

**Request Body:**

```json
{
  "keyword": "/newkeyword",
  "value": "replacement text"
}
```

**Response:**

```json
{
  "success": true,
  "snippet": {
    "id": "2",
    "keyword": "/newkeyword",
    "value": "replacement text",
    "usageCount": 0,
    "lastUsed": null,
    "createdAt": "2023-12-01T11:00:00.000Z",
    "updatedAt": "2023-12-01T11:00:00.000Z"
  }
}
```

### DELETE /api/snippets/:id

Delete a snippet.

**Response:**

```json
{
  "success": true,
  "message": "Snippet deleted successfully"
}
```

### POST /api/snippets/:id/usage

Increment usage count for a snippet.

**Response:**

```json
{
  "success": true,
  "usageCount": 6,
  "lastUsed": "2023-12-01T11:30:00.000Z"
}
```

### GET /api/test

Test endpoint for Chrome extension connectivity (requires authentication).

**Response:**

```json
{
  "success": true,
  "message": "Backend is connected and working!",
  "timestamp": "2023-12-01T11:30:00.000Z",
  "server": "Express.js with MVC Architecture",
  "user": {
    "uid": "firebase-user-id",
    "email": "user@example.com",
    "name": "User Name",
    "emailVerified": true
  },
  "environment": "development",
  "database": "MongoDB",
  "authentication": "Firebase Admin SDK",
  "architecture": "MVC Pattern"
}
```

## User Management Endpoints

### POST /api/user/sync

Sync user data on login (called automatically by Chrome extension).

**Request Body:**

```json
{
  "uid": "firebase-user-id",
  "email": "user@example.com",
  "displayName": "User Name",
  "photoURL": "https://example.com/photo.jpg",
  "lastLoginAt": "2023-12-01T12:00:00.000Z"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User synced successfully",
  "user": {
    "uid": "firebase-user-id",
    "email": "user@example.com",
    "displayName": "User Name",
    "photoURL": "https://example.com/photo.jpg",
    "lastLoginAt": "2023-12-01T12:00:00.000Z",
    "createdAt": "2023-11-01T08:00:00.000Z",
    "updatedAt": "2023-12-01T12:00:00.000Z"
  }
}
```

### GET /api/user/profile

Get current user profile.

**Response:**

```json
{
  "success": true,
  "user": {
    "uid": "firebase-user-id",
    "email": "user@example.com",
    "displayName": "User Name",
    "photoURL": "https://example.com/photo.jpg",
    "lastLoginAt": "2023-12-01T12:00:00.000Z",
    "createdAt": "2023-11-01T08:00:00.000Z",
    "updatedAt": "2023-12-01T12:00:00.000Z"
  }
}
```

### GET /api/user/stats

Get user statistics.

**Response:**

```json
{
  "success": true,
  "stats": {
    "uid": "firebase-user-id",
    "email": "user@example.com",
    "memberSince": "2023-11-01T08:00:00.000Z",
    "lastLogin": "2023-12-01T12:00:00.000Z"
  }
}
```

### PUT /api/user/login

Update last login time.

**Response:**

```json
{
  "success": true,
  "message": "Last login updated",
  "lastLoginAt": "2023-12-01T12:00:00.000Z"
}
```

### DELETE /api/user/account

Delete user account.

**Response:**

```json
{
  "success": true,
  "message": "User account deleted successfully"
}
```

### GET /health

Health check endpoint (no authentication required).

**Response:**

```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2023-12-01T11:30:00.000Z",
  "version": "1.0.0",
  "environment": "development",
  "database": "connected"
}
```

### GET /health/status

Detailed system status endpoint (no authentication required).

**Response:**

```json
{
  "success": true,
  "timestamp": "2023-12-01T11:30:00.000Z",
  "server": {
    "uptime": 123.456,
    "memory": { "rss": 123456, "heapTotal": 123456, "heapUsed": 123456 },
    "version": "v18.0.0",
    "platform": "win32",
    "arch": "x64"
  },
  "database": {
    "status": "connected",
    "readyState": 1
  },
  "environment": {
    "nodeEnv": "development",
    "port": 5000
  }
}
```

### PUT /api/snippets/:id

Update a snippet.

**Request Body:**

```json
{
  "keyword": "/updated-keyword",
  "value": "updated replacement text"
}
```

**Response:**

```json
{
  "success": true,
  "snippet": {
    "id": "507f1f77bcf86cd799439011",
    "keyword": "/updated-keyword",
    "value": "updated replacement text",
    "usageCount": 5,
    "lastUsed": "2023-12-01T10:30:00.000Z",
    "createdAt": "2023-11-01T08:00:00.000Z",
    "updatedAt": "2023-12-01T11:35:00.000Z"
  }
}
```

### GET /api/snippets/:id

Get a specific snippet by ID.

**Response:**

```json
{
  "success": true,
  "snippet": {
    "id": "507f1f77bcf86cd799439011",
    "keyword": "/email",
    "value": "john.doe@example.com",
    "usageCount": 5,
    "lastUsed": "2023-12-01T10:30:00.000Z",
    "createdAt": "2023-11-01T08:00:00.000Z",
    "updatedAt": "2023-12-01T10:30:00.000Z"
  }
}
```

## Error Responses

All endpoints return error responses in this format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:

- `400` - Bad Request (invalid input)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found (snippet not found)
- `409` - Conflict (duplicate keyword)
- `500` - Internal Server Error

## Project Structure

```
slash-backend/
├── src/
│   ├── config/
│   │   ├── database.js       # MongoDB connection configuration
│   │   └── firebase.js       # Firebase Admin SDK configuration
│   ├── controllers/
│   │   ├── snippetController.js  # Snippet business logic
│   │   └── healthController.js   # Health check endpoints
│   ├── middleware/
│   │   ├── auth.js           # Firebase authentication middleware
│   │   └── requestLogger.js  # Request logging middleware
│   ├── models/
│   │   └── snippetModel.js   # Mongoose schema and data operations
│   ├── routes/
│   │   ├── index.js          # Main route aggregator
│   │   ├── snippetRoutes.js  # Snippet-related routes
│   │   └── healthRoutes.js   # Health check routes
│   ├── utils/
│   │   ├── logger.js         # Logging utility
│   │   └── errorHandler.js   # Global error handling
│   └── app.js                # Express application setup
├── server.js                 # Application entry point
├── package.json
└── env.example
```

## MongoDB Schema

The MongoDB database contains the following collections:

### Snippets Collection

```javascript
{
  _id: ObjectId,
  userId: String (required, indexed),
  keyword: String (required, trimmed),
  value: String (required),
  usageCount: Number (default: 0, min: 0),
  lastUsed: Date (nullable),
  createdAt: Date (auto-generated),
  updatedAt: Date (auto-generated)
}

// Compound unique index on userId + keyword
db.snippets.createIndex({ userId: 1, keyword: 1 }, { unique: true })
```

### Users Collection

```javascript
{
  _id: ObjectId,
  uid: String (required, unique, indexed),
  email: String (required, unique, lowercase),
  displayName: String (nullable),
  photoURL: String (nullable),
  lastLoginAt: Date (required),
  createdAt: Date (auto-generated),
  updatedAt: Date (auto-generated)
}

// Indexes
db.users.createIndex({ uid: 1 }, { unique: true })
db.users.createIndex({ email: 1 }, { unique: true })
```

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses nodemon to automatically restart the server when files change.

### Testing the API

You can test the API endpoints using curl or any HTTP client. Make sure to include a valid Firebase ID token in the Authorization header.

Example:

```bash
# Health check (no auth required)
curl http://localhost:5000/health

# Detailed status
curl http://localhost:5000/health/status

# Get snippets (requires auth)
curl -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
     http://localhost:5000/api/snippets

# Test connectivity endpoint (Chrome extension uses this)
curl -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
     http://localhost:5000/api/test

# Create snippet (requires auth)
curl -X POST \
     -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"keyword":"/test","value":"test value"}' \
     http://localhost:5000/api/snippets
```

### Using the Test Scripts

```bash
# Test basic API functionality with Firebase ID token
node test-api.js YOUR_FIREBASE_ID_TOKEN

# Test Chrome extension connectivity endpoint
node test-api-connection.js YOUR_FIREBASE_ID_TOKEN

# Or use npm scripts
npm run test YOUR_FIREBASE_ID_TOKEN
npm run test:connection YOUR_FIREBASE_ID_TOKEN
```

## Deployment

For production deployment:

1. Set environment variables:

   ```bash
   export NODE_ENV=production
   export PORT=5000
   ```

2. Use a process manager like PM2:

   ```bash
   npm install -g pm2
   pm2 start server.js --name "slash-backend"
   ```

3. Set up a reverse proxy (nginx) if needed
4. Configure SSL/HTTPS
5. Set up monitoring and logging

## Security Considerations

- Firebase ID tokens are verified on every API request
- Database queries use parameterized statements to prevent SQL injection
- CORS is configured to allow browser extension requests
- Sensitive configuration is stored in environment variables
- Input validation is performed on all endpoints
