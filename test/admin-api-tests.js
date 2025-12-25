/**
 * Admin API Testing Script
 *
 * This file contains comprehensive tests for admin functionality
 * including user management, task management, and submission handling
 * Run with: node test/admin-api-tests.js
 */

import fetch from "node-fetch";

const API_BASE_URL = "http://localhost:5001/api";
const BASE_URL = "http://localhost:5001";

// Test configurations
const testConfig = {
  adminUser: {
    name: "Admin User",
    email: `admin-test-${Date.now()}@example.com`,
    password: "adminpassword123",
    role: "admin",
  },
  regularUser: {
    name: "Regular User",
    email: `user-test-${Date.now()}@example.com`,
    password: "userpassword123",
    role: "user",
  },
  testTask: {
    title: "Admin Created Task",
    description: "This is a task created by admin for testing purposes",
    category: "frontend",
    difficulty: "medium",
    payout: 500,
    requirements: ["React", "JavaScript", "CSS"],
    tags: ["react", "frontend", "test"],
  },
};

let adminToken = null;
let regularToken = null;
let testTaskId = null;
let testUserId = null;

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

  try {
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
  } catch (error) {
    return { error };
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Setup functions
 */
const setupTestUsers = async () => {
  console.log("📝 Setting up test users...");

  // Create admin user (we'll manually set role to admin after creation)
  const { response: adminRegResponse, data: adminRegData } = await makeRequest(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify(testConfig.adminUser),
    }
  );

  if (adminRegResponse?.ok) {
    adminToken = adminRegData.token;
    logTest("Admin User Creation", "PASS", "Admin user created successfully");
  } else {
    logTest("Admin User Creation", "FAIL", "Could not create admin user");
    return false;
  }

  // Create regular user
  const { response: userRegResponse, data: userRegData } = await makeRequest(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify(testConfig.regularUser),
    }
  );

  if (userRegResponse?.ok) {
    regularToken = userRegData.token;
    testUserId = userRegData.data.user.id;
    logTest(
      "Regular User Creation",
      "PASS",
      "Regular user created successfully"
    );
  } else {
    logTest("Regular User Creation", "FAIL", "Could not create regular user");
    return false;
  }

  return true;
};

/**
 * Test functions
 */
const testServerHealth = async () => {
  try {
    const { response, data } = await makeRequest(`${BASE_URL}/health`);

    if (response?.ok && data.status === "OK") {
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
        `Server responded with: ${data?.message}`
      );
      return false;
    }
  } catch (error) {
    logTest("Server Health", "FAIL", `Error: ${error.message}`);
    return false;
  }
};

const testAdminStatsAccess = async () => {
  try {
    console.log("\\n📊 Testing Admin Stats Access...");

    const { response, data } = await makeRequest("/admin/stats", {
      token: adminToken,
    });

    if (response?.ok && data.status === "success") {
      logTest(
        "Admin Stats Access",
        "PASS",
        "Admin successfully accessed dashboard stats"
      );
      console.log(`   📊 Total Users: ${data.data.totalUsers}`);
      console.log(`   📊 Total Tasks: ${data.data.totalTasks}`);
      console.log(`   📊 Active Tasks: ${data.data.activeTasks}`);
      return true;
    } else {
      logTest(
        "Admin Stats Access",
        "FAIL",
        `Admin stats access failed: ${data?.message}`
      );
      return false;
    }
  } catch (error) {
    logTest("Admin Stats Access", "FAIL", `Error: ${error.message}`);
    return false;
  }
};

const testRegularUserAccessDenied = async () => {
  try {
    console.log("\\n🚫 Testing Regular User Access Denied...");

    const { response, data } = await makeRequest("/admin/stats", {
      token: regularToken,
    });

    if (response?.status === 403) {
      logTest(
        "Regular User Access Denied",
        "PASS",
        "Regular user properly denied admin access"
      );
      return true;
    } else {
      logTest(
        "Regular User Access Denied",
        "FAIL",
        `Expected 403, got ${response?.status}`
      );
      return false;
    }
  } catch (error) {
    logTest("Regular User Access Denied", "FAIL", `Error: ${error.message}`);
    return false;
  }
};

