# Frontend Integration Guide

## ⚠️ Important: Authentication Token Management

The 403 error you're seeing in the browser Network tab indicates an authentication issue. Here's what to check:

## 1. **Token Setup in Frontend**

Make sure you're properly setting the token after login:

```javascript
// After successful login
const enhancedTaskAPI = new EnhancedTaskAPI();

// Set token after login
const loginResponse = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});

const loginData = await loginResponse.json();
if (loginData.token) {
  enhancedTaskAPI.setToken(loginData.token);
  // Store token in localStorage/sessionStorage for persistence
  localStorage.setItem("authToken", loginData.token);
}
```

## 2. **Token Persistence**

Load token on app startup:

```javascript
// On app initialization
const enhancedTaskAPI = new EnhancedTaskAPI();
const storedToken = localStorage.getItem("authToken");
if (storedToken) {
  enhancedTaskAPI.setToken(storedToken);
}
```

## 3. **API Usage Examples**

```javascript
// Get user's applied tasks
try {
  const appliedTasks = await enhancedTaskAPI.getMyAppliedTasks({
    status: "all",
    limit: 50,
    page: 1,
  });
  console.log(appliedTasks);
} catch (error) {
  console.error("Error fetching applied tasks:", error);
  // Handle authentication error
  if (error.message.includes("401") || error.message.includes("403")) {
    // Redirect to login or refresh token
  }
}
```

## 4. **Common Issues and Solutions**

### Issue: 403 Forbidden Error

**Cause**: Invalid or expired token
**Solution**:

- Check if token is properly set
- Verify token hasn't expired
- Re-login if necessary

### Issue: Token not included in requests

**Cause**: Token not set in API instance
**Solution**:

- Ensure `setToken()` is called after login
- Check token persistence across page reloads

### Issue: CORS problems

**Cause**: Cross-origin request issues
**Solution**:

- Ensure backend CORS is properly configured
- Check if frontend is running on expected port

## 5. **Debug Steps**

1. **Check Network Tab**: Look for Authorization header in requests
2. **Console Logging**: Add console.log to verify token is set
3. **Test with Postman/curl**: Verify API works with manual token

## 6. **Updated Frontend Code Structure**

```javascript
class TaskManager {
  constructor() {
    this.api = new EnhancedTaskAPI();
    this.initializeAuth();
  }

  initializeAuth() {
    const token = localStorage.getItem("authToken");
    if (token) {
      this.api.setToken(token);
    }
  }

  async login(email, password) {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (data.token) {
        this.api.setToken(data.token);
        localStorage.setItem("authToken", data.token);
        return data;
      }
      throw new Error("Login failed");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  async getMyApplications() {
    try {
      return await this.api.getMyAppliedTasks({
        status: "all",
        limit: 50,
        page: 1,
      });
    } catch (error) {
      if (error.message.includes("401") || error.message.includes("403")) {
        // Handle auth error
        this.handleAuthError();
      }
      throw error;
    }
  }

  handleAuthError() {
    // Clear invalid token
    localStorage.removeItem("authToken");
    this.api.removeToken();
    // Redirect to login page
    window.location.href = "/login";
  }
}
```

## 7. **Server-Side Verification**

The server endpoints are working correctly. All tests pass:

- ✅ Regular users can apply to tasks
- ✅ Authentication is properly enforced
- ✅ Admin endpoints are protected
- ✅ Token validation works correctly

The issue is in the frontend token management.

---

## 8. **Complete API Endpoints Reference**

### 🔐 **Authentication Endpoints**

#### Login

- **Endpoint**: `POST /api/auth/login`
- **Authentication**: None required
- **Body**: `{ "email": "user@example.com", "password": "password123" }`
- **Response**: `{ "status": "success", "token": "jwt-token", "data": { "user": {...} } }`

#### Register

- **Endpoint**: `POST /api/auth/register`
- **Authentication**: None required
- **Body**: `{ "email": "user@example.com", "password": "password123", "name": "User Name" }`
- **Response**: `{ "status": "success", "token": "jwt-token", "data": { "user": {...} } }`

#### Logout

- **Endpoint**: `POST /api/auth/logout`
- **Authentication**: Bearer token required
- **Response**: `{ "status": "success", "message": "Logged out successfully" }`

### 📋 **Task Endpoints**

#### Get All Tasks

