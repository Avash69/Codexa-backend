import fetch from "node-fetch";
import { logger } from "../src/utils/logger.js";

// Base URL for API
const BASE_URL = "http://localhost:5001/api";

/**
 * Make HTTP request
 */
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

/**
 * Test cases for Task API endpoints
 */
const testCases = [
  {
    name: "Get all tasks",
    method: "GET",
    endpoint: "/tasks",
    expectedStatus: 200,
  },
  {
    name: "Get tasks with category filter",
    method: "GET",
    endpoint: "/tasks?category=frontend",
    expectedStatus: 200,
  },
  {
    name: "Get tasks with difficulty filter",
    method: "GET",
    endpoint: "/tasks?difficulty=easy",
    expectedStatus: 200,
  },
  {
    name: "Get tasks with search",
    method: "GET",
    endpoint: "/tasks?search=react",
    expectedStatus: 200,
  },
  {
    name: "Get tasks with price range",
    method: "GET",
    endpoint: "/tasks?minPrice=100&maxPrice=500",
    expectedStatus: 200,
  },
  {
    name: "Get tasks with pagination",
    method: "GET",
    endpoint: "/tasks?page=1&limit=5",
    expectedStatus: 200,
  },
  {
    name: "Get tasks with sorting",
    method: "GET",
    endpoint: "/tasks?sortBy=payout&sortOrder=desc",
    expectedStatus: 200,
  },
  {
    name: "Get task categories",
    method: "GET",
    endpoint: "/tasks/categories",
    expectedStatus: 200,
  },
  {
    name: "Get task difficulties",
    method: "GET",
    endpoint: "/tasks/difficulties",
    expectedStatus: 200,
  },
  {
    name: "Get task statistics",
    method: "GET",
    endpoint: "/tasks/stats",
    expectedStatus: 200,
  },
  {
    name: "Get price range",
    method: "GET",
    endpoint: "/tasks/price-range",
    expectedStatus: 200,
  },
  {
    name: "Search tasks",
    method: "GET",
    endpoint: "/tasks/search?q=react",
    expectedStatus: 200,
  },
];

/**
 * Run all test cases
 */
async function runTests() {
  logger.info("🧪 Starting Task API Tests...\n");

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    const url = `${BASE_URL}${testCase.endpoint}`;

    logger.info(`Testing: ${testCase.name}`);
    logger.info(`${testCase.method} ${url}`);

    const result = await makeRequest(url, { method: testCase.method });

    if (result.success && result.status === testCase.expectedStatus) {
      logger.info(`✅ PASSED - Status: ${result.status}`);

      // Log some data details for successful requests
      if (result.data && result.data.data) {
        if (Array.isArray(result.data.data)) {
          logger.info(`   📦 Returned ${result.data.data.length} items`);
        } else if (result.data.data.tasks) {
          logger.info(`   📦 Returned ${result.data.data.tasks.length} tasks`);
          if (result.data.data.pagination) {
            logger.info(
              `   📄 Pagination: Page ${result.data.data.pagination.currentPage} of ${result.data.data.pagination.totalPages}`
            );
          }
        } else if (typeof result.data.data === "object") {
          logger.info(
            `   📦 Returned object with ${
              Object.keys(result.data.data).length
            } properties`
          );
        }
      }

      passed++;
    } else {
      logger.error(
        `❌ FAILED - Expected ${testCase.expectedStatus}, got ${result.status}`
      );
      if (result.error) {
        logger.error(`   Error: ${result.error}`);
      } else if (result.data) {
        logger.error(`   Response: ${JSON.stringify(result.data, null, 2)}`);
      }
      failed++;
    }

    logger.info(""); // Empty line for readability
  }

  // Summary
  logger.info("📊 Test Results Summary:");
  logger.info(`✅ Passed: ${passed}`);
  logger.info(`❌ Failed: ${failed}`);
  logger.info(`📊 Total: ${passed + failed}`);
  logger.info(
    `🎯 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(2)}%`
  );

  if (failed === 0) {
    logger.info("🎉 All tests passed!");
  } else {
    logger.error(
      "⚠️  Some tests failed. Please check the server and database connection."
    );
  }
}

/**
 * Test individual endpoint with detailed output
 */
async function testEndpoint(endpoint, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${BASE_URL}${endpoint}${queryString ? "?" + queryString : ""}`;

  logger.info(`🔍 Testing endpoint: ${url}`);

  const result = await makeRequest(url);

  if (result.success) {
    logger.info("✅ Success!");
    logger.info(JSON.stringify(result.data, null, 2));
  } else {
    logger.error("❌ Failed!");
    logger.error(`Status: ${result.status}`);
    logger.error(JSON.stringify(result.data, null, 2));
  }
}

// Export functions for use in other files
export { makeRequest, runTests, testEndpoint };

// If running this file directly, run all tests
if (process.argv[1].includes("task-api-tests.js")) {
  runTests();
}
