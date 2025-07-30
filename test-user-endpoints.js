/**
 * Test script for user endpoints
 * Usage: node test-user-endpoints.js YOUR_FIREBASE_ID_TOKEN
 */

const http = require("http");

const BASE_URL = "http://localhost:5000";

// Get Firebase ID token from command line arguments
const idToken = process.argv[2];

if (!idToken) {
  console.error("❌ Usage: node test-user-endpoints.js YOUR_FIREBASE_ID_TOKEN");
  console.error("\nTo get a Firebase ID token:");
  console.error("1. Open your Chrome extension and login");
  console.error("2. Open Chrome DevTools > Console");
  console.error(
    "3. Run: chrome.runtime.sendMessage({ type: 'GET_USER' }, console.log)"
  );
  console.error("4. Copy the ID token from the response");
  process.exit(1);
}

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 5000,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (err) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testUserSync() {
  console.log("\n👤 Testing POST /api/user/sync...");

  const userData = {
    uid: "test-user-123",
    email: "test@example.com",
    displayName: "Test User",
    photoURL: "https://example.com/photo.jpg",
    lastLoginAt: new Date().toISOString(),
  };

  try {
    const response = await makeRequest("POST", "/api/user/sync", userData);
    console.log(`📊 Status: ${response.status}`);

    if (response.status === 200 && response.data.success) {
      console.log("✅ User sync successful!");
      console.log(`   User: ${response.data.user.email}`);
      console.log(`   UID: ${response.data.user.uid}`);
      console.log(`   Created: ${response.data.user.createdAt}`);
      return response.data.user;
    } else {
      console.error("❌ User sync failed!");
      console.error("Response:", JSON.stringify(response.data, null, 2));
      return null;
    }
  } catch (error) {
    console.error("❌ User sync error:", error.message);
    return null;
  }
}

async function testUserProfile() {
  console.log("\n📋 Testing GET /api/user/profile...");

  try {
    const response = await makeRequest("GET", "/api/user/profile");
    console.log(`📊 Status: ${response.status}`);

    if (response.status === 200 && response.data.success) {
      console.log("✅ User profile retrieved!");
      console.log(`   Email: ${response.data.user.email}`);
      console.log(`   Display Name: ${response.data.user.displayName}`);
      console.log(`   Last Login: ${response.data.user.lastLoginAt}`);
      return response.data.user;
    } else {
      console.error("❌ User profile failed!");
      console.error("Response:", JSON.stringify(response.data, null, 2));
      return null;
    }
  } catch (error) {
    console.error("❌ User profile error:", error.message);
    return null;
  }
}

async function testUserStats() {
  console.log("\n📊 Testing GET /api/user/stats...");

  try {
    const response = await makeRequest("GET", "/api/user/stats");
    console.log(`📊 Status: ${response.status}`);

    if (response.status === 200 && response.data.success) {
      console.log("✅ User stats retrieved!");
      console.log(`   Member Since: ${response.data.stats.memberSince}`);
      console.log(`   Last Login: ${response.data.stats.lastLogin}`);
      return response.data.stats;
    } else {
      console.error("❌ User stats failed!");
      console.error("Response:", JSON.stringify(response.data, null, 2));
      return null;
    }
  } catch (error) {
    console.error("❌ User stats error:", error.message);
    return null;
  }
}

async function testUpdateLogin() {
  console.log("\n🔄 Testing PUT /api/user/login...");

  try {
    const response = await makeRequest("PUT", "/api/user/login");
    console.log(`📊 Status: ${response.status}`);

    if (response.status === 200 && response.data.success) {
      console.log("✅ Last login updated!");
      console.log(`   New Last Login: ${response.data.lastLoginAt}`);
      return response.data;
    } else {
      console.error("❌ Update login failed!");
      console.error("Response:", JSON.stringify(response.data, null, 2));
      return null;
    }
  } catch (error) {
    console.error("❌ Update login error:", error.message);
    return null;
  }
}

// Test health endpoint first (no auth required)
async function testHealthEndpoint() {
  console.log("🏥 Testing health endpoint...");
  try {
    const response = await makeRequest("GET", "/health");
    if (response.status === 200) {
      console.log("✅ Server is running and healthy");
      return true;
    } else {
      console.error("❌ Health check failed");
      return false;
    }
  } catch (error) {
    console.error("❌ Server is not running at http://localhost:5000");
    console.error("   Please start the server with: npm start");
    return false;
  }
}

async function main() {
  console.log("🚀 User Endpoints Test Suite");
  console.log("============================");

  // Test health first
  const serverRunning = await testHealthEndpoint();
  if (!serverRunning) {
    process.exit(1);
  }

  console.log("\n🔐 Testing user endpoints...");

  // Note: This test uses a mock user ID since we're testing with a real Firebase token
  // In practice, the Firebase token would contain the actual user's UID

  // Test user sync (creates or updates user)
  const syncResult = await testUserSync();

  // Test user profile
  const profileResult = await testUserProfile();

  // Test user stats
  const statsResult = await testUserStats();

  // Test update last login
  const loginResult = await testUpdateLogin();

  console.log("\n📝 Test Summary:");
  console.log(`   User Sync: ${syncResult ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`   User Profile: ${profileResult ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`   User Stats: ${statsResult ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`   Update Login: ${loginResult ? "✅ PASS" : "❌ FAIL"}`);

  if (syncResult && profileResult && statsResult && loginResult) {
    console.log("\n🎉 All user endpoint tests passed!");
    console.log("Your Chrome extension can now sync user data on login!");
  } else {
    console.log("\n⚠️  Some tests failed. Check the errors above.");
  }
}

main().catch(console.error);
