/**
 * API Testing Script
 *
 * This file contains functions to test the API endpoints
 * Run with: node test/api-tests.js
 */

import fetch from "node-fetch";

const API_BASE_URL = "http://localhost:5001/api";
const BASE_URL = "http://localhost:5001";

// Test configurations
const testConfig = {
  testUser: {
    name: "Test User",
    email: `test${Date.now()}@example.com`, // Use timestamp to make email unique
    password: "testpassword123",
  },
};

let authToken = null;

/**
 * Test helper functions
 */
const logTest = (testName, status, message) => {
  const statusIcon = status === "PASS" ? "✅" : "❌";
  console.log(`${statusIcon} ${testName}: ${message}`);
};

const makeRequest = async (endpoint, options = {}) => {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();
  return { response, data };
};

/**
 * Test functions
 */
const testServerHealth = async () => {
  try {
    const { response, data } = await makeRequest(`${BASE_URL}/health`);

    if (response.ok && data.status === "OK") {
      logTest("Server Health", "PASS", "Server is healthy");
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

const testUserRegistration = async () => {
  try {
    const { response, data } = await makeRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(testConfig.testUser),
    });

    if (response.ok && data.status === "success") {
      authToken = data.token;
      logTest("User Registration", "PASS", "User registered successfully");
      return true;
    } else {
      logTest(
        "User Registration",
        "FAIL",
        `Registration failed: ${data.message}`
      );
      return false;
    }
  } catch (error) {
    logTest("User Registration", "FAIL", `Error: ${error.message}`);
    return false;
  }
};

const testUserLogin = async () => {
  try {
    const { response, data } = await makeRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: testConfig.testUser.email,
        password: testConfig.testUser.password,
      }),
    });

    if (response.ok && data.status === "success") {
      authToken = data.token;
      logTest("User Login", "PASS", "User logged in successfully");
      return true;
    } else {
      logTest("User Login", "FAIL", `Login failed: ${data.message}`);
      return false;
    }
  } catch (error) {
    logTest("User Login", "FAIL", `Error: ${error.message}`);
    return false;
  }
};

const testGetProfile = async () => {
  try {
    const { response, data } = await makeRequest("/profile");

    if (response.ok && data.status === "success") {
      logTest("Get Profile", "PASS", "Profile retrieved successfully");
      return true;
    } else {
      logTest(
        "Get Profile",
        "FAIL",
        `Profile retrieval failed: ${data.message}`
      );
      return false;
    }
  } catch (error) {
    logTest("Get Profile", "FAIL", `Error: ${error.message}`);
    return false;
  }
};

const testUpdateProfile = async () => {
  try {
    const updateData = {
      firstName: "Updated",
      lastName: "Name",
      bio: "This is a test bio",
      skill: "JavaScript, Node.js",
      workExperience: "1-2 years",
    };

    const { response, data } = await makeRequest("/profile", {
      method: "PUT",
      body: JSON.stringify(updateData),
    });

    if (response.ok && data.status === "success") {
      logTest("Update Profile", "PASS", "Profile updated successfully");
      return true;
    } else {
      logTest(
        "Update Profile",
        "FAIL",
        `Profile update failed: ${data.message}`
      );
      return false;
    }
  } catch (error) {
    logTest("Update Profile", "FAIL", `Error: ${error.message}`);
    return false;
  }
};

const testChangePassword = async () => {
  try {
    const passwordData = {
      oldPassword: testConfig.testUser.password,
      newPassword: "newpassword123",
    };

    const { response, data } = await makeRequest("/profile/password", {
      method: "PUT",
      body: JSON.stringify(passwordData),
    });

    if (response.ok && data.status === "success") {
      logTest("Change Password", "PASS", "Password changed successfully");
      return true;
    } else {
      logTest(
        "Change Password",
        "FAIL",
        `Password change failed: ${data.message}`
      );
      return false;
    }
  } catch (error) {
    logTest("Change Password", "FAIL", `Error: ${error.message}`);
    return false;
  }
};

/**
 * Main test runner
 */
const runTests = async () => {
  console.log("🧪 Starting API Tests...\n");

  // Test server health first
  const serverHealthy = await testServerHealth();
  if (!serverHealthy) {
    console.log("\n❌ Server is not healthy. Please start the server first.");
    return;
  }

  console.log(""); // Empty line

  // Try to login first (in case user already exists)
  const loginSuccess = await testUserLogin();

  if (!loginSuccess) {
    // If login fails, try to register
    const registrationSuccess = await testUserRegistration();
    if (!registrationSuccess) {
      console.log("\n❌ Could not register or login user. Tests stopped.");
      return;
    }
  }

  console.log(""); // Empty line

  // Run profile tests
  await testGetProfile();
  await testUpdateProfile();
  await testChangePassword();

  console.log("\n🏁 API Tests completed!");
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export {
  runTests,
  testChangePassword,
  testGetProfile,
  testServerHealth,
  testUpdateProfile,
  testUserLogin,
  testUserRegistration,
};
