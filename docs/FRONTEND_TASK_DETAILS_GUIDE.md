# Frontend Guide to Backend Task Details

This guide provides an overview of the backend structure and instructions for frontend developers to fetch task details, validate data, and understand the backend logic related to tasks.

---

## Backend Structure Overview

The backend is organized into the following key directories:

- **`src/models/`**: Contains Mongoose models, including `Task.js` which defines the schema and methods for tasks.
- **`src/controllers/`**: Contains controllers that handle business logic for various entities.
- **`src/routes/`**: Defines API endpoints and maps them to controllers.
- **`src/middlewares/`**: Includes middleware for validation, authentication, and error handling.
- **`src/services/`**: Contains utility services like token management.
- **`src/utils/`**: Includes helper functions like error handling and logging.

---

## Task Model (`Task.js`)

The `Task` model is defined in `src/models/Task.js`. It includes the following key fields:

- **Basic Fields**: `title`, `description`, `company`, `category`, `difficulty`, `payout`, `duration`, `status`.
- **Relationships**: `clientId` (references the user who created the task), `applicants`, `submissions`, `assignedTo`.
- **Additional Fields**: `requirements`, `skills`, `tags`, `attachments`, `isActive`, `deadline`.

### Key Methods and Middleware

- **Static Methods**:
  - `getTaskStats()`: Fetches overall task statistics.
  - `getCategoryStats()`: Fetches statistics grouped by category.
- **Instance Methods**:
  - `canUserApply(userId)`: Checks if a user can apply for a task.
- **Middleware**:
  - Logs errors during `save` and `findOneAndUpdate` operations.

---

## Fetching Task Details

To fetch task details, use the following API endpoint:

### Endpoint: `GET /api/tasks/:id`

- **Description**: Fetches details of a specific task by its MongoDB ObjectId.
- **Request Parameters**:
  - `id` (Path Parameter): The MongoDB ObjectId of the task to fetch (24 hexadecimal characters).
- **Response**:

  ```json
  {
    "task": {
      "_id": "<task_id>",
      "title": "<task_title>",
      "company": "<company_name>",
      "companyLogo": "<company_initials>",
      "postedDate": "<formatted_date>",
      "deadline": "<time_remaining>",
      "location": "Remote",
      "estimatedTime": "<duration> days",
      "applicants": "<count> developers",
      "payout": <payout_amount>,
      "difficulty": "<Easy|Medium|Hard>",
      "urgency": "<High|Medium>",
      "category": "<Category>",
      "overview": "<task_description>",
      "requirements": ["<requirement1>", "<requirement2>"],
      "deliverables": ["Complete source code", "Documentation", "Testing and quality assurance"],
      "requiredSkills": ["<skill1>", "<skill2>"],
      "benefits": ["Work with cutting-edge technology", "Flexible working hours", "Portfolio addition", "Professional development"]
    }
  }
  ```

- **Error Responses**:
  - `400 Bad Request`: Invalid task ID format
  - `404 Not Found`: Task not found

---

## Validation Logic

The `Task` model includes validation rules for all fields. Key validations include:

- **Title**: Required, max length 100 characters.
- **Description**: Required, max length 1000 characters.
- **Company**: Required, max length 50 characters.
- **Category**: Must be one of `frontend`, `backend`, `fullstack`, `mobile`, `design`, `devops`.
- **Difficulty**: Must be one of `easy`, `medium`, `hard`.
- **Payout**: Must be between 0 and 10,000.
- **Duration**: Must be between 1 and 365 days.
- **Deadline**: Must be in the future.

---

## Example: Fetching Task Details in Frontend

Here is an example of how to fetch task details using `fetch` in JavaScript:

```javascript
const fetchTaskDetails = async (taskId) => {
  try {
    const response = await fetch(`/api/tasks/${taskId}`);
    if (!response.ok) {
      throw new Error(`Error fetching task: ${response.statusText}`);
    }
    const data = await response.json();
    console.log("Task Details:", data.task);
  } catch (error) {
    console.error("Failed to fetch task details:", error);
  }
};

// Example usage with a MongoDB ObjectId
fetchTaskDetails("6872c223ce150d6ca8118609");
```

---

## Task File Submission System