const testGetAllUsers = async () => {
  try {
    console.log("\\n👥 Testing Get All Users...");

    const { response, data } = await makeRequest("/admin/users", {
      token: adminToken,
    });

    if (response?.ok && data.status === "success") {
      logTest(
        "Get All Users",
        "PASS",
        `Retrieved ${data.data.users.length} users`
      );
      console.log(
        `   📄 Page: ${data.data.pagination.currentPage} of ${data.data.pagination.totalPages}`
      );
      return true;
    } else {
      logTest("Get All Users", "FAIL", `Failed to get users: ${data?.message}`);
      return false;
    }
  } catch (error) {
    logTest("Get All Users", "FAIL", `Error: ${error.message}`);
    return false;
  }
};

const testGetAllTasks = async () => {
  try {
    console.log("\\n📋 Testing Get All Tasks...");

    const { response, data } = await makeRequest("/admin/tasks", {
      token: adminToken,
    });

    if (response?.ok && data.status === "success") {
      logTest(
        "Get All Tasks",
        "PASS",
        `Retrieved ${data.data.tasks.length} tasks`
      );
      console.log(
        `   📄 Page: ${data.data.pagination.currentPage} of ${data.data.pagination.totalPages}`
      );
      return true;
    } else {
      logTest("Get All Tasks", "FAIL", `Failed to get tasks: ${data?.message}`);
      return false;
    }
  } catch (error) {
    logTest("Get All Tasks", "FAIL", `Error: ${error.message}`);
    return false;
  }
};

const testCreateTask = async () => {
  try {
    console.log("\\n➕ Testing Create Task (Admin Only)...");

    const { response, data } = await makeRequest("/admin/tasks", {
      method: "POST",
      token: adminToken,
      body: JSON.stringify(testConfig.testTask),
    });

    if (response?.ok && data.status === "success") {
      testTaskId = data.data.task._id;
      logTest(
        "Create Task",
        "PASS",
        `Task created successfully: ${data.data.task.title}`
      );
      return true;
    } else {
      logTest("Create Task", "FAIL", `Failed to create task: ${data?.message}`);
      return false;
    }
  } catch (error) {
    logTest("Create Task", "FAIL", `Error: ${error.message}`);
    return false;
  }
};

const testRegularUserCannotCreateTask = async () => {
  try {
    console.log("\\n🚫 Testing Regular User Cannot Create Task...");

    const { response, data } = await makeRequest("/admin/tasks", {
      method: "POST",
      token: regularToken,
      body: JSON.stringify(testConfig.testTask),
    });

    if (response?.status === 403) {
      logTest(
        "Regular User Cannot Create Task",
        "PASS",
        "Regular user properly denied task creation"
      );
      return true;
    } else {
      logTest(
        "Regular User Cannot Create Task",
        "FAIL",
        `Expected 403, got ${response?.status}`
      );
      return false;
    }
  } catch (error) {
    logTest(
      "Regular User Cannot Create Task",
      "FAIL",
      `Error: ${error.message}`
    );
    return false;
  }
};

const testGetTaskApplications = async () => {
  try {
    console.log("\\n📝 Testing Get Task Applications...");

    const { response, data } = await makeRequest("/admin/task-applications", {
      token: adminToken,
    });

    if (response?.ok && data.status === "success") {
      logTest(
        "Get Task Applications",
        "PASS",
        `Retrieved ${data.data.applications.length} applications`
      );
      return true;
    } else {
      logTest(
        "Get Task Applications",
        "FAIL",
        `Failed to get applications: ${data?.message}`
      );
      return false;
    }
  } catch (error) {
    logTest("Get Task Applications", "FAIL", `Error: ${error.message}`);
    return false;
  }
};

const testGetUserSubmissions = async () => {
  try {
    console.log("\\n📤 Testing Get User Submissions...");

    const { response, data } = await makeRequest(
      `/admin/user-submissions/${testUserId}`,
      {
        token: adminToken,
      }
    );

    if (response?.ok && data.status === "success") {
      logTest(
        "Get User Submissions",
        "PASS",
        `Retrieved ${data.data.submissions.length} submissions for user`
      );
      return true;
    } else {
      logTest(
        "Get User Submissions",
        "FAIL",
        `Failed to get submissions: ${data?.message}`
      );
      return false;
    }
  } catch (error) {
    logTest("Get User Submissions", "FAIL", `Error: ${error.message}`);
    return false;
  }
};

