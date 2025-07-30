# Firebase Setup Guide

This guide will help you set up Firebase authentication for your Express server.

## Prerequisites

- A Firebase project (create one at [Firebase Console](https://console.firebase.google.com))
- Node.js and npm installed

## Setup Options

### Option 1: Service Account Key (Recommended for Development)

1. **Generate Service Account Key:**

   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project
   - Go to Project Settings (gear icon) → Service Accounts
   - Click "Generate new private key"
   - Download the JSON file

2. **Configure the Server:**

   ```bash
   # Copy the service account key to your project
   cp ~/Downloads/your-project-firebase-adminsdk-xxxxx.json ./serviceAccountKey.json

   # Create environment file
   cp env.example .env

   # Edit .env file
   echo "FIREBASE_SERVICE_ACCOUNT_KEY=./serviceAccountKey.json" > .env
   ```

### Option 2: Application Default Credentials (For Production)

1. **Install Google Cloud SDK:**

   ```bash
   # Follow instructions at: https://cloud.google.com/sdk/docs/install
   ```

2. **Authenticate:**

   ```bash
   gcloud auth application-default login
   ```

3. **Set Project:**
   ```bash
   gcloud config set project YOUR_FIREBASE_PROJECT_ID
   ```

## Testing Authentication

### Getting a Firebase ID Token for Testing

1. **From Web App:**

   ```javascript
   // In browser console on a page with Firebase auth
   firebase
     .auth()
     .currentUser.getIdToken()
     .then((token) => {
       console.log("ID Token:", token);
     });
   ```

2. **From Node.js (for testing):**

   ```javascript
   const admin = require("firebase-admin");

   // Initialize admin SDK (same as server)
   admin.initializeApp({
     credential: admin.credential.cert(require("./serviceAccountKey.json")),
   });

   // Create custom token for testing
   admin
     .auth()
     .createCustomToken("test-user-id")
     .then((customToken) => {
       console.log("Custom token:", customToken);
       // Use this token to sign in with Firebase client SDK
     });
   ```

3. **Using the Test Script:**
   ```bash
   # Run the test script with your ID token
   node test-api.js YOUR_FIREBASE_ID_TOKEN
   ```

## Common Issues and Solutions

### Issue: "Error initializing Firebase Admin SDK"

**Solutions:**

1. Check that your service account key file exists and is valid JSON
2. Verify the file path in your `.env` file
3. Ensure the service account has the necessary permissions

### Issue: "Invalid token" errors

**Solutions:**

1. Make sure you're using a current ID token (they expire after 1 hour)
2. Verify your Firebase project ID is correct
3. Check that the client and server are using the same Firebase project

### Issue: "No valid token provided"

**Solutions:**

1. Include the Authorization header: `Bearer YOUR_ID_TOKEN`
2. Make sure there's a space after "Bearer"
3. Verify the token is not empty or truncated

## Environment Variables

Create a `.env` file in your project root:

```env
# Required for custom service account key
FIREBASE_SERVICE_ACCOUNT_KEY=./serviceAccountKey.json

# Optional: Custom port (defaults to 5000)
PORT=5000

# Optional: Environment
NODE_ENV=development
```

## Firebase Console Configuration

1. **Enable Authentication:**

   - Go to Authentication → Sign-in method
   - Enable your preferred sign-in methods (Email/Password, Google, etc.)

2. **Web App Configuration:**

   - Go to Project Settings → General
   - Add a web app if you haven't already
   - Copy the config object for your client application

3. **Service Account Permissions:**
   - Go to IAM & Admin in Google Cloud Console
   - Ensure your service account has "Firebase Admin SDK Administrator Service Agent" role

## Security Best Practices

1. **Never commit service account keys to version control**

   - Add `*serviceAccountKey.json` to `.gitignore`
   - Use environment variables in production

2. **Use Application Default Credentials in production**

   - More secure than service account keys
   - Automatically managed by Google Cloud services

3. **Validate tokens on every request**

   - The server already does this in the `verifyToken` middleware
   - Never trust client-side authentication state

4. **Monitor authentication logs**
   - Check Firebase Console → Authentication → Users
   - Monitor for suspicious activity

## Production Deployment

For production environments:

1. **Use Application Default Credentials:**

   ```bash
   # Don't set FIREBASE_SERVICE_ACCOUNT_KEY
   # The server will automatically use default credentials
   ```

2. **Set up proper IAM roles:**

   - Service account should have minimal required permissions
   - Use Firebase Admin SDK Service Agent role

3. **Environment variables:**
   ```env
   NODE_ENV=production
   PORT=5000
   # Don't set FIREBASE_SERVICE_ACCOUNT_KEY
   ```

## Troubleshooting

### Debug Mode

Add debug logging to your server:

```javascript
// Add this to server.js for debugging
app.use("/api", (req, res, next) => {
  console.log("Request:", req.method, req.path);
  console.log(
    "Headers:",
    req.headers.authorization ? "Token present" : "No token"
  );
  next();
});
```

### Testing with Curl

```bash
# Test with curl
curl -H "Authorization: Bearer YOUR_ID_TOKEN" \
     http://localhost:5000/api/snippets
```

### Verify Token Manually

```javascript
// In Node.js
const admin = require("firebase-admin");

admin
  .auth()
  .verifyIdToken("YOUR_ID_TOKEN")
  .then((decodedToken) => {
    console.log("Token is valid:", decodedToken);
  })
  .catch((error) => {
    console.error("Token verification failed:", error);
  });
```