After a task application is approved and assigned, users can submit their completed work files through the application submission system.

### Frontend Implementation Requirements

#### 1. Authentication Setup

**Required Headers for All Submission Requests**:

```javascript
headers: {
  'Authorization': `Bearer ${userToken}`,
  // Don't set Content-Type for FormData - browser sets automatically
}
```

**Token Management**:

- Store JWT token securely (localStorage/sessionStorage/cookies)
- Implement token refresh logic for expired tokens
- Handle 401 responses with redirect to login

#### 2. File Validation (Client-Side)

**Supported File Formats**:

- **PDF** (`.pdf`) - application/pdf
- **Microsoft Word** (`.docx`) - application/vnd.openxmlformats-officedocument.wordprocessingml.document
- **Microsoft Word Legacy** (`.doc`) - application/msword

**File Constraints**:

- **Maximum file size**: 10MB per file
- **Maximum files per submission**: 5 files
- **Total upload limit**: 50MB per submission

**Frontend Validation Function**:

```javascript
const validateFiles = (files) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  const allowedExtensions = [".pdf", ".doc", ".docx"];
  const maxFileSize = 10 * 1024 * 1024; // 10MB
  const maxFiles = 5;

  const errors = [];

  if (files.length > maxFiles) {
    errors.push(`Maximum ${maxFiles} files allowed`);
  }

  files.forEach((file, index) => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(
        `File ${index + 1}: Invalid file type. Only PDF, DOC, and DOCX allowed`
      );
    }

    // Check file extension
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!allowedExtensions.includes(extension)) {
      errors.push(`File ${index + 1}: Invalid file extension`);
    }

    // Check file size
    if (file.size > maxFileSize) {
      errors.push(`File ${index + 1}: File size exceeds 10MB limit`);
    }
  });

  return errors;
};
```

#### 3. Required API Endpoints to Implement

**Get User Applications** (to get applicationId):

```javascript
GET /api/applications/my?status=approved&limit=50&page=1
```

**Submit Files**:

```javascript
POST /api/applications/:applicationId/submit
```

**Delete Submission File**:

```javascript
DELETE /api/applications/:applicationId/submissions/:submissionId
```

**Get Application Details** (to view submissions):

```javascript
GET /api/applications/:applicationId
```

#### 4. Complete File Submission Implementation

**HTML File Input**:

```html
<input
  type="file"
  id="fileInput"
  multiple
  accept=".pdf,.doc,.docx"
  onChange="{handleFileSelect}"
/>
<div id="fileList"></div>
<button onClick="{handleSubmit}" disabled="{!selectedFiles.length}">
  Submit Files
</button>
```

**React Component Example**:

```javascript
import React, { useState } from "react";

const FileSubmissionComponent = ({ applicationId, authToken }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState([]);

  const validateFiles = (files) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const maxFiles = 5;

    const errors = [];

    if (files.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
      return errors;
    }

    Array.from(files).forEach((file, index) => {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`File ${index + 1}: Invalid file type`);
      }
      if (file.size > maxFileSize) {
        errors.push(`File ${index + 1}: File too large (max 10MB)`);
      }
    });

    return errors;
  };

  const handleFileSelect = (event) => {
    const files = event.target.files;
    const validationErrors = validateFiles(files);

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setSelectedFiles([]);
    } else {
      setErrors([]);
      setSelectedFiles(Array.from(files));
    }
  };

  const submitFiles = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setErrors([]);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("submissions", file);
    });

    try {
      const response = await fetch(
        `/api/applications/${applicationId}/submit`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Submission failed");
      }

      const result = await response.json();
      console.log("Files submitted successfully:", result);

      // Reset form
      setSelectedFiles([]);
      document.getElementById("fileInput").value = "";

      // Show success message
      alert("Files submitted successfully!");
    } catch (error) {
      console.error("Submission error:", error);
      setErrors([error.message]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-submission">
      <h3>Submit Your Work</h3>

      <div className="file-input-section">
        <input
          type="file"
          id="fileInput"
          multiple
          accept=".pdf,.doc,.docx"
          onChange={handleFileSelect}
          disabled={uploading}
        />
        <p className="help-text">
          Upload PDF, DOC, or DOCX files (max 10MB each, 5 files total)
        </p>
      </div>

      {errors.length > 0 && (
        <div className="error-messages">
          {errors.map((error, index) => (
            <p key={index} className="error">
              {error}
            </p>
          ))}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="file-list">
          <h4>Selected Files:</h4>
          {selectedFiles.map((file, index) => (
            <div key={index} className="file-item">
              <span>{file.name}</span>
              <span>({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={submitFiles}
        disabled={!selectedFiles.length || uploading}
        className="submit-button"
      >
        {uploading ? "Uploading..." : "Submit Files"}
      </button>
    </div>
  );
};

export default FileSubmissionComponent;
```

