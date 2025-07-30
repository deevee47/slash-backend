/**
 * Test script for the Slash Backend API
 * This script demonstrates how to test the API endpoints
 *
 * To run this test, you need a valid Firebase ID token
 * Usage: node test-api.js YOUR_FIREBASE_ID_TOKEN
 */

const http = require("http");

const BASE_URL = "http://localhost:5000";

// Get Firebase ID token from command line arguments
const idToken = process.argv[2];

if (!idToken) {
  console.error("Usage: node test-api.js YOUR_FIREBASE_ID_TOKEN");
  console.error("\nTo get a Firebase ID token:");
  console.error("1. Open your browser console on a page with Firebase auth");
  console.error(
    "2. Run: firebase.auth().currentUser.getIdToken().then(console.log)"
  );
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

// Test functions
async function testHealthCheck() {
  console.log("\n🔍 Testing health check...");
  try {
    const response = await makeRequest("GET", "/health");
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Response:`, response.data);
  } catch (error) {
    console.error("❌ Health check failed:", error.message);
  }
}

async function testGetSnippets() {
  console.log("\n📋 Testing GET /api/snippets...");
  try {
    const response = await makeRequest("GET", "/api/snippets");
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Response:`, response.data);
    return response.data.snippets || [];
  } catch (error) {
    console.error("❌ Get snippets failed:", error.message);
    return [];
  }
}

async function testCreateSnippet() {
  console.log("\n➕ Testing POST /api/snippets...");
  const testSnippet = {
    keyword: "/test-email",
    value: "test@example.com",
  };

  try {
    const response = await makeRequest("POST", "/api/snippets", testSnippet);
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Response:`, response.data);
    return response.data.snippet;
  } catch (error) {
    console.error("❌ Create snippet failed:", error.message);
    return null;
  }
}

async function testIncrementUsage(snippetId) {
  console.log(`\n📈 Testing POST /api/snippets/${snippetId}/usage...`);
  try {
    const response = await makeRequest(
      "POST",
      `/api/snippets/${snippetId}/usage`
    );
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Response:`, response.data);
  } catch (error) {
    console.error("❌ Increment usage failed:", error.message);
  }
}

async function testDeleteSnippet(snippetId) {
  console.log(`\n🗑️ Testing DELETE /api/snippets/${snippetId}...`);
  try {
    const response = await makeRequest("DELETE", `/api/snippets/${snippetId}`);
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Response:`, response.data);
  } catch (error) {
    console.error("❌ Delete snippet failed:", error.message);
  }
}

// Run all tests
async function runTests() {
  console.log("🧪 Starting API Tests...");
  console.log("========================================");

  // Test health check (no auth required)
  await testHealthCheck();

  // Test authenticated endpoints
  console.log("\n🔐 Testing authenticated endpoints...");

  // Get initial snippets
  const initialSnippets = await testGetSnippets();

  // Create a new snippet
  const newSnippet = await testCreateSnippet();

  if (newSnippet && newSnippet.id) {
    // Test usage increment
    await testIncrementUsage(newSnippet.id);

    // Get snippets again to see the updated usage
    console.log("\n📋 Getting snippets after usage increment...");
    await testGetSnippets();

    // Delete the test snippet
    await testDeleteSnippet(newSnippet.id);

    // Final check
    console.log("\n📋 Final snippets check...");
    await testGetSnippets();
  }

  console.log("\n✨ Tests completed!");
}

// Check if server is running first
async function checkServerStatus() {
  try {
    const response = await makeRequest("GET", "/health");
    if (response.status === 200) {
      console.log("✅ Server is running at http://localhost:5000");
      return true;
    }
  } catch (error) {
    console.error("❌ Server is not running at http://localhost:5000");
    console.error("   Please start the server with: npm start");
    return false;
  }
}

// Main execution
async function main() {
  console.log("🚀 Slash Backend API Test Suite");
  console.log("================================");

  const serverRunning = await checkServerStatus();
  if (serverRunning) {
    await runTests();
  }
}

main().catch(console.error);
