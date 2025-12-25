/**
 * Test API Endpoints Script
 *
 * This script tests the correct user endpoints to verify they work without admin role
 * Run with: node scripts/test-user-endpoints.js
 */

import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const API_BASE_URL = "http://localhost:5001/api";

const testUserEndpoints = async () => {
  console.log("🧪 Testing User Endpoints...\n");

  try {
    // 1. Test login with regular user
    console.log("1. Testing user login...");
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "testuser@example.com",
        password: "testpass123",
      }),
    });

    const loginData = await loginResponse.json();

    if (!loginResponse.ok) {
      console.error("❌ Login failed:", loginData);
      return;
    }

    console.log("✅ Login successful!");
    const token = loginData.token;
    console.log("🔑 Token received\n");

    // 2. Test getting available tasks (should be public)
    console.log("2. Testing get available tasks...");
    const tasksResponse = await fetch(`${API_BASE_URL}/tasks`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const tasksData = await tasksResponse.json();

    if (!tasksResponse.ok) {
      console.error("❌ Get tasks failed:", tasksData);
    } else {
      console.log("✅ Get tasks successful!");
      console.log(`📋 Found ${tasksData.data?.tasks?.length || 0} tasks\n`);
    }

    // 3. Test getting user's applied tasks
    console.log("3. Testing get my applied tasks...");
    const appliedTasksResponse = await fetch(
      `${API_BASE_URL}/applications/my`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const appliedTasksData = await appliedTasksResponse.json();

    if (!appliedTasksResponse.ok) {
      console.error("❌ Get applied tasks failed:", appliedTasksData);
    } else {
      console.log("✅ Get applied tasks successful!");
      console.log(
        `📋 Found ${
          appliedTasksData.data?.applications?.length || 0
        } applied tasks\n`
      );
    }

    // 4. Test applying to a task (if tasks exist)
    if (tasksData.data?.tasks?.length > 0) {
      console.log("4. Testing apply to task...");
      const taskId = tasksData.data.tasks[0]._id;

      const applyResponse = await fetch(
        `${API_BASE_URL}/applications/apply/${taskId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: "Test application message",
          }),
        }
      );

      const applyData = await applyResponse.json();

      if (!applyResponse.ok) {
        console.error("❌ Apply to task failed:", applyData);
        console.log("Status:", applyResponse.status);
      } else {
        console.log("✅ Apply to task successful!");
        console.log("📝 Application created\n");
      }
    } else {
      console.log("4. ⚠️  No tasks available to apply to\n");
    }

    // 5. Test admin endpoint (should fail for regular user)
    console.log("5. Testing admin endpoint (should fail)...");
    const adminResponse = await fetch(`${API_BASE_URL}/admin/users`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const adminData = await adminResponse.json();

    if (!adminResponse.ok) {
      console.log("✅ Admin endpoint correctly rejected regular user");
      console.log("🚫 Error:", adminData.message);
    } else {
      console.log("❌ Admin endpoint incorrectly allowed regular user");
    }

    console.log("\n🎯 Correct API Endpoints for Users:");
    console.log("• Login: POST /api/auth/login");
    console.log("• Get Tasks: GET /api/tasks");
    console.log("• Apply to Task: POST /api/applications/apply/:taskId");
    console.log("• Get My Applied Tasks: GET /api/applications/my");
    console.log(
      "• Get Application Details: GET /api/applications/:applicationId"
    );
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
};

testUserEndpoints();
