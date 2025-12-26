## MongoDB Schema

### Users Collection

```javascript
{
  _id: ObjectId,                    // MongoDB ID
  uid: String,                      // Firebase UID (unique, indexed)
  email: String,                    // User email (unique, lowercase)
  displayName: String,              // User's display name
  photoURL: String,                 // Profile photo URL
  lastLoginAt: Date,                // Last login timestamp
  createdAt: Date,                  // Account creation timestamp
  updatedAt: Date                   // Last update timestamp
}

// Indexes
db.users.createIndex({ uid: 1 }, { unique: true })
db.users.createIndex({ email: 1 }, { unique: true })
```

**Note:** API returns `id` (MongoDB `_id` as string) instead of `_id`.

---

### Snippets Collection

```javascript
{
  _id: ObjectId,                    // MongoDB ID
  userId: String,                   // User's Firebase UID (indexed)
  keyword: String,                  // Snippet keyword (e.g., "/email")
  iv: String,                       // Initialization vector for AES encryption
  value: String,                    // Encrypted snippet value
  usageCount: Number,               // Usage counter (default: 0)
  lastUsed: Date,                   // Last usage timestamp (nullable)
  createdAt: Date,                  // Creation timestamp
  updatedAt: Date                   // Last update timestamp
}

// Indexes
db.snippets.createIndex({ userId: 1 })
db.snippets.createIndex({ userId: 1, keyword: 1 }, { unique: true })
```

**Encryption:** Snippet values are encrypted using AES-256-GCM. Each snippet is encrypted with a unique key derived from the snippet's keyword and user ID using PBKDF2 (100,000 iterations). Each snippet has its own IV (initialization vector) and authentication tag for additional security.

#### How Snippet Encryption Works

The backend uses **per-snippet encryption** with PBKDF2 key derivation for enhanced security:

**1. Key Derivation (PBKDF2)**
```javascript
// From src/utils/crypto.js
function deriveKey(keyword, salt) {
  return crypto.pbkdf2Sync(keyword, salt, 100000, 32, "sha256");
}

// In src/controllers/snippetController.js
const key = deriveKey(snippet.keyword, userId);  // Unique key per snippet
```

**Key Points:**
- **Salt:** User's Firebase UID (unique per user)
- **Password:** Snippet's keyword (e.g., "/email")
- **Iterations:** 100,000 (PBKDF2 strengthening)
- **Output:** 32-byte (256-bit) key for AES-256

**2. Encryption Process (AES-256-GCM)**
```javascript
const { encrypted, iv, tag } = encrypt(value, key);
// Stored as: "encrypted_hex:auth_tag_hex"
```

**Stored in MongoDB:**
- `value`: Encrypted data + authentication tag (`encrypted:tag`)
- `iv`: Initialization vector (12 bytes, hex-encoded)
- `keyword`: Plaintext keyword (needed for key derivation on decrypt)

**3. Security Benefits**

| Feature | Benefit |
|---------|---------|
| **Per-user keys** | Each user's snippets use different encryption keys |
| **Per-keyword keys** | Same value encrypted differently for different keywords |
| **No global secret** | No single point of failure - compromising one key doesn't decrypt all data |
| **PBKDF2 hardening** | 100,000 iterations makes brute force attacks expensive |
| **GCM mode** | Authenticated encryption prevents tampering |
| **Unique IVs** | Each snippet has random IV - prevents pattern analysis |

**4. Decryption Process**
```javascript
// On retrieval
const key = deriveKey(snippet.keyword, userId);
const [encrypted, tag] = snippet.value.split(':');
const decryptedValue = decrypt(encrypted, key, snippet.iv, tag);
```

**Example:**
```
User: firebase_uid_abc123
Keyword: "/email"
Value: "john@example.com"

Key Derivation:
- PBKDF2("email", "firebase_uid_abc123", 100000) → 32-byte key

Encryption:
- Random IV: a1b2c3d4e5f6...
- Encrypt("john@example.com", key, IV) → encrypted data + auth tag

Stored in MongoDB:
{
  keyword: "/email",
  value: "4a5f8b2c....:d8e9f1a2....",  // encrypted:tag
  iv: "a1b2c3d4e5f6...."
}
```

**Why No ENCRYPTION_SECRET?**

This design is **more secure** than a global secret because:
- Compromising the database alone doesn't reveal plaintext (attacker needs keyword + userId)
- Each user's data is isolated by their Firebase UID
- Same snippet content encrypted differently for different users/keywords
- No environment variable to accidentally expose

---

### RefreshTokens Collection (New)

```javascript
{
  _id: ObjectId,                    // MongoDB ID
  userId: ObjectId,                 // Reference to User._id
  tokenHash: String,                // HMAC-SHA256 hash of token (unique)
  expiresAt: Date,                  // Token expiration (indexed with TTL)
  lastUsedAt: Date,                 // Last usage timestamp
  createdAt: Date,                  // Creation timestamp
  updatedAt: Date                   // Last update timestamp
}

// Indexes
db.refreshTokens.createIndex({ userId: 1 })
db.refreshTokens.createIndex({ tokenHash: 1 }, { unique: true })
db.refreshTokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })  // TTL index
```

**Security:**
- Tokens are **never stored plaintext** - only HMAC-SHA256 hashes
- TTL index automatically deletes expired tokens
- Token rotation invalidates old tokens

---

### AuditLogs Collection

```javascript
{
  _id: ObjectId,
  userId: String,                   // Firebase UID (indexed)
  userEmail: String,
  userName: String,
  action: String,                   // Action performed (indexed)
  resource: String,                 // Resource type (indexed)
  resourceId: String,               // Resource identifier
  method: String,                   // HTTP method
  url: String,                      // Request URL
  ip: String,                       // Client IP
  userAgent: String,                // Client user agent
  status: String,                   // success/failure/error (indexed)
  statusCode: Number,               // HTTP status code
  details: Mixed,                   // Operation-specific details
  error: Object,                    // Error details (if applicable)
  requestBody: Mixed,               // Request payload
  responseData: Mixed,              // Response data
  duration: Number,                 // Request duration (ms)
  createdAt: Date,                  // Log timestamp (indexed)
  updatedAt: Date
}

// Indexes
db.auditLogs.createIndex({ userId: 1, createdAt: -1 })
db.auditLogs.createIndex({ action: 1, createdAt: -1 })
db.auditLogs.createIndex({ resource: 1, createdAt: -1 })
db.auditLogs.createIndex({ status: 1, createdAt: -1 })
db.auditLogs.createIndex({ createdAt: -1 })
```

**Audit Actions:**
- `firebase_token_exchange`
- `token_refresh`
- `logout`
- `user_sync`
- `create_snippet`
- `update_snippet`
- `delete_snippet`
- `increment_snippet_usage`