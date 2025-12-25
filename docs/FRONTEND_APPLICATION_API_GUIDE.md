# Frontend Application API Integration Guide

This document provides the exact API endpoints and code examples for integrating the "Apply for Task" and "My Applied Tasks" features with your backend.

---

## 1. Apply for a Task

**Endpoint:**  
`POST /api/applications/apply/:taskId`

**Request Example:**

```javascript
import axios from "axios";

async function applyForTask(taskId, message = "") {
  try {
    const response = await axios.post(`/api/applications/apply/${taskId}`, {
      message: message, // Optional application message
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to apply for task"
    );
  }
}

// Usage example:
// await applyForTask("TASK_OBJECT_ID", "I'm interested in this project...");
```

**Response Structure:**

```json
{
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "_id": "APPLICATION_ID",
    "userId": "USER_ID",
    "taskId": {
      "_id": "TASK_ID",
      "title": "Task Title",
      "company": "Company Name",
      "category": "Development",
      "difficulty": "Medium",
      "payout": 500
    },
    "status": "pending",
    "appliedAt": "2025-07-12T12:00:00Z",
    "message": "Application message"
  }
}
```

---

## 2. Get User's Applied Tasks

**Endpoint:**  
`GET /api/applications/my`

**Query Parameters:**

- `status` (optional): Filter by status - `pending`, `accepted`, `rejected`, `submitted`, `completed`
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of results per page (default: 10)
- `sortBy` (optional): Sort field (default: `appliedAt`)
- `sortOrder` (optional): `asc` or `desc` (default: `desc`)

**Request Example:**

```javascript
import axios from "axios";

async function fetchMyApplications(filters = {}) {
  try {
    const params = new URLSearchParams();

    if (filters.status && filters.status !== "all") {
      params.append("status", filters.status);
    }
    if (filters.page) {
      params.append("page", filters.page);
    }
    if (filters.limit) {
      params.append("limit", filters.limit);
    }

    const response = await axios.get(
      `/api/applications/my?${params.toString()}`
    );
    return response.data.data; // Contains applications array and pagination
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch applications"
    );
  }
}

// Usage examples:
// const allApps = await fetchMyApplications();
// const pendingApps = await fetchMyApplications({ status: 'pending' });
// const page2 = await fetchMyApplications({ page: 2, limit: 5 });
```

**Response Structure:**

```json
{
  "success": true,
  "message": "Applied tasks retrieved successfully",
  "data": {
    "applications": [
      {
        "id": "APPLICATION_ID",
        "applicationId": "APPLICATION_ID",
        "status": "pending",
        "appliedAt": "2025-07-12T12:00:00Z",
        "message": "Application message",
        "progress": 0,
        "submissionCount": 0,
        "paymentStatus": "pending",
        "expectedDelivery": "2025-07-20T00:00:00Z",
        "daysSinceApplication": 3,
        "daysUntilDeadline": 5,
        "task": {
          "id": "TASK_ID",
          "title": "Build React Component Library",
          "description": "Create reusable components...",
          "company": "TechCorp Inc.",
          "category": "Frontend",
          "difficulty": "Medium",
          "payout": 500,
          "duration": "2 weeks",
          "status": "open",
          "deadline": "2025-07-20T00:00:00Z",
          "client": {
            "_id": "CLIENT_ID",
            "name": "Client Name",
            "email": "client@example.com"
          }
        },
        "feedback": null,
        "recentSubmissions": []
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalCount": 25,
      "hasNext": true,
      "hasPrev": false,
      "nextPage": 2,
      "prevPage": null
    }
  }
}
```

---

## 3. Display Logic for Frontend

### For "My Applied Tasks" Table:

```javascript
// Extract data for display
function formatApplicationForDisplay(application) {
  return {
    id: application.id,
    taskTitle: application.task?.title || "Unknown Task",
    company: application.task?.company || "Unknown Company",
    status: application.status,
    appliedDate: new Date(application.appliedAt).toLocaleDateString(),
    payout: application.task?.payout ? `$${application.task.payout}` : "N/A",
    progress: `${application.progress}%`,
    daysLeft:
      application.daysUntilDeadline > 0
        ? `${application.daysUntilDeadline} days`
        : "Overdue",
  };
}
```

