/**
 * Simple test script to verify the /api/test endpoint
 * Usage: node test-api-connection.js YOUR_FIREBASE_ID_TOKEN
 */

const http = require("http");

const BASE_URL = "http://localhost:5000";

// Get Firebase ID token from command line arguments
const idToken = process.argv[2];

if (!idToken) {
  console.error("❌ Usage: node test-api-connection.js YOUR_FIREBASE_ID_TOKEN");
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

async function testApiConnection() {
  console.log("🧪 Testing /api/test endpoint...");
  console.log("====================================");

  try {
    console.log("📡 Connecting to server...");
    const response = await makeRequest("GET", "/api/test");

    console.log(`📊 Status Code: ${response.status}`);

    if (response.status === 200 && response.data.success) {
      console.log("✅ API Test Successful!");
      console.log("\n📋 Response Details:");
      console.log(`   Message: ${response.data.message}`);
      console.log(`   Server: ${response.data.server}`);
      console.log(
        `   User: ${response.data.user.email} (${response.data.user.uid})`
      );
      console.log(`   Database: ${response.data.database}`);
      console.log(`   Architecture: ${response.data.architecture}`);
      console.log(`   Environment: ${response.data.environment}`);
      console.log(`   Timestamp: ${response.data.timestamp}`);

      console.log("\n🎉 Your Chrome extension should now be able to connect!");
    } else {
      console.error("❌ API Test Failed!");
      console.error("Response:", JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.error("❌ Connection Failed:", error.message);

    if (error.code === "ECONNREFUSED") {
      console.error("\n💡 Troubleshooting:");
      console.error("1. Make sure your server is running: npm start");
      console.error("2. Check if it's running on port 5000");
      console.error("3. Try: curl http://localhost:5000/health");
    }
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
  console.log("🚀 API Connection Test Suite");
  console.log("============================");

  // Test health first
  const serverRunning = await testHealthEndpoint();
  if (!serverRunning) {
    process.exit(1);
  }

  console.log("");

  // Test authenticated endpoint
  await testApiConnection();
}

main().catch(console.error);
