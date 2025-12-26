const admin = require("firebase-admin");
const path = require("path");
require("dotenv").config();

let initialized = false;

/**
 * Initialize Firebase Admin SDK
 * Supports three methods:
 * 1. File path (FIREBASE_SERVICE_ACCOUNT_KEY=./serviceAccountKey.json)
 * 2. JSON string (FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}')
 * 3. Application Default Credentials (no env var, uses gcloud auth)
 */
const initialize = () => {
  if (initialized) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    try {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

      if (serviceAccountKey) {
        let serviceAccount;

        // Check if it's a JSON string or file path
        if (serviceAccountKey.startsWith('{')) {
          // It's a JSON string (for production)
          try {
            serviceAccount = JSON.parse(serviceAccountKey);
            console.log("Using Firebase credentials from JSON string");
          } catch (parseError) {
            throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY as JSON: ${parseError.message}`);
          }
        } else {
          // It's a file path (for local development)
          try {
            serviceAccount = require(path.resolve(serviceAccountKey));
            console.log(`Using Firebase credentials from file: ${serviceAccountKey}`);
          } catch (fileError) {
            throw new Error(`Failed to load Firebase service account from file: ${fileError.message}`);
          }
        }

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else {
        // Use default credentials (for GCP deployments with Application Default Credentials)
        console.log("Using Firebase Application Default Credentials");
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
      }

      initialized = true;
      console.log("Firebase Admin SDK initialized successfully");
      resolve();
    } catch (error) {
      console.error("Error initializing Firebase Admin SDK:", error);
      reject(error);
    }
  });
};

/**
 * Get Firebase Auth instance
 */
const getAuth = () => {
  if (!initialized) {
    throw new Error("Firebase not initialized. Call initialize() first.");
  }
  return admin.auth();
};

module.exports = {
  initialize,
  getAuth,
};
