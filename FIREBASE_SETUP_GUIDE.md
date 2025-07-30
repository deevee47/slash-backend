# Firebase Setup Guide for quick-type-6507d

This guide helps you set up Firebase Admin SDK for your Express backend to work with your Chrome extension.

## 🎯 Your Firebase Project Details

**Project ID:** `quick-type-6507d`
**Auth Domain:** `quick-type-6507d.firebaseapp.com`
**Console URL:** https://console.firebase.google.com/project/quick-type-6507d

## 🔑 Step 1: Download Service Account Key

1. **Go to Firebase Console:**

   ```
   https://console.firebase.google.com/project/quick-type-6507d/settings/serviceaccounts/adminsdk
   ```

2. **Generate New Private Key:**

   - Click "Generate new private key"
   - Download the JSON file (it will be named something like `quick-type-6507d-firebase-adminsdk-xxxxx.json`)

3. **Place in Your Project:**
   ```bash
   # Move the downloaded file to your project root
   mv ~/Downloads/quick-type-6507d-firebase-adminsdk-*.json ./serviceAccountKey.json
   ```

## 🔧 Step 2: Configure Environment

1. **Create .env file:**

   ```bash
   cp env.example .env
   ```

2. **Edit .env file:**
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/slash-backend
   FIREBASE_PROJECT_ID=quick-type-6507d
   FIREBASE_SERVICE_ACCOUNT_KEY=./serviceAccountKey.json
   NODE_ENV=development
   ```

## 🚀 Step 3: Test Configuration

1. **Start your server:**

   ```bash
   npm run dev
   ```

2. **Test health endpoint:**

   ```bash
   curl http://localhost:5000/health
   ```

   Should return:

   ```json
   {
     "success": true,
     "message": "Server is running",
     "database": "connected"
   }
   ```

3. **Test with Chrome extension:**
   - Open your Chrome extension
   - Login with Google
   - Click "Test API" button
   - Should show: "✅ Backend connected!"

## 🔍 Verification Commands

### Check Firebase Project ID

```bash
# Your backend should log this on startup
grep "Firebase Admin SDK initialized" your-server-logs
```

### Test Authentication

```bash
# This should work after you get an ID token from your extension
node test-api-connection.js YOUR_FIREBASE_ID_TOKEN
```

### Verify Project Match

Your Chrome extension uses:

- **Project ID:** `quick-type-6507d`
- **Auth Domain:** `quick-type-6507d.firebaseapp.com`

Your backend should use the same project ID in the service account key.

## 📋 Service Account Key Structure

Your downloaded service account key should look like this:

```json
{
  "type": "service_account",
  "project_id": "quick-type-6507d",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@quick-type-6507d.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40quick-type-6507d.iam.gserviceaccount.com"
}
```

**Important:** The `project_id` must be `quick-type-6507d` to match your extension.

## 🛠 Troubleshooting

### Error: "Project not found"

- Make sure you downloaded the service account key from the correct project
- Verify the `project_id` in the JSON file is `quick-type-6507d`

### Error: "Token verification failed"

- Ensure both extension and backend use the same Firebase project
- Check that the service account key is valid and not corrupted

### Error: "No valid token provided"

- Make sure you're logged into the Chrome extension
- Verify the extension is sending the Authorization header

### Debug Mode

Add this to see detailed Firebase logs:

```javascript
// In your server.js or src/config/firebase.js
process.env.DEBUG = "firebase-admin:*";
```

## ✅ Success Checklist

- [ ] Downloaded service account key from correct project (`quick-type-6507d`)
- [ ] Placed key file in project root as `serviceAccountKey.json`
- [ ] Updated `.env` file with correct settings
- [ ] Server starts without Firebase errors
- [ ] Health endpoint responds successfully
- [ ] Chrome extension can authenticate and call `/api/test`
- [ ] No CORS errors in browser console

## 🔒 Security Notes

1. **Never commit the service account key to version control**

   ```bash
   # Already in .gitignore
   echo "serviceAccountKey.json" >> .gitignore
   ```

2. **Use environment variables in production**

   ```env
   # Instead of file path, use the JSON content as env var
   FIREBASE_SERVICE_ACCOUNT_KEY_JSON='{"type":"service_account",...}'
   ```

3. **Restrict service account permissions**
   - Only grant necessary Firebase Admin permissions
   - Don't use owner-level service accounts

## 🎉 Next Steps

Once Firebase is working:

1. Test all API endpoints with your Chrome extension
2. Implement snippet CRUD operations
3. Deploy to production with proper environment variables
4. Set up monitoring and logging

Your backend is now ready to authenticate users from your `quick-type-6507d` Chrome extension! 🚀
