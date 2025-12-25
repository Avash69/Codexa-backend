# Admin Backend API Documentation

## Overview

This document provides comprehensive information about the admin backend API, including all endpoints, required changes, and frontend integration code.

## Authentication

All admin endpoints require:

1. **Authentication**: Valid JWT token
2. **Authorization**: Admin role (`role: "admin"`)

**Headers Required:**

```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

---

## Admin Endpoints

### 1. Authentication & Access Control

#### Check Admin Access

- **Endpoint**: `GET /api/admin/check-access`
- **Description**: Verify admin access and get admin user details
- **Response**:

```json
{
  "status": "success",
  "message": "Admin access verified",
  "data": {
    "user": {
      "id": "admin-user-id",
      "name": "Admin Name",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

### 2. Dashboard & Statistics

#### Get Admin Dashboard Stats

- **Endpoint**: `GET /api/admin/stats`
- **Description**: Get comprehensive platform statistics
- **Response**:

```json
{
  "status": "success",
  "data": {
    "totalUsers": 150,
    "totalTasks": 75,
    "openTasks": 25,
    "completedTasks": 30,
    "recentUsers": 12,
    "recentTasks": 8,
    "totalApplications": 200,
    "totalSubmissions": 45,
    "pendingReviews": 5,
    "approvedSubmissions": 35,
    "rejectedSubmissions": 5,
    "lastUpdated": "2025-07-10T16:30:00.000Z"
  }
}
```

#### Get Platform Analytics

- **Endpoint**: `GET /api/admin/analytics`
- **Query Parameters**: `period` (7d, 30d, 90d)
- **Description**: Get detailed analytics with charts data
- **Response**:

```json
{
  "status": "success",
  "data": {
    "period": "30d",
    "userRegistrations": [
      { "_id": "2025-07-01", "count": 5 },
      { "_id": "2025-07-02", "count": 8 }
    ],
    "taskCreations": [
      { "_id": "2025-07-01", "count": 3 },
      { "_id": "2025-07-02", "count": 2 }
    ],
    "applicationStats": [
      { "_id": "pending", "count": 15 },
      { "_id": "accepted", "count": 10 },
      { "_id": "rejected", "count": 5 }
    ],
    "categoryStats": [
      { "_id": "frontend", "count": 20, "avgPayout": 250 },
      { "_id": "backend", "count": 15, "avgPayout": 300 }
    ]
  }
}
```

### 3. User Management

#### Get All Users

- **Endpoint**: `GET /api/admin/users`
- **Query Parameters**: `page`, `limit`
- **Description**: Get paginated list of all users
- **Response**:

```json
{
  "status": "success",
  "data": {
    "users": [
      {
        "id": "user-id",
        "name": "User Name",
        "email": "user@example.com",
        "role": "user",
        "createdAt": "2025-07-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### Get User Details

- **Endpoint**: `GET /api/admin/users/:userId`
- **Description**: Get detailed user information with applications
- **Response**:

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "user-id",
      "name": "User Name",
      "email": "user@example.com",
      "role": "user",
      "bio": "User bio",
      "skills": ["React", "Node.js"]
    },
    "applications": [
      {
        "id": "app-id",
        "taskId": {
          "title": "Task Title",
          "company": "Company Name"
        },
        "status": "pending",
        "createdAt": "2025-07-10T10:00:00.000Z"
      }
    ],
    "stats": {
      "total": 5,
      "pending": 2,
      "accepted": 1,
      "rejected": 1,
      "completed": 1
    }
  }
}
```

#### Update User Details

- **Endpoint**: `PUT /api/admin/users/:userId`
- **Body**: `{ "name": "New Name", "email": "new@email.com", "role": "admin", "isActive": true }`
- **Description**: Update user information
- **Response**:

```json
{
  "status": "success",
  "message": "User updated successfully",
  "data": {
    "user": {
      "id": "user-id",
      "name": "New Name",
      "email": "new@email.com",
      "role": "admin",
      "isActive": true
    }
  }
}
```

#### Delete User

- **Endpoint**: `DELETE /api/admin/users/:userId`
- **Description**: Delete a user from the platform
- **Response**:

```json
{
  "status": "success",
  "message": "User deleted successfully"
}
```

### 4. Task Management

#### Get All Tasks

- **Endpoint**: `GET /api/admin/tasks`
- **Query Parameters**: `page`, `limit`
- **Description**: Get paginated list of all tasks
- **Response**:

```json
{
  "status": "success",
  "data": {
    "tasks": [
      {
        "id": "task-id",
        "title": "Task Title",
        "description": "Task description",
        "company": "Company Name",
        "category": "frontend",
        "difficulty": "medium",
        "payout": 250,
        "status": "open",
        "createdAt": "2025-07-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalTasks": 30,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### Get Task Details

- **Endpoint**: `GET /api/admin/tasks/:taskId`
- **Description**: Get detailed task information with applications
- **Response**:

```json
{
  "status": "success",
  "data": {
    "task": {
      "id": "task-id",
      "title": "Task Title",
      "description": "Task description",
      "company": "Company Name",
      "category": "frontend",
      "difficulty": "medium",
      "payout": 250,
      "status": "open",
      "clientId": {
        "name": "Client Name",
        "email": "client@example.com"
      }
    },
    "applications": [
      {
        "id": "app-id",
        "userId": {
          "name": "User Name",
          "email": "user@example.com"
        },
        "status": "pending",
        "createdAt": "2025-07-10T10:00:00.000Z"
      }
    ],
    "applicationStats": {
      "total": 5,
      "pending": 3,
      "accepted": 1,
      "rejected": 1,
      "completed": 0
    }
  }
}
```

#### Create Task

- **Endpoint**: `POST /api/admin/tasks`
- **Body**: Task creation data
- **Description**: Create a new task
- **Response**:

```json
{
  "status": "success",
  "message": "Task created successfully",
  "data": {
    "task": {
      "id": "new-task-id",
      "title": "New Task Title"
    }
  }
}
```

#### Update Task Details

- **Endpoint**: `PUT /api/admin/tasks/:taskId`
- **Body**: Task update data
- **Description**: Update task information
- **Response**:

```json
{
  "status": "success",
  "message": "Task updated successfully",
  "data": {
    "task": {
      "id": "task-id",
      "title": "Updated Task Title"
    }
  }
}
```

#### Delete Task

- **Endpoint**: `DELETE /api/admin/tasks/:taskId`
- **Description**: Delete a task from the platform
- **Response**:

```json
{
  "status": "success",
  "message": "Task deleted successfully"
}
```

### 5. Application Management

#### Get All Applications

- **Endpoint**: `GET /api/admin/applications`
- **Query Parameters**: `page`, `limit`, `status`, `taskId`, `userId`
- **Description**: Get paginated list of all applications with filters
- **Response**:

```json
{
  "status": "success",
  "data": {
    "applications": [
      {
        "id": "app-id",
        "userId": {
          "name": "User Name",
          "email": "user@example.com"
        },
        "taskId": {
          "title": "Task Title",
          "company": "Company Name"
        },
        "status": "pending",
        "message": "Application message",
        "createdAt": "2025-07-10T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalApplications": 100,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### Get Application Details

- **Endpoint**: `GET /api/admin/applications/:applicationId`
- **Description**: Get detailed application information
- **Response**:

```json
{
  "status": "success",
  "data": {
    "application": {
      "id": "app-id",
      "userId": {
        "name": "User Name",
        "email": "user@example.com",
        "bio": "User bio",
        "skills": ["React", "Node.js"]
      },
      "taskId": {
        "title": "Task Title",
        "description": "Task description",
        "requirements": ["Requirement 1", "Requirement 2"]
      },
      "status": "pending",
      "message": "Application message",
      "createdAt": "2025-07-10T10:00:00.000Z"
    }
  }
}
```

#### Update Application Status

- **Endpoint**: `PATCH /api/admin/applications/:applicationId/status`
- **Body**: `{ "status": "accepted", "feedback": "Great application!" }`
- **Description**: Update application status with optional feedback
- **Response**:

```json
{
  "status": "success",
  "message": "Application status updated successfully",
  "data": {
    "application": {
      "id": "app-id",
      "status": "accepted",
      "feedback": {
        "comment": "Great application!",
        "providedAt": "2025-07-10T16:30:00.000Z"
      }
    }
  }
}
```

#### Bulk Update Application Status

- **Endpoint**: `PATCH /api/admin/applications/bulk-update`
- **Body**: `{ "applicationIds": ["app1", "app2"], "status": "rejected", "feedback": "Not suitable" }`
- **Description**: Update multiple applications at once
- **Response**:

```json
{
  "status": "success",
  "message": "5 applications updated successfully",
  "data": {
    "updatedCount": 5,
    "status": "rejected"
  }
}
```

### 6. System Management

#### Get Activity Logs

- **Endpoint**: `GET /api/admin/activity-logs`
- **Query Parameters**: `page`, `limit`
- **Description**: Get admin activity logs for auditing
- **Response**:

```json
{
  "status": "success",
  "data": {
    "logs": [
      {
        "id": "log-id",
        "adminId": "admin-id",
        "adminName": "Admin Name",
        "action": "UPDATE_APPLICATION_STATUS",
        "entityType": "application",
        "entityId": "app-id",
        "details": "Changed status from pending to accepted",
        "timestamp": "2025-07-10T16:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalLogs": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

## Frontend Integration

### 1. Enhanced Admin API Client

Create a new file `adminAPI.js` in your frontend project:

```javascript
// adminAPI.js
const API_BASE_URL = "http://localhost:5001/api";

class AdminAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        headers,
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // Authentication
  async checkAccess() {
    return await this.request("/admin/check-access");
  }

  // Dashboard & Statistics
  async getStats() {
    return await this.request("/admin/stats");
  }

  async getAnalytics(period = "30d") {
    return await this.request(`/admin/analytics?period=${period}`);
  }

  // User Management
  async getUsers(page = 1, limit = 10) {
    return await this.request(`/admin/users?page=${page}&limit=${limit}`);
  }

  async getUserDetails(userId) {
    return await this.request(`/admin/users/${userId}`);
  }

  async updateUser(userId, userData) {
    return await this.request(`/admin/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId) {
    return await this.request(`/admin/users/${userId}`, {
      method: "DELETE",
    });
  }

  // Task Management
  async getTasks(page = 1, limit = 10) {
    return await this.request(`/admin/tasks?page=${page}&limit=${limit}`);
  }

  async getTaskDetails(taskId) {
    return await this.request(`/admin/tasks/${taskId}`);
  }

  async createTask(taskData) {
    return await this.request("/admin/tasks", {
      method: "POST",
      body: JSON.stringify(taskData),
    });
  }

  async updateTask(taskId, taskData) {
    return await this.request(`/admin/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify(taskData),
    });
  }

  async deleteTask(taskId) {
    return await this.request(`/admin/tasks/${taskId}`, {
      method: "DELETE",
    });
  }

  // Application Management
  async getApplications(page = 1, limit = 10, filters = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    return await this.request(`/admin/applications?${params}`);
  }

  async getApplicationDetails(applicationId) {
    return await this.request(`/admin/applications/${applicationId}`);
  }

  async updateApplicationStatus(applicationId, status, feedback = "") {
    return await this.request(`/admin/applications/${applicationId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, feedback }),
    });
  }

  async bulkUpdateApplications(applicationIds, status, feedback = "") {
    return await this.request("/admin/applications/bulk-update", {
      method: "PATCH",
      body: JSON.stringify({ applicationIds, status, feedback }),
    });
  }

  // System Management
  async getActivityLogs(page = 1, limit = 20) {
    return await this.request(
      `/admin/activity-logs?page=${page}&limit=${limit}`
    );
  }
}

export default AdminAPI;
```

### 2. React Admin Dashboard Components

Create React components for the admin dashboard:

```javascript
// AdminDashboard.js
import React, { useState, useEffect } from "react";
import AdminAPI from "./adminAPI";

const adminAPI = new AdminAPI();

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        adminAPI.setToken(token);
        const response = await adminAPI.getStats();
        setStats(response.data);
      } catch (error) {
        console.error("Failed to load stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p>{stats?.totalUsers || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Total Tasks</h3>
          <p>{stats?.totalTasks || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Open Tasks</h3>
          <p>{stats?.openTasks || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Total Applications</h3>
          <p>{stats?.totalApplications || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Pending Reviews</h3>
          <p>{stats?.pendingReviews || 0}</p>
        </div>
      </div>
    </div>
  );
};

// ApplicationManager.js
export const ApplicationManager = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplications, setSelectedApplications] = useState([]);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const response = await adminAPI.getApplications();
      setApplications(response.data.applications);
    } catch (error) {
      console.error("Failed to load applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId, status) => {
    try {
      await adminAPI.updateApplicationStatus(applicationId, status);
      await loadApplications(); // Refresh the list
    } catch (error) {
      console.error("Failed to update application:", error);
    }
  };

  const handleBulkUpdate = async (status) => {
    try {
      await adminAPI.bulkUpdateApplications(selectedApplications, status);
      setSelectedApplications([]);
      await loadApplications(); // Refresh the list
    } catch (error) {
      console.error("Failed to bulk update applications:", error);
    }
  };

  if (loading) return <div>Loading applications...</div>;

  return (
    <div className="application-manager">
      <h2>Application Management</h2>

      {selectedApplications.length > 0 && (
        <div className="bulk-actions">
          <button onClick={() => handleBulkUpdate("accepted")}>
            Accept Selected ({selectedApplications.length})
          </button>
          <button onClick={() => handleBulkUpdate("rejected")}>
            Reject Selected ({selectedApplications.length})
          </button>
        </div>
      )}

      <div className="applications-list">
        {applications.map((app) => (
          <div key={app.id} className="application-card">
            <input
              type="checkbox"
              checked={selectedApplications.includes(app.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedApplications([...selectedApplications, app.id]);
                } else {
                  setSelectedApplications(
                    selectedApplications.filter((id) => id !== app.id)
                  );
                }
              }}
            />

            <div className="application-info">
              <h3>{app.taskId.title}</h3>
              <p>Applicant: {app.userId.name}</p>
              <p>Status: {app.status}</p>
              <p>Applied: {new Date(app.createdAt).toLocaleDateString()}</p>
            </div>

            <div className="application-actions">
              <button onClick={() => handleStatusUpdate(app.id, "accepted")}>
                Accept
              </button>
              <button onClick={() => handleStatusUpdate(app.id, "rejected")}>
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// UserManager.js
export const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await adminAPI.getUsers();
      setUsers(response.data.users);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await adminAPI.deleteUser(userId);
        await loadUsers(); // Refresh the list
      } catch (error) {
        console.error("Failed to delete user:", error);
      }
    }
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div className="user-manager">
      <h2>User Management</h2>

      <div className="users-list">
        {users.map((user) => (
          <div key={user.id} className="user-card">
            <div className="user-info">
              <h3>{user.name}</h3>
              <p>Email: {user.email}</p>
              <p>Role: {user.role}</p>
              <p>Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>

            <div className="user-actions">
              <button onClick={() => handleDeleteUser(user.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 3. CSS Styles for Admin Components

```css
/* admin.css */
.admin-dashboard {
  padding: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

.stat-card h3 {
  margin: 0 0 10px 0;
  color: #495057;
}

.stat-card p {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: #007bff;
}

.application-manager,
.user-manager {
  padding: 20px;
}

.bulk-actions {
  margin-bottom: 20px;
  padding: 15px;
  background: #e9ecef;
  border-radius: 8px;
}

.bulk-actions button {
  margin-right: 10px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.bulk-actions button:first-child {
  background: #28a745;
  color: white;
}

.bulk-actions button:last-child {
  background: #dc3545;
  color: white;
}

.applications-list,
.users-list {
  display: grid;
  gap: 15px;
}

.application-card,
.user-card {
  display: flex;
  align-items: center;
  padding: 15px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  background: white;
}

.application-info,
.user-info {
  flex: 1;
  margin-left: 15px;
}

.application-actions,
.user-actions {
  display: flex;
  gap: 10px;
}

.application-actions button,
.user-actions button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.application-actions button:first-child {
  background: #28a745;
  color: white;
}

.application-actions button:last-child {
  background: #dc3545;
  color: white;
}

.user-actions button {
  background: #dc3545;
  color: white;
}
```

### 4. Main Admin App Component

```javascript
// AdminApp.js
import React, { useState, useEffect } from "react";
import {
  AdminDashboard,
  ApplicationManager,
  UserManager,
} from "./AdminComponents";
import AdminAPI from "./adminAPI";
import "./admin.css";

const adminAPI = new AdminAPI();

export const AdminApp = () => {
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setLoading(false);
        return;
      }

      adminAPI.setToken(token);
      await adminAPI.checkAccess();
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Admin access check failed:", error);
      localStorage.removeItem("adminToken");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      // This would use your existing login endpoint
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (data.token) {
        localStorage.setItem("adminToken", data.token);
        adminAPI.setToken(data.token);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setIsAuthenticated(false);
  };

  if (loading) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <h2>Admin Login</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            handleLogin(formData.get("email"), formData.get("password"));
          }}
        >
          <input name="email" type="email" placeholder="Email" required />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
          />
          <button type="submit">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-app">
      <nav className="admin-nav">
        <h1>Admin Panel</h1>
        <div className="nav-links">
          <button
            className={currentTab === "dashboard" ? "active" : ""}
            onClick={() => setCurrentTab("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={currentTab === "applications" ? "active" : ""}
            onClick={() => setCurrentTab("applications")}
          >
            Applications
          </button>
          <button
            className={currentTab === "users" ? "active" : ""}
            onClick={() => setCurrentTab("users")}
          >
            Users
          </button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <main className="admin-content">
        {currentTab === "dashboard" && <AdminDashboard />}
        {currentTab === "applications" && <ApplicationManager />}
        {currentTab === "users" && <UserManager />}
      </main>
    </div>
  );
};

export default AdminApp;
```

---

## Summary

### Backend Changes Made:

1. **Enhanced Admin Controller**: Added comprehensive application management, user management, task management, and analytics functions
2. **Updated Admin Routes**: Added new endpoints for detailed management operations
3. **Improved Error Handling**: Better error responses and logging

### Frontend Integration:

1. **AdminAPI Class**: Complete API client for all admin operations
2. **React Components**: Ready-to-use dashboard, application manager, and user manager components
3. **CSS Styles**: Professional styling for admin interface

### Key Features:

- **Dashboard**: Statistics and analytics
- **Application Management**: View, approve, reject, and bulk update applications
- **User Management**: View, edit, and delete users
- **Task Management**: Full CRUD operations for tasks
- **Activity Logs**: Audit trail for admin actions
- **Analytics**: Charts and reports for platform insights

This admin system provides comprehensive management capabilities for your platform with a professional interface and robust backend support.
