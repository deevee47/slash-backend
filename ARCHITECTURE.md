# Architecture Overview

## MVC Pattern Implementation

This Express.js application follows a **Model-View-Controller (MVC)** architectural pattern with additional layers for better separation of concerns.

## Directory Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Business logic handlers
├── middleware/      # Custom middleware functions
├── models/          # Data models and database operations
├── routes/          # API route definitions
└── utils/           # Utility functions and helpers
```

## Layer Responsibilities

### 1. **Models** (`src/models/`)

- **Purpose**: Data access layer
- **Responsibilities**:
  - Define MongoDB schemas using Mongoose
  - Handle database operations (CRUD)
  - Data validation and transformation
  - Business rules related to data

**Example**: `snippetModel.js`

```javascript
class SnippetModel {
  async getAllByUserId(userId) {
    /* ... */
  }
  async create(userId, snippetData) {
    /* ... */
  }
  async deleteByIdAndUserId(snippetId, userId) {
    /* ... */
  }
}
```

### 2. **Controllers** (`src/controllers/`)

- **Purpose**: Business logic layer
- **Responsibilities**:
  - Handle HTTP requests and responses
  - Coordinate between models and views
  - Input validation
  - Error handling
  - Authentication checks

**Example**: `snippetController.js`

```javascript
class SnippetController {
  async getAllSnippets(req, res) {
    const userId = req.user.uid;
    const snippets = await snippetModel.getAllByUserId(userId);
    res.json({ success: true, snippets });
  }
}
```

### 3. **Routes** (`src/routes/`)

- **Purpose**: Request routing layer
- **Responsibilities**:
  - Define API endpoints
  - Apply middleware to routes
  - Map HTTP methods to controller functions
  - Route parameter validation

**Example**: `snippetRoutes.js`

```javascript
router.get("/", snippetController.getAllSnippets);
router.post("/", snippetController.createSnippet);
router.delete("/:id", snippetController.deleteSnippet);
```

### 4. **Middleware** (`src/middleware/`)

- **Purpose**: Cross-cutting concerns
- **Responsibilities**:
  - Authentication and authorization
  - Request logging
  - Error handling
  - Request/response transformation

**Example**: `auth.js`

```javascript
const verifyToken = async (req, res, next) => {
  // Firebase token verification
  // Add user info to req.user
  next();
};
```

### 5. **Configuration** (`src/config/`)

- **Purpose**: Application configuration
- **Responsibilities**:
  - Database connection setup
  - Third-party service configuration (Firebase)
  - Environment-specific settings

### 6. **Utilities** (`src/utils/`)

- **Purpose**: Shared utility functions
- **Responsibilities**:
  - Logging
  - Error handling helpers
  - Common validation functions
  - Helper utilities

## Data Flow

```
Client Request
      ↓
1. Express Router (routes/)
      ↓
2. Middleware (auth, logging)
      ↓
3. Controller (business logic)
      ↓
4. Model (data operations)
      ↓
5. MongoDB (database)
      ↓
6. Response back through the chain
```

## Benefits of This Architecture

### 1. **Separation of Concerns**

- Each layer has a single responsibility
- Changes in one layer don't affect others
- Easy to test individual components

### 2. **Maintainability**

- Code is organized and predictable
- Easy to locate and fix bugs
- Clear structure for new developers

### 3. **Scalability**

- Easy to add new features
- Can split into microservices if needed
- Database can be changed without affecting business logic

### 4. **Testability**

- Each layer can be unit tested independently
- Mock dependencies easily
- Clear boundaries for integration tests

### 5. **Reusability**

- Models can be used by multiple controllers
- Middleware can be shared across routes
- Utilities can be used throughout the application

## Key Design Patterns Used

### 1. **Dependency Injection**

- Configuration and dependencies are injected
- Easy to mock for testing
- Loose coupling between components

### 2. **Factory Pattern**

- Database connections
- Error creation
- Logger instances

### 3. **Middleware Pattern**

- Express middleware for cross-cutting concerns
- Composable request processing pipeline

### 4. **Repository Pattern**

- Models act as repositories for data access
- Abstraction over database operations

## Error Handling Strategy

### 1. **Layered Error Handling**

```
Controller → Model → Database
     ↓         ↓        ↓
Error Handler ← Error ← Error
```

### 2. **Error Types**

- **Validation Errors**: 400 Bad Request
- **Authentication Errors**: 401 Unauthorized
- **Authorization Errors**: 403 Forbidden
- **Not Found Errors**: 404 Not Found
- **Conflict Errors**: 409 Conflict
- **Server Errors**: 500 Internal Server Error

### 3. **Error Response Format**

```javascript
{
  "success": false,
  "error": "Human readable error message",
  "code": "ERROR_CODE", // Optional
  "details": {} // Optional, development only
}
```

## Authentication Flow

```
1. Client sends Firebase ID Token
2. Auth middleware verifies token
3. User info extracted and added to req.user
4. Controller accesses user info
5. Model filters data by user ID
6. Response sent back to client
```

## Database Schema Design

### Principles:

1. **User Isolation**: All data is scoped to user ID
2. **Unique Constraints**: Prevent duplicate keywords per user
3. **Indexing**: Optimize queries with proper indexes
4. **Timestamps**: Automatic createdAt/updatedAt tracking

### Schema:

```javascript
{
  userId: String (indexed),
  keyword: String (unique per user),
  value: String,
  usageCount: Number,
  lastUsed: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Security Considerations

### 1. **Authentication**

- Firebase ID token verification on every API request
- Token expiration handling
- User context isolation

### 2. **Authorization**

- User can only access their own data
- Database queries filtered by user ID
- No admin or elevated privileges needed

### 3. **Input Validation**

- Request body validation
- SQL injection prevention (using Mongoose)
- XSS prevention through proper encoding

### 4. **Security Headers**

- CORS configuration
- Security headers middleware
- Request size limits

## Performance Considerations

### 1. **Database**

- Proper indexing on frequently queried fields
- Lean queries to reduce memory usage
- Connection pooling through Mongoose

### 2. **Caching**

- Can be added at controller level
- Redis integration possible
- Static asset caching

### 3. **Request Processing**

- Async/await throughout
- Non-blocking I/O operations
- Efficient error handling

## Future Extensibility

### 1. **Microservices**

- Each controller could become a separate service
- Shared models through separate packages
- API gateway for routing

### 2. **Additional Features**

- Rate limiting middleware
- API versioning
- Real-time updates with WebSockets
- Background job processing

### 3. **Monitoring**

- Health check endpoints
- Metrics collection
- Performance monitoring
- Error tracking

This architecture provides a solid foundation for a scalable, maintainable Express.js application with clear separation of concerns and excellent testability.
