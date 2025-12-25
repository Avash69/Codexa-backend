# Admin API Endpoints Reference

This document provides a quick reference of all admin-specific endpoints available in the Codexa platform for frontend integration.

## Admin Credentials

A default admin account is created using the script in `scripts/create-admin.js`. The default credentials are:

```
Email: admin@codeandcash.com
Password: admin123456
```

To create a new admin account, run:

```
node scripts/create-admin.js
```

## Frontend Integration

A helper utility `adminAPI.js` has been created in the `frontend-integration` directory that you can copy to your frontend project. It provides methods for all admin operations.

### Using the Admin API

```javascript
// Import the Admin API
import adminAPI from "./path/to/adminAPI";

// Login and authenticate
const loginResponse = await fetch("http://localhost:5001/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "admin@codeandcash.com",
    password: "admin123456",
  }),
});

const { token } = await loginResponse.json();

// Set token for all future requests
adminAPI.setToken(token);

// Check if user has admin access
const { isAdmin, user } = await adminAPI.checkAdminAccess();

if (isAdmin) {
  // User has admin access, load admin dashboard
  const stats = await adminAPI.getStats();
  console.log("Admin stats:", stats);

  // Load users
  const { users, pagination } = await adminAPI.getUsers();
  console.log("Users:", users);
} else {
  // Redirect to access denied page
  console.error("Access denied: User is not an admin");
}
```

## Authentication

All admin endpoints require authentication with an admin account. Include the authentication token in the request header:

```
Authorization: Bearer <your-jwt-token>
```

### Verify Admin Access

```
GET /api/admin/check-access
```

Verifies if the authenticated user has admin privileges. Returns basic user information if access is granted.

## Dashboard Statistics

### Get Admin Dashboard Stats

```
GET /api/admin/stats
```

Returns comprehensive dashboard statistics including:

- Total users and recent registrations (last 30 days)
- Total tasks, active tasks, completed tasks, and recent tasks
- Total applications and submissions
- Pending reviews (submissions awaiting approval)
- Approved and rejected submissions
- Last updated timestamp

## User Management

### Get All Users

```
GET /api/admin/users?page=1&limit=10
```

Returns paginated list of all registered users.

### Delete User

```
DELETE /api/admin/users/:userId
```

Permanently deletes a user and removes their applications and submissions.

## Task Management

### Get All Tasks

```
GET /api/admin/tasks?page=1&limit=10
```

Returns paginated list of all tasks with their applicants and submissions.

### Create New Task

```
POST /api/admin/tasks
```

Creates a new task with the following required fields:

- title
- description
- category
- difficulty
- payout

Optional fields:

- deadline
- requirements (array)
- tags (array)
- company
- duration
- status

### Delete Task

```
DELETE /api/admin/tasks/:taskId
```

Permanently deletes a task.

## Application Management

### Get All Task Applications

```
GET /api/admin/task-applications
```

Returns a list of all users who have applied to tasks.

### Update Application Status

```
PATCH /api/admin/applications/:applicationId/status
```

Approve or reject a task application.

Body parameters:

- status: "pending" | "accepted" | "rejected" | "completed" | "cancelled"
- feedback: (optional) Feedback message for the applicant

When an application is "accepted", the task is automatically assigned to that user and task status changes to "in_progress".

## Submission Management

### Get User Submissions

```
GET /api/admin/user-submissions/:userId
```

Returns all submissions made by a specific user.

### Download Submission File

```
GET /api/admin/submissions/:submissionId/download
```

Downloads the submission file for a specific submission.

### Update Submission Status

```
PATCH /api/admin/submissions/:submissionId/status
```

Updates the status of a submission.

Body parameters:

- status: "pending" | "submitted" | "approved" | "rejected"
- feedback: (optional) Feedback message for the user

## Response Format

All endpoints return responses in the following format:

```json
{
  "status": "success" | "error",
  "message": "Description message",
  "data": {
    // Response data specific to each endpoint
  }
}
```

For pagination, the response includes:

```json
"pagination": {
  "currentPage": 1,
  "totalPages": 10,
  "totalItems": 100,
  "hasNext": true,
  "hasPrev": false
}
```