### Status Badge Styling:

```javascript
function getStatusBadgeClass(status) {
  const statusClasses = {
    pending: "bg-yellow-100 text-yellow-800",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    submitted: "bg-blue-100 text-blue-800",
    completed: "bg-purple-100 text-purple-800",
    needs_revision: "bg-orange-100 text-orange-800",
    cancelled: "bg-gray-100 text-gray-800",
  };
  return statusClasses[status] || statusClasses.pending;
}
```

---

## 4. Complete React Example

```javascript
import React, { useState, useEffect } from "react";
import axios from "axios";

// Apply for Task Component
function ApplyTaskButton({ taskId }) {
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await axios.post(`/api/applications/apply/${taskId}`, {
        message: "I'm interested in this project!",
      });
      alert("Application submitted successfully!");
      // Optionally redirect to My Applied Tasks
      // navigate('/my-applied-tasks');
    } catch (error) {
      alert(error.response?.data?.message || "Failed to apply");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <button
      onClick={handleApply}
      disabled={isApplying}
      className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
    >
      {isApplying ? "Applying..." : "Apply for This Task"}
    </button>
  );
}

// My Applied Tasks Component
function MyAppliedTasks() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = filter !== "all" ? { status: filter } : {};
      const response = await axios.get("/api/applications/my", { params });
      setApplications(response.data.data.applications);
    } catch (error) {
      console.error("Failed to fetch applications:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>My Applied Tasks</h2>

      {/* Filter Buttons */}
      <div className="mb-4">
        {[
          "all",
          "pending",
          "accepted",
          "rejected",
          "submitted",
          "completed",
        ].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`mr-2 px-4 py-2 rounded ${
              filter === status ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Applications Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 border">Task</th>
              <th className="px-4 py-2 border">Company</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Applied Date</th>
              <th className="px-4 py-2 border">Payout</th>
              <th className="px-4 py-2 border">Progress</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id}>
                <td className="px-4 py-2 border">
                  {app.task?.title || "Unknown Task"}
                </td>
                <td className="px-4 py-2 border">
                  {app.task?.company || "Unknown Company"}
                </td>
                <td className="px-4 py-2 border">
                  <span
                    className={`px-2 py-1 rounded text-xs ${getStatusBadgeClass(
                      app.status
                    )}`}
                  >
                    {app.status}
                  </span>
                </td>
                <td className="px-4 py-2 border">
                  {new Date(app.appliedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 border">${app.task?.payout || 0}</td>
                <td className="px-4 py-2 border">{app.progress}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {applications.length === 0 && (
        <p className="text-center text-gray-500 mt-4">
          No applications found for the selected filter.
        </p>
      )}
    </div>
  );
}

function getStatusBadgeClass(status) {
  const statusClasses = {
    pending: "bg-yellow-100 text-yellow-800",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    submitted: "bg-blue-100 text-blue-800",
    completed: "bg-purple-100 text-purple-800",
    needs_revision: "bg-orange-100 text-orange-800",
    cancelled: "bg-gray-100 text-gray-800",
  };
  return statusClasses[status] || statusClasses.pending;
}

export { ApplyTaskButton, MyAppliedTasks };
```

---

## 5. Important Notes

1. **Authentication Required**: All endpoints require authentication. Ensure your axios instance includes the auth token in headers.

2. **Error Handling**: Always wrap API calls in try-catch blocks and handle errors appropriately.

3. **Task ID Format**: Use the actual MongoDB ObjectId string for `taskId`, not the display ID from your frontend.

4. **Status Updates**: Applications will automatically update status as they progress through the workflow.

5. **Real-time Updates**: Consider implementing polling or WebSockets to keep application status updated in real-time.

---

## 6. Troubleshooting

- **404 Error**: Ensure you're using the correct endpoint URLs with `/api/applications/apply/:taskId` (not `/api/applications`)
- **401 Error**: Check authentication headers are included in requests
- **400 Error**: Verify the taskId is a valid MongoDB ObjectId and the task exists
- **Empty Results**: Check if the user has any applications or adjust the filter parameters

---

This should resolve all frontend integration issues with your backend!