- **Endpoint**: `GET /api/tasks`
- **Authentication**: None required
- **Query Parameters**:
  - `page` (number): Page number (default: 1)
  - `limit` (number): Items per page (default: 10)
  - `category` (string): Filter by category
  - `difficulty` (string): Filter by difficulty (easy, medium, hard)
  - `search` (string): Search in title/description
  - `status` (string): Filter by status (open, in_progress, completed)
- **Response**: `{ "success": true, "data": { "tasks": [...], "pagination": {...} } }`

#### Get Single Task

- **Endpoint**: `GET /api/tasks/:taskId`
- **Authentication**: None required
- **Response**: `{ "success": true, "data": { "task": {...} } }`

### 📝 **Application Endpoints**

#### Apply to Task

- **Endpoint**: `POST /api/applications/apply/:taskId`
- **Authentication**: Bearer token required
- **Body**: `{ "message": "Cover letter message" }`
- **Response**: `{ "success": true, "data": { "application": {...} } }`

#### Get My Applied Tasks

- **Endpoint**: `GET /api/applications/my`
- **Authentication**: Bearer token required
- **Query Parameters**:
  - `status` (string): Filter by status (pending, accepted, rejected, completed)
  - `page` (number): Page number (default: 1)
  - `limit` (number): Items per page (default: 10)
  - `sortBy` (string): Sort field (default: appliedAt)
  - `sortOrder` (string): Sort order (asc, desc)
- **Response**: `{ "success": true, "data": { "applications": [...], "pagination": {...} } }`

#### Get Application Details

- **Endpoint**: `GET /api/applications/:applicationId`
- **Authentication**: Bearer token required
- **Response**: `{ "success": true, "data": { "application": {...} } }`

#### Get Application Stats

- **Endpoint**: `GET /api/applications/my/stats`
- **Authentication**: Bearer token required
- **Response**: `{ "success": true, "data": { "stats": { "total": 5, "pending": 2, "accepted": 1, "rejected": 1, "completed": 1 } } }`

#### Submit Files for Application

- **Endpoint**: `POST /api/applications/:applicationId/submit`
- **Authentication**: Bearer token required
- **Body**: FormData with files
- **Response**: `{ "success": true, "data": { "submissions": [...] } }`

#### Update Application Progress

- **Endpoint**: `PUT /api/applications/:applicationId/progress`
- **Authentication**: Bearer token required
- **Body**: `{ "progress": 75 }`
- **Response**: `{ "success": true, "data": { "application": {...} } }`

#### Withdraw Application

- **Endpoint**: `DELETE /api/applications/:applicationId/withdraw`
- **Authentication**: Bearer token required
- **Response**: `{ "success": true, "message": "Application withdrawn successfully" }`

#### Delete Submission File

- **Endpoint**: `DELETE /api/applications/:applicationId/submissions/:submissionId`
- **Authentication**: Bearer token required
- **Response**: `{ "success": true, "message": "Submission deleted successfully" }`

### 👤 **Profile Endpoints**

#### Get User Profile

- **Endpoint**: `GET /api/profile`
- **Authentication**: Bearer token required
- **Response**: `{ "success": true, "data": { "user": {...} } }`

#### Update User Profile

- **Endpoint**: `PUT /api/profile`
- **Authentication**: Bearer token required
- **Body**: `{ "name": "New Name", "bio": "User bio", "skills": ["skill1", "skill2"] }`
- **Response**: `{ "success": true, "data": { "user": {...} } }`

#### Upload Profile Image

- **Endpoint**: `POST /api/profile/image`
- **Authentication**: Bearer token required
- **Body**: FormData with image file
- **Response**: `{ "success": true, "data": { "user": {...} } }`

### 👑 **Admin Endpoints** (Admin role required)

#### Get All Users

- **Endpoint**: `GET /api/admin/users`
- **Authentication**: Bearer token + Admin role required
- **Query Parameters**: `page`, `limit`, `search`, `role`
- **Response**: `{ "status": "success", "data": { "users": [...], "pagination": {...} } }`

#### Get All Applications

- **Endpoint**: `GET /api/admin/applications`
- **Authentication**: Bearer token + Admin role required
- **Query Parameters**: `page`, `limit`, `status`, `taskId`
- **Response**: `{ "status": "success", "data": { "applications": [...], "pagination": {...} } }`

#### Update Application Status

