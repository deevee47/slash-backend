const admin = require("firebase-admin");
const path = require("path");
require("dotenv").config();

let initialized = false;

/**
 * Initialize Firebase Admin SDK
 */
const initialize = () => {
  if (initialized) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    try {
      // Check if service account key file exists, otherwise use default credentials
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

      if (serviceAccountPath) {
        const serviceAccount = require(path.resolve(serviceAccountPath));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else {
        // Use default credentials (for local development with gcloud auth or deployed environments)
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
