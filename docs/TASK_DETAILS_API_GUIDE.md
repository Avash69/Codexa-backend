# Task Details API Guide

## Overview

This document provides details about the Task Details API and its integration with the frontend application.

---

## API Endpoint

### `GET /api/tasks/:id`

#### Description

Fetches the details of a specific task by its MongoDB ObjectId (`_id`).

#### Access

Public (no authentication required).

#### Request Parameters

- **Path Parameter:**
  - `id` (string): The MongoDB ObjectId of the task.

#### Response Structure

```json
{
  "success": true,
  "data": {
    "task": {
      "_id": "60f7c2b8e1b1c8a1b8e1b1c8",
      "title": "Sample Task",
      "description": "Task details...",
      "company": "Acme Corp",
      "category": "Development",
      "difficulty": "Medium",
      "payout": 100,
      "deadline": "2025-07-31T23:59:59.000Z",
      "applicants": 5,
      "requiredSkills": ["JavaScript", "React"],
      "benefits": ["Flexible hours", "Remote work"],
      "requirements": ["Experience with React", "Good communication skills"],
      "deliverables": ["Codebase", "Documentation"],
      "location": "Remote",
      "postedDate": "2025-07-01T12:00:00.000Z",
      "estimatedTime": "2 weeks"
    }
  }
}
```

#### Error Responses

- **400 Bad Request:** Invalid task ID format.
  ```json
  {
    "success": false,
    "message": "Invalid task ID format. Please use a valid task identifier."
  }
  ```
- **404 Not Found:** Task not found.
  ```json
  {
    "success": false,
    "message": "Task not found."
  }
  ```

---

## Frontend Integration

### Fetching Task Details

Use the `getTaskById` function to fetch task details from the backend.

#### Example Implementation

```javascript
import axios from "axios";

export const getTaskById = async (id) => {
  const response = await axios.get(`/api/tasks/${id}`);
  return response.data; // Ensure this matches the backend response structure
};
```

### Accessing Task Data

Ensure the frontend accesses the task object correctly:

```javascript
const taskObj = result?.data?.task || null;
```

### Error Handling

Handle errors gracefully in the frontend:

```javascript
if (!taskObj || !taskObj._id) {
  setError("Task not found");
  setTask(null);
} else {
  setTask(taskObj);
}
```

---

## Notes

- Always use MongoDB ObjectId (`_id`) for all task-related operations.
- Ensure the frontend matches the backend response structure.
- Test the API thoroughly to handle edge cases like invalid IDs or missing tasks.

---

## Contact

For further assistance, contact the backend team or refer to the project documentation.