- **Endpoint**: `PUT /api/admin/applications/:applicationId/status`
- **Authentication**: Bearer token + Admin role required
- **Body**: `{ "status": "accepted" }`
- **Response**: `{ "status": "success", "data": { "application": {...} } }`

---

## 9. **Frontend API Usage Examples**

### Initialize API Client

```javascript
import { EnhancedTaskAPI } from "./enhancedTaskAPI.js";

const api = new EnhancedTaskAPI();

// Set token after login
const token = localStorage.getItem("authToken");
if (token) {
  api.setToken(token);
}
```

### Authentication Flow

```javascript
// Login
async function login(email, password) {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (data.token) {
      api.setToken(data.token);
      localStorage.setItem("authToken", data.token);
      return data;
    }
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
}

// Logout
async function logout() {
  try {
    await api.request("/auth/logout", { method: "POST" });
    api.removeToken();
    localStorage.removeItem("authToken");
  } catch (error) {
    console.error("Logout failed:", error);
  }
}
```

### Task Management

```javascript
// Get all tasks with filters
async function loadTasks(filters = {}) {
  try {
    const tasks = await api.getTasks({
      page: 1,
      limit: 20,
      category: "frontend",
      difficulty: "medium",
      search: "React",
      ...filters,
    });
    return tasks;
  } catch (error) {
    console.error("Failed to load tasks:", error);
  }
}

// Get single task
async function getTaskDetails(taskId) {
  try {
    const task = await api.getTaskById(taskId);
    return task;
  } catch (error) {
    console.error("Failed to load task:", error);
  }
}
```

### Application Management

```javascript
// Apply to a task
async function applyToTask(taskId, message) {
  try {
    const application = await api.applyToTask(taskId, message);
    console.log("Application submitted:", application);
    return application;
  } catch (error) {
    console.error("Application failed:", error);
    throw error;
  }
}

// Get user's applications
async function getMyApplications(filters = {}) {
  try {
    const applications = await api.getMyAppliedTasks({
      status: "all",
      page: 1,
      limit: 50,
      ...filters,
    });
    return applications;
  } catch (error) {
    console.error("Failed to load applications:", error);
  }
}

// Get application statistics
async function getApplicationStats() {
  try {
    const stats = await api.getMyApplicationStats();
    return stats;
  } catch (error) {
    console.error("Failed to load stats:", error);
  }
}

// Submit files for application
async function submitFiles(applicationId, files) {
  try {
    const submissions = await api.submitFiles(applicationId, files);
    return submissions;
  } catch (error) {
    console.error("File submission failed:", error);
    throw error;
  }
}

// Update progress
async function updateProgress(applicationId, progress) {
  try {
    const updated = await api.updateProgress(applicationId, progress);
    return updated;
  } catch (error) {
    console.error("Progress update failed:", error);
    throw error;
  }
}
```

### Profile Management

```javascript
// Get user profile
async function getProfile() {
  try {
    const profile = await api.request("/profile");
    return profile.data;
  } catch (error) {
    console.error("Failed to load profile:", error);
  }
}

// Update profile
async function updateProfile(profileData) {
  try {
    const updated = await api.request("/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
    return updated.data;
  } catch (error) {
    console.error("Profile update failed:", error);
    throw error;
  }
}
```

### Error Handling

```javascript
// Global error handler
function handleAPIError(error) {
  if (error.message.includes("401") || error.message.includes("403")) {
    // Authentication error
    localStorage.removeItem("authToken");
    api.removeToken();
    window.location.href = "/login";
  } else if (error.message.includes("404")) {
    // Resource not found
    console.error("Resource not found");
  } else if (error.message.includes("500")) {
    // Server error
    console.error("Server error, please try again later");
  } else {
    // Other errors
    console.error("An error occurred:", error.message);
  }
}

// Use with any API call
try {
  const result = await api.someMethod();
} catch (error) {
  handleAPIError(error);
}
```

---

## 10. **Response Format Standards**

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

### Error Response

```json
{
  "status": "fail",
  "error": {
    "statusCode": 400,
    "status": "fail",
    "isOperational": true
  },
  "message": "Error description",
  "stack": "Error stack trace (development only)"
}
```

### Pagination Response

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 50,
      "hasNext": true,
      "hasPrev": false,
      "nextPage": 2,
      "prevPage": null
    }
  }
}
```
