# Chrome Extension Backend Setup

This guide explains how to set up and test the `/api/test` endpoint for your Chrome extension.

## 🎯 Purpose

The `/api/test` endpoint is specifically designed for your Chrome extension to:

- Verify backend connectivity
- Test Firebase authentication
- Confirm the server is running and accessible
- Validate the user's authentication status

## 🚀 Quick Test

### Method 1: Chrome Extension (Recommended)

1. **Start your Express server:**

   ```bash
   npm run dev
   ```

2. **Open your Chrome extension popup**

3. **Login with Google** (gets Firebase ID token)

4. **Click the "Test API" button**

5. **Should show:** "✅ Backend connected!"

### Method 2: Manual Testing with Token

1. **Get Firebase ID Token from Extension:**

   - Open Chrome DevTools (F12)
   - Go to Console tab
   - Run this command:

   ```javascript
   // Get current user and ID token
   firebase.auth().onAuthStateChanged((user) => {
     if (user) {
       user.getIdToken().then((idToken) => {
         console.log("Firebase ID Token:", idToken);
         console.log("User:", user.email);
         console.log("Project:", "quick-type-6507d");
       });
     } else {
       console.log("User not logged in");
     }
   });
   ```

2. **Test with our script:**

   ```bash
   node test-api-connection.js YOUR_FIREBASE_ID_TOKEN
   ```

3. **Expected Output:**

   ```
   🧪 Testing /api/test endpoint...
   ====================================
   🏥 Testing health endpoint...
   ✅ Server is running and healthy

   📡 Connecting to server...
   📊 Status Code: 200
   ✅ API Test Successful!

   📋 Response Details:
      Message: Backend is connected and working!
      Server: Express.js with MVC Architecture
      User: user@example.com (firebase-user-id)
      Database: MongoDB
      Architecture: MVC Pattern
      Environment: development
      Timestamp: 2023-12-01T11:30:00.000Z

   🎉 Your Chrome extension should now be able to connect!
   ```

## 📍 Endpoint Details

### GET /api/test

**URL:** `http://localhost:5000/api/test`

**Headers Required:**

```
Authorization: Bearer YOUR_FIREBASE_ID_TOKEN
Content-Type: application/json
```

**Response Format:**

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

## 🔧 Integration with Chrome Extension

Your Chrome extension should make a request like this:

```javascript
// In your Chrome extension background script or popup
async function testBackendConnection() {
  try {
    // Get current user's Firebase ID token
    const user = firebase.auth().currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const idToken = await user.getIdToken();

    // Make request to backend
    const response = await fetch("http://localhost:5000/api/test", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.success) {
      console.log("✅ Backend connected:", data.message);
      return true;
    } else {
      console.error("❌ Backend test failed:", data.error);
      return false;
    }
  } catch (error) {
    console.error("❌ Connection error:", error);
    return false;
  }
}

// Usage in popup or background script
testBackendConnection().then((isConnected) => {
  if (isConnected) {
    // Show success message in extension UI
    showMessage("✅ Backend connected!", "success");
  } else {
    // Show error message in extension UI
    showMessage("❌ Backend connection failed", "error");
  }
});
```

## 🔍 Troubleshooting

### Common Issues:

1. **"❌ Backend connection failed"**

   - Check if server is running: `curl http://localhost:5000/health`
   - Verify port 5000 is not blocked
   - Check Chrome extension permissions

2. **"No valid token provided"**

   - Make sure user is logged into Chrome extension
   - Verify Firebase is properly initialized in extension
   - Check if ID token is being sent correctly

3. **"Token verification failed"**

   - Verify Firebase project IDs match between extension and backend
   - Check Firebase service account key is correct
   - Try logging out and back into extension

4. **CORS errors**
   - Server has CORS enabled by default
   - Check browser console for detailed error messages

### Debug Steps:

1. **Test server health:**

   ```bash
   curl http://localhost:5000/health
   ```

2. **Check server logs:**

   ```bash
   npm run dev
   # Look for log messages when testing
   ```

3. **Test with manual token:**

   ```bash
   # Get token from extension first, then:
   node test-api-connection.js YOUR_TOKEN_HERE
   ```

4. **Verify all endpoints:**
   ```bash
   curl http://localhost:5000/
   # Shows all available endpoints
   ```

## ✅ Success Indicators

When everything works correctly:

**Terminal Output:**

```
[INFO] 2023-12-01T11:30:00.000Z - Server running on http://localhost:5000
[INFO] 2023-12-01T11:30:00.000Z - Test endpoint called by: user@example.com
```

**Chrome Extension:**

- "Test API" button shows green checkmark
- Message: "✅ Backend connected!"
- No console errors in browser DevTools

**Ready for Production:**
Once this test passes, your Chrome extension can safely use all other API endpoints (`/api/snippets`, etc.) with the same authentication pattern!
