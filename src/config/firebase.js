const admin = require("firebase-admin");
const path = require("path");
require("dotenv").config();

class FirebaseConfig {
  constructor() {
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) {
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

        this.initialized = true;
        console.log("Firebase Admin SDK initialized successfully");
        resolve();
      } catch (error) {
        console.error("Error initializing Firebase Admin SDK:", error);
        reject(error);
      }
    });
  }

  getAuth() {
    if (!this.initialized) {
      throw new Error("Firebase not initialized. Call initialize() first.");
    }
    return admin.auth();
  }
}

module.exports = new FirebaseConfig();