#### 5. File Management Functions

**Get User Applications**:

```javascript
const getUserApplications = async (authToken, status = "approved") => {
  try {
    const response = await fetch(
      `/api/applications/my?status=${status}&limit=50&page=1`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch applications");

    const data = await response.json();
    return data.applications;
  } catch (error) {
    console.error("Error fetching applications:", error);
    throw error;
  }
};
```

**Get Application Details with Submissions**:

```javascript
const getApplicationDetails = async (applicationId, authToken) => {
  try {
    const response = await fetch(`/api/applications/${applicationId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) throw new Error("Failed to fetch application details");

    const data = await response.json();
    return data.application;
  } catch (error) {
    console.error("Error fetching application details:", error);
    throw error;
  }
};
```

**Delete Submission File**:

```javascript
const deleteSubmissionFile = async (applicationId, submissionId, authToken) => {
  try {
    const response = await fetch(
      `/api/applications/${applicationId}/submissions/${submissionId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!response.ok) throw new Error("Failed to delete submission");

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error deleting submission:", error);
    throw error;
  }
};
```

#### 6. UI/UX Requirements

**File Upload Interface**:

- Drag & drop file upload area
- File type and size validation with clear error messages
- Progress indicator during upload
- File preview with name, size, and type
- Remove file option before submission

**Application Status Display**:

- Show application status (pending, approved, in_progress, completed)
- Display submission history with file names and upload dates
- Show submission count vs. maximum allowed

**Error Handling UI**:

- Toast notifications for success/error messages
- Inline validation errors for file constraints
- Network error handling with retry options
- Loading states during API calls

#### 7. State Management Requirements

**Application State**:

```javascript
const [applications, setApplications] = useState([]);
const [selectedApplication, setSelectedApplication] = useState(null);
const [submissions, setSubmissions] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
```

**File Upload State**:

```javascript
const [selectedFiles, setSelectedFiles] = useState([]);
const [uploading, setUploading] = useState(false);
const [uploadProgress, setUploadProgress] = useState(0);
const [validationErrors, setValidationErrors] = useState([]);
```

#### 8. Required API Response Handling

**Successful Submission Response**:

```json
{
  "success": true,
  "message": "Files submitted successfully",
  "data": {
    "submissionCount": 3,
    "totalSubmissions": 3,
    "newSubmissions": [
      {
        "_id": "submissionId1",
        "filename": "unique-filename.pdf",
        "originalName": "my-document.pdf",
        "size": 1024000,
        "uploadedAt": "2025-07-13T10:00:00Z"
      }
    ]
  }
}
```

**Error Response Examples**:

```json
// Authentication Error
{
  "status": "fail",
  "message": "You are not logged in. Please log in to get access.",
  "error": { "statusCode": 401 }
}

// File Validation Error
{
  "status": "fail",
  "message": "Please upload only PDF or DOCX files",
  "error": { "statusCode": 400 }
}

// File Size Error
{
  "status": "fail",
  "message": "File size too large. Maximum size is 10MB per file",
  "error": { "statusCode": 400 }
}
```

#### 9. Integration Workflow

**Step 1: User Authentication**

1. User logs in and receives JWT token
2. Store token securely for API requests
3. Implement token refresh mechanism

**Step 2: Get User Applications**

```javascript
// Fetch approved applications where user can submit files
const applications = await getUserApplications(authToken, "approved");
const activeApplications = applications.filter(
  (app) => app.status === "approved" || app.status === "in_progress"
);
```

**Step 3: Application Selection**

```javascript
// User selects an application to submit files for
const selectedApp = activeApplications.find(
  (app) => app._id === selectedApplicationId
);
```

**Step 4: File Selection & Validation**

```javascript
// User selects files, validate on client-side
const validationErrors = validateFiles(selectedFiles);
if (validationErrors.length > 0) {
  // Show errors to user
  return;
}
```

**Step 5: File Submission**

```javascript
// Submit files to backend
const result = await submitFiles(applicationId, selectedFiles, authToken);
```

**Step 6: Update UI**

```javascript
// Refresh application details to show new submissions
const updatedApp = await getApplicationDetails(applicationId, authToken);
setApplicationDetails(updatedApp);
```

#### 10. Testing Requirements

**Frontend Testing Checklist**:

- [ ] File type validation (accept only PDF, DOC, DOCX)
- [ ] File size validation (max 10MB per file)
- [ ] Multiple file validation (max 5 files)
- [ ] Authentication token handling
- [ ] Error message display
- [ ] Loading states during upload
- [ ] Success feedback after submission
- [ ] File removal before submission
- [ ] Network error handling
- [ ] Form reset after successful submission

**Test Cases to Implement**:

```javascript
// Test invalid file types
const invalidFiles = [new File(["test"], "test.txt", { type: "text/plain" })];
expect(validateFiles(invalidFiles)).toContain("Invalid file type");

// Test file size limits
const largeFile = new File(["x".repeat(11 * 1024 * 1024)], "large.pdf", {
  type: "application/pdf",
});
expect(validateFiles([largeFile])).toContain("File too large");

// Test file count limits
const tooManyFiles = Array(6)
  .fill()
  .map(
    (_, i) => new File(["test"], `file${i}.pdf`, { type: "application/pdf" })
  );
expect(validateFiles(tooManyFiles)).toContain("Maximum 5 files allowed");
```

### Common Error Responses & Frontend Handling

- **401 Unauthorized**:

  - Frontend Action: Redirect to login page, clear stored token
  - User Message: "Your session has expired. Please log in again."

- **400 Bad Request - Invalid File Format**:

  - Frontend Action: Show validation error, prevent submission
  - User Message: "Please upload only PDF, DOC, or DOCX files."

- **400 Bad Request - File Size**:

  - Frontend Action: Show size error, highlight large files
  - User Message: "File size must be under 10MB. Please compress or choose a smaller file."

- **400 Bad Request - Too Many Files**:

  - Frontend Action: Limit file selection, show count warning
  - User Message: "Maximum 5 files allowed per submission."

- **404 Not Found**:

  - Frontend Action: Refresh application list, show error
  - User Message: "Application not found. Please refresh and try again."

- **500 Internal Server Error**:
  - Frontend Action: Show retry option, log error
  - User Message: "Upload failed due to server error. Please try again."

---

## Additional Notes

- **Error Handling**: The backend logs validation errors during `save` and `update` operations. Check the server logs for details.
- **Indexes**: The `Task` model includes indexes for better query performance on fields like `category`, `difficulty`, `status`, and `payout`.
- **Virtual Fields**:
  - `applicantCount`: Returns the number of applicants for a task.
  - `daysUntilDeadline`: Returns the number of days remaining until the deadline.

---

For further details, refer to the backend documentation or contact the backend team.

### Troubleshooting Common Errors

#### 401 Unauthorized

- **Cause**: Missing or invalid JWT token in the `Authorization` header.
- **Solution**:
  1. Ensure the frontend sends the `Authorization` header with a valid JWT token.
  2. Verify the token is not expired and matches the backend's expected format.
  3. Implement token refresh logic for expired tokens.
  4. Handle 401 responses by redirecting the user to the login page and clearing stored tokens.

#### 400 Bad Request

- **Cause**: File validation errors such as unsupport
  ed file types, exceeding file size limits, or exceeding the maximum number of files allowed.
- **Solution**:
  1. Ensure the frontend validates files before submission using the provided `validateFiles` function.
  2. Check that the selected files meet the backend's constraints:
     - Supported file types: PDF, DOC, DOCX.
     - Maximum file size: 10MB per file.
     - Maximum files per submission: 5 files.
  3. Do not manually set the `Content-Type` header when using `FormData`.
  4. Display clear error messages to the user for invalid files and prevent submission.
