/**
 * Graceful Shutdown Test
 *
 * This script tests the graceful shutdown functionality of the server
 * It creates active sessions and then terminates the server to check
 * if proper session cleanup is performed.
 */

import { spawn } from "child_process";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE_URL = "http://localhost:5001/api";

// Test helper
const logTest = (message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
};

const makeRequest = async (endpoint, options = {}) => {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    return { response, data };
  } catch (error) {
    return { error };
  }
};

const testGracefulShutdown = async () => {
  console.log("🔄 Testing Graceful Shutdown Functionality...\n");

  // Start the server
  logTest("🚀 Starting server...");
  const serverProcess = spawn("node", ["src/index.js"], {
    cwd: path.join(__dirname, ".."),
    stdio: ["inherit", "pipe", "pipe"],
  });

  // Wait for server to start
  await new Promise((resolve) => {
    serverProcess.stdout.on("data", (data) => {
      if (data.toString().includes("Server running")) {
        logTest("✅ Server started successfully");
        resolve();
      }
    });
  });

  // Wait a bit more for full initialization
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Create some active sessions
  logTest("👤 Creating active sessions...");
  const testUser = {
    name: "Graceful Test User",
    email: `graceful-test-${Date.now()}@example.com`,
    password: "gracefultest123",
  };

  // Register user
  const { response: regResponse, data: regData } = await makeRequest(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify(testUser),
    }
  );

  if (regResponse?.ok) {
    logTest("✅ Test user registered successfully");
  } else {
    logTest("❌ Failed to register test user");
    serverProcess.kill("SIGTERM");
    return;
  }

  // Create multiple sessions
  const sessions = [];
  for (let i = 0; i < 3; i++) {
    const { response: loginResponse, data: loginData } = await makeRequest(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      }
    );

    if (loginResponse?.ok) {
      sessions.push(loginData.token);
      logTest(`✅ Session ${i + 1} created successfully`);
    }
  }

  logTest(`📊 Created ${sessions.length} active sessions`);

  // Let sessions run for a moment
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Test graceful shutdown
  logTest("🛑 Triggering graceful shutdown (SIGTERM)...");

  // Listen for server output during shutdown
  serverProcess.stdout.on("data", (data) => {
    const output = data.toString();
    if (
      output.includes("SESSION ENDED") ||
      output.includes("Graceful shutdown")
    ) {
      logTest(`📝 Server log: ${output.trim()}`);
    }
  });

  serverProcess.stderr.on("data", (data) => {
    logTest(`🚨 Server error: ${data.toString().trim()}`);
  });

  // Send SIGTERM for graceful shutdown
  serverProcess.kill("SIGTERM");

  // Wait for shutdown to complete
  await new Promise((resolve) => {
    serverProcess.on("exit", (code, signal) => {
      logTest(`✅ Server exited with code ${code} and signal ${signal}`);
      resolve();
    });
  });

  logTest("🏁 Graceful shutdown test completed!");
  logTest("💡 Check the server logs above for session cleanup details");
};

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testGracefulShutdown().catch(console.error);
}

export { testGracefulShutdown };
