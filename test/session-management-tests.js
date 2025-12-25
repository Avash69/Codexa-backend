/**
 * Session Management Testing Script
 *
 * This file contains comprehensive tests for session management functionality
 * including session creation, session logging, logout, and graceful shutdown
 * Run with: node test/session-management-tests.js
 */

import fetch from "node-fetch";

const API_BASE_URL = "http://localhost:5001/api";
const BASE_URL = "http://localhost:5001";

// Test configurations
const testConfig = {
  testUser: {
    name: "Session Test User",
    email: `session-test-${Date.now()}@example.com`,
    password: "sessiontest123",
  },
  testUser2: {
    name: "Session Test User 2",
    email: `session-test-2-${Date.now()}@example.com`,
    password: "sessiontest123",
  },
};

let authToken = null;
let authToken2 = null;

/**
 * Test helper functions
 */
const logTest = (testName, status, message) => {
  const statusIcon = status === "PASS" ? "✅" : "❌";
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${statusIcon} ${testName}: ${message}`);
};

const makeRequest = async (endpoint, options = {}) => {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.token && { Authorization: `Bearer ${options.token}` }),
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();
  return { response, data };
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Test functions
 */
const testServerHealth = async () => {
  try {
    const { response, data } = await makeRequest(`${BASE_URL}/health`);

    if (response.ok && data.status === "OK") {
      logTest(
        "Server Health",
        "PASS",
        "Server is healthy and ready for testing"
      );
      return true;
    } else {
      logTest(
        "Server Health",
        "FAIL",
        `Server responded with: ${data.message}`
      );
      return false;
    }
  } catch (error) {
    logTest("Server Health", "FAIL", `Error: ${error.message}`);
    return false;
  }
};

const testUserRegistration = async (
  userConfig,
  testName = "User Registration"
) => {
  try {
    const { response, data } = await makeRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(userConfig),
    });

    if (response.ok && data.status === "success") {
      logTest(
        testName,
        "PASS",
        `User registered successfully: ${userConfig.email}`
      );
      return data.token;
    } else {
      logTest(testName, "FAIL", `Registration failed: ${data.message}`);
      return null;
    }
  } catch (error) {
    logTest(testName, "FAIL", `Error: ${error.message}`);
    return null;
  }
};

const testUserLogin = async (userConfig, testName = "User Login") => {
  try {
    const { response, data } = await makeRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: userConfig.email,
        password: userConfig.password,
      }),
    });

    if (response.ok && data.status === "success") {
      logTest(
        testName,
        "PASS",
        `User logged in successfully: ${userConfig.email}`
      );
      return data.token;
    } else {
      logTest(testName, "FAIL", `Login failed: ${data.message}`);
      return null;
    }
  } catch (error) {
    logTest(testName, "FAIL", `Error: ${error.message}`);
    return null;
  }
};

const testMultipleLogins = async () => {
  try {
    console.log("\n🔄 Testing Multiple Login Sessions...");

    // Login from different "devices"
    const loginPromises = [];
    const devices = ["Chrome-Desktop", "Firefox-Desktop", "Safari-Mobile"];

    for (let i = 0; i < devices.length; i++) {
      loginPromises.push(
        makeRequest("/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email: testConfig.testUser.email,
            password: testConfig.testUser.password,
          }),
          headers: {
            "User-Agent": devices[i],
            "Content-Type": "application/json",
          },
        })
      );
    }

    const results = await Promise.all(loginPromises);
    let successCount = 0;

    for (let i = 0; i < results.length; i++) {
      const { response, data } = results[i];
      if (response.ok && data.status === "success") {
        successCount++;
        logTest(
          `Multiple Sessions ${i + 1}`,
          "PASS",
          `Login from ${devices[i]} successful`
        );
      } else {
        logTest(
          `Multiple Sessions ${i + 1}`,
          "FAIL",
          `Login from ${devices[i]} failed: ${data.message}`
        );
      }
    }

    if (successCount === devices.length) {
      logTest(
        "Multiple Sessions",
        "PASS",
        `All ${devices.length} login sessions created successfully`
      );
      return true;
    } else {
      logTest(
        "Multiple Sessions",
        "FAIL",
        `Only ${successCount}/${devices.length} sessions created`
      );
      return false;
    }
  } catch (error) {
    logTest("Multiple Sessions", "FAIL", `Error: ${error.message}`);
    return false;
  }
};

const testSessionValidation = async () => {
  try {
    console.log("\n🔍 Testing Session Validation...");

    // Test with valid token
    const { response, data } = await makeRequest("/profile", {
      token: authToken,
    });

    if (response.ok && data.status === "success") {
      logTest(
        "Session Validation",
        "PASS",
        "Valid session authenticated successfully"
      );
      return true;
    } else {
      logTest(
        "Session Validation",
        "FAIL",
        `Session validation failed: ${data.message}`
      );
      return false;
    }
  } catch (error) {
    logTest("Session Validation", "FAIL", `Error: ${error.message}`);
    return false;
  }
};

const testInvalidSessionHandling = async () => {
  try {
    console.log("\n🚫 Testing Invalid Session Handling...");

    // Test with invalid token
    const { response, data } = await makeRequest("/profile", {
      token: "invalid-token-12345",
    });

    if (response.status === 401) {
      logTest("Invalid Session", "PASS", "Invalid session properly rejected");
      return true;
    } else {
      logTest(
        "Invalid Session",
        "FAIL",
        `Expected 401, got ${response.status}`
      );
      return false;
    }
  } catch (error) {
    logTest("Invalid Session", "FAIL", `Error: ${error.message}`);
    return false;
  }
};

const testLogout = async () => {
  try {
    console.log("\n🚪 Testing Logout Functionality...");

    // Create a new session for logout test
    const logoutToken = await testUserLogin(
      testConfig.testUser,
      "Logout Test Login"
    );
    if (!logoutToken) {
      logTest(
        "Logout Test",
        "FAIL",
        "Could not create session for logout test"
      );
      return false;
    }

    // Wait a moment to ensure session is established
    await delay(1000);

    // Test logout
    const { response, data } = await makeRequest("/auth/logout", {
      method: "POST",
      token: logoutToken,
    });

    if (response.ok && data.status === "success") {
      logTest(
        "Logout",
        "PASS",
        "User logged out successfully with session end logging"
      );

      // Test that the token is now invalid
      const { response: testResponse } = await makeRequest("/profile", {
        token: logoutToken,
      });

      if (testResponse.status === 401) {
        logTest(
          "Post-Logout Validation",
          "PASS",
          "Token properly invalidated after logout"
        );
        return true;
      } else {
        logTest(
          "Post-Logout Validation",
          "FAIL",
          "Token still valid after logout"
        );
        return false;
      }
    } else {
      logTest("Logout", "FAIL", `Logout failed: ${data.message}`);
      return false;
    }
  } catch (error) {
    logTest("Logout", "FAIL", `Error: ${error.message}`);
    return false;
  }
};

const testSessionDuration = async () => {
  try {
    console.log("\n⏱️ Testing Session Duration Tracking...");

    // Create a session and keep it active for a few seconds
    const durationToken = await testUserLogin(
      testConfig.testUser,
      "Duration Test Login"
    );
    if (!durationToken) {
      logTest(
        "Session Duration",
        "FAIL",
        "Could not create session for duration test"
      );
      return false;
    }

    // Wait 3 seconds to simulate session activity
    await delay(3000);

    // Make a request to keep session active
    await makeRequest("/profile", { token: durationToken });

    // Wait another 2 seconds
    await delay(2000);

    // Logout to trigger session end logging
    const { response, data } = await makeRequest("/auth/logout", {
      method: "POST",
      token: durationToken,
    });

    if (response.ok && data.status === "success") {
      logTest(
        "Session Duration",
        "PASS",
        "Session duration tracking completed (check console logs)"
      );
      return true;
    } else {
      logTest(
        "Session Duration",
        "FAIL",
        `Duration test failed: ${data.message}`
      );
      return false;
    }
  } catch (error) {
    logTest("Session Duration", "FAIL", `Error: ${error.message}`);
    return false;
  }
};

const testConcurrentSessions = async () => {
  try {
    console.log("\n👥 Testing Concurrent Session Management...");

    // Create multiple sessions for the same user
    const concurrentTokens = [];
    for (let i = 0; i < 3; i++) {
      const token = await testUserLogin(
        testConfig.testUser,
        `Concurrent Session ${i + 1}`
      );
      if (token) {
        concurrentTokens.push(token);
      }
    }

    if (concurrentTokens.length === 3) {
      logTest(
        "Concurrent Sessions",
        "PASS",
        "Multiple concurrent sessions created successfully"
      );

      // Test that all sessions are valid
      const validationPromises = concurrentTokens.map((token, index) =>
        makeRequest("/profile", { token })
      );

      const validationResults = await Promise.all(validationPromises);
      const validSessions = validationResults.filter(
        ({ response }) => response.ok
      ).length;

      if (validSessions === concurrentTokens.length) {
        logTest(
          "Concurrent Session Validation",
          "PASS",
          `All ${concurrentTokens.length} sessions are valid`
        );
        return true;
      } else {
        logTest(
          "Concurrent Session Validation",
          "FAIL",
          `Only ${validSessions}/${concurrentTokens.length} sessions are valid`
        );
        return false;
      }
    } else {
      logTest(
        "Concurrent Sessions",
        "FAIL",
        `Only ${concurrentTokens.length}/3 sessions created`
      );
      return false;
    }
  } catch (error) {
    logTest("Concurrent Sessions", "FAIL", `Error: ${error.message}`);
    return false;
  }
};

/**
 * Main test runner
 */
const runSessionTests = async () => {
  console.log("🧪 Starting Session Management Tests...\n");
  console.log("=".repeat(60));
  console.log("SESSION MANAGEMENT COMPREHENSIVE TEST SUITE");
  console.log("=".repeat(60));

  // Test server health first
  const serverHealthy = await testServerHealth();
  if (!serverHealthy) {
    console.log("\n❌ Server is not healthy. Please start the server first.");
    process.exit(1);
  }

  console.log("\n📝 Setting up test users...");

  // Register test users
  authToken = await testUserRegistration(
    testConfig.testUser,
    "Test User 1 Registration"
  );
  if (!authToken) {
    // Try to login instead
    authToken = await testUserLogin(testConfig.testUser, "Test User 1 Login");
  }

  authToken2 = await testUserRegistration(
    testConfig.testUser2,
    "Test User 2 Registration"
  );
  if (!authToken2) {
    // Try to login instead
    authToken2 = await testUserLogin(testConfig.testUser2, "Test User 2 Login");
  }

  if (!authToken || !authToken2) {
    console.log("\n❌ Could not set up test users. Tests stopped.");
    process.exit(1);
  }

  console.log("\n🎯 Running session management tests...");

  // Run session tests
  await testSessionValidation();
  await testInvalidSessionHandling();
  await testMultipleLogins();
  await testConcurrentSessions();
  await testSessionDuration();
  await testLogout();

  console.log("\n🏁 Session Management Tests completed!");
  console.log("\n💡 To test graceful shutdown:");
  console.log("   1. Keep the server running");
  console.log("   2. Press Ctrl+C to trigger graceful shutdown");
  console.log("   3. Check console logs for session end logging");

  process.exit(0);
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSessionTests();
}

export {
  runSessionTests,
  testConcurrentSessions,
  testInvalidSessionHandling,
  testLogout,
  testMultipleLogins,
  testSessionDuration,
  testSessionValidation,
};