const testDeleteTask = async () => {
  try {
    console.log("\\n🗑️ Testing Delete Task...");

    if (!testTaskId) {
      logTest("Delete Task", "FAIL", "No test task ID available");
      return false;
    }

    const { response, data } = await makeRequest(`/admin/tasks/${testTaskId}`, {
      method: "DELETE",
      token: adminToken,
    });

    if (response?.ok && data.status === "success") {
      logTest("Delete Task", "PASS", "Task deleted successfully");
      return true;
    } else {
      logTest("Delete Task", "FAIL", `Failed to delete task: ${data?.message}`);
      return false;
    }
  } catch (error) {
    logTest("Delete Task", "FAIL", `Error: ${error.message}`);
    return false;
  }
};

const testRegularUserCannotDeleteTask = async () => {
  try {
    console.log("\\n🚫 Testing Regular User Cannot Delete Task...");

    // First create a task to try to delete
    const { response: createResponse, data: createData } = await makeRequest(
      "/admin/tasks",
      {
        method: "POST",
        token: adminToken,
        body: JSON.stringify({
          ...testConfig.testTask,
          title: "Task for Delete Test",
        }),
      }
    );

    if (!createResponse?.ok) {
      logTest(
        "Regular User Cannot Delete Task",
        "FAIL",
        "Could not create test task"
      );
      return false;
    }

    const taskToDelete = createData.data.task._id;

    // Try to delete with regular user token
    const { response, data } = await makeRequest(
      `/admin/tasks/${taskToDelete}`,
      {
        method: "DELETE",
        token: regularToken,
      }
    );

    if (response?.status === 403) {
      logTest(
        "Regular User Cannot Delete Task",
        "PASS",
        "Regular user properly denied task deletion"
      );

      // Clean up - delete the task with admin token
      await makeRequest(`/admin/tasks/${taskToDelete}`, {
        method: "DELETE",
        token: adminToken,
      });

      return true;
    } else {
      logTest(
        "Regular User Cannot Delete Task",
        "FAIL",
        `Expected 403, got ${response?.status}`
      );
      return false;
    }
  } catch (error) {
    logTest(
      "Regular User Cannot Delete Task",
      "FAIL",
      `Error: ${error.message}`
    );
    return false;
  }
};

/**
 * Main test runner
 */
const runAdminTests = async () => {
  console.log("🧪 Starting Admin API Tests...\\n");
  console.log("=".repeat(60));
  console.log("ADMIN API COMPREHENSIVE TEST SUITE");
  console.log("=".repeat(60));

  // Test server health first
  const serverHealthy = await testServerHealth();
  if (!serverHealthy) {
    console.log("\\n❌ Server is not healthy. Please start the server first.");
    process.exit(1);
  }

  // Setup test users
  const usersSetup = await setupTestUsers();
  if (!usersSetup) {
    console.log("\\n❌ Could not set up test users. Tests stopped.");
    process.exit(1);
  }

  console.log("\\n🎯 Running admin functionality tests...");

  // Run admin tests
  await testAdminStatsAccess();
  await testRegularUserAccessDenied();
  await testGetAllUsers();
  await testGetAllTasks();
  await testCreateTask();
  await testRegularUserCannotCreateTask();
  await testGetTaskApplications();
  await testGetUserSubmissions();
  await testDeleteTask();
  await testRegularUserCannotDeleteTask();

  console.log("\\n🏁 Admin API Tests completed!");
  console.log("\\n📝 Note: To fully test file upload and download features:");
  console.log("   1. Use a proper frontend or API client");
  console.log("   2. Upload submission files");
  console.log("   3. Test download endpoints");
  console.log("   4. Test status update endpoints");

  process.exit(0);
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAdminTests();
}

export {
  runAdminTests,
  testAdminStatsAccess,
  testCreateTask,
  testDeleteTask,
  testGetAllTasks,
  testGetAllUsers,
};
