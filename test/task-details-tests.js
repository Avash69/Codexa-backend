import fetch from "node-fetch";

const BASE_URL = "http://localhost:5001/api";

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    return {
      success: response.ok,
      status: response.status,
      data: data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function testTaskDetailsEndpoint() {
  console.log("🧪 Testing Task Details API Endpoint...\n");

  const tests = [
    {
      name: "Get valid task by ID",
      url: `${BASE_URL}/tasks/6872c223ce150d6ca8118605`,
      expectedStatus: 200,
      validate: (data) => {
        return (
          data.task &&
          data.task._id &&
          data.task.title &&
          data.task.overview && // Changed from description to overview
          data.task.company &&
          data.task.category &&
          data.task.difficulty &&
          typeof data.task.payout === "number"
        );
      },
    },
    {
      name: "Get task with invalid numeric ID",
      url: `${BASE_URL}/tasks/123`,
      expectedStatus: 400,
      validate: (data) => data.message === "Validation failed",
    },
    {
      name: "Get task with invalid string ID",
      url: `${BASE_URL}/tasks/invalidid`,
      expectedStatus: 400,
      validate: (data) => data.message === "Validation failed",
    },
    {
      name: "Get task with non-existent but valid ObjectId",
      url: `${BASE_URL}/tasks/507f1f77bcf86cd799439011`,
      expectedStatus: 404,
      validate: (data) => data.message === "Task not found",
    },
    {
      name: "Get task with malformed ObjectId",
      url: `${BASE_URL}/tasks/6872c223ce150d6ca811860`, // Too short
      expectedStatus: 400,
      validate: (data) =>
        data.message === "Validation failed" ||
        data.message === "Invalid task ID format",
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`Testing: ${test.name}`);
    console.log(`GET ${test.url}`);

    const result = await makeRequest(test.url);

    if (result.status === test.expectedStatus) {
      if (test.validate && !test.validate(result.data)) {
        console.log(`❌ FAILED - Validation failed`);
        console.log(`   Response:`, JSON.stringify(result.data, null, 2));
        failed++;
      } else {
        console.log(`✅ PASSED - Status: ${result.status}`);
        if (test.expectedStatus === 200) {
          console.log(`   📦 Task: ${result.data.task?.title}`);
          console.log(`   🏢 Company: ${result.data.task?.company}`);
          console.log(`   💰 Payout: $${result.data.task?.payout}`);
        } else {
          console.log(`   📋 Message: ${result.data.message}`);
        }
        passed++;
      }
    } else {
      console.log(
        `❌ FAILED - Expected status ${test.expectedStatus}, got ${result.status}`
      );
      console.log(`   Response:`, JSON.stringify(result.data, null, 2));
      failed++;
    }
    console.log("");
  }

  console.log("📊 Task Details API Test Results:");
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);
  console.log(
    `🎯 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(2)}%`
  );

  if (failed === 0) {
    console.log("🎉 All task details API tests passed!");
  } else {
    console.log("⚠️  Some tests failed. Please check the implementation.");
  }
}

testTaskDetailsEndpoint().catch(console.error);
