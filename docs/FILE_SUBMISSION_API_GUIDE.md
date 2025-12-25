# File Submission API Guide

## 📋 Overview

This guide provides complete information about the file submission system in the Codexa backend. The system allows users to submit work files for accepted task applications.

## 🔗 API Endpoints

### 1. Submit Files

```
POST /api/applications/:applicationId/submit
```

**Purpose**: Submit work files for an accepted application  
**Authentication**: Required (JWT Bearer token)  
**Content-Type**: `multipart/form-data`

### 2. Delete Submission File

```
DELETE /api/applications/:applicationId/submissions/:submissionId
```

**Purpose**: Delete a specific submitted file  
**Authentication**: Required (JWT Bearer token)

### 3. Get Application Details

```
GET /api/applications/:applicationId
```

**Purpose**: Get application details including all submissions  
**Authentication**: Required (JWT Bearer token)

### 4. Get User Applications

```
GET /api/applications/my
```

**Purpose**: Get all applications for the authenticated user  
**Authentication**: Required (JWT Bearer token)  
**Query Parameters**:

- `status` (optional): Filter by application status

## 📁 File Constraints

### **Supported File Types**

- **PDF** (`.pdf`) - `application/pdf`
- **Microsoft Word** (`.docx`) - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- **Microsoft Word Legacy** (`.doc`) - `application/msword`

### **File Limits**

- **Maximum file size**: 10MB per file
- **Maximum files per submission**: 5 files total
- **Field name**: Any field name accepted (backend uses `multer.any()`)

## 🔐 Authentication

All endpoints require JWT authentication in the Authorization header:

```javascript
headers: {
  'Authorization': `Bearer ${userToken}`
}
```

## 🛠 Frontend Implementation

### 1. File Validation Function

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
    return errors;
  }

  Array.from(files).forEach((file, index) => {
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

### 2. Submit Files Function

```javascript
const submitFiles = async (applicationId, files, authToken) => {
  // Validate files first
  const validationErrors = validateFiles(files);
  if (validationErrors.length > 0) {
    throw new Error(validationErrors.join(", "));
  }

  const formData = new FormData();

  // Add files to FormData (any field name works)
  files.forEach((file, index) => {
    formData.append("submissions", file); // or use any field name
  });

  try {
    const response = await fetch(`/api/applications/${applicationId}/submit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        // Don't set Content-Type - browser will set it with boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Submission failed");
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("File submission error:", error);
    throw error;
  }
};
```

### 3. Get User Applications

```javascript
const getUserApplications = async (authToken, status = null) => {
  const params = new URLSearchParams();
  if (status) params.append("status", status);

  try {
    const response = await fetch(`/api/applications/my?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch applications");
    }

    const data = await response.json();
    return data.data.applications;
  } catch (error) {
    console.error("Error fetching applications:", error);
    throw error;
  }
};
```

### 4. Get Application Details

```javascript
const getApplicationDetails = async (applicationId, authToken) => {
  try {
    const response = await fetch(`/api/applications/${applicationId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch application details");
    }

    const data = await response.json();
    return data.data.application;
  } catch (error) {
    console.error("Error fetching application details:", error);
    throw error;
  }
};
```

### 5. Delete Submission File

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

    if (!response.ok) {
      throw new Error("Failed to delete submission");
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error deleting submission:", error);
    throw error;
  }
};
```

## 📊 Data Structures

### Application Object Structure

```javascript
{
  _id: "applicationId",
  userId: "userId",
  taskId: "taskId",
  status: "accepted", // pending, accepted, rejected, submitted, completed, needs_revision, cancelled
  appliedAt: "2025-07-13T10:00:00Z",
  message: "Application message",
  submissions: [
    {
      _id: "submissionId",
      filename: "userId-taskId-timestamp.pdf", // Generated filename
      originalName: "my-document.pdf", // Original filename
      path: "/uploads/submissions/userId-taskId-timestamp.pdf",
      size: 1024000, // File size in bytes
      mimetype: "application/pdf",
      uploadedAt: "2025-07-13T10:00:00Z"
    }
  ],
  progress: 25, // 0-100
  // ... other fields
}
```

### Successful Submission Response

```javascript
{
  success: true,
  message: "Files submitted successfully",
  data: {
    applicationId: "applicationId",
    submissions: [
      {
        _id: "submissionId",
        filename: "userId-taskId-timestamp.pdf",
        originalName: "my-document.pdf",
        path: "/uploads/submissions/userId-taskId-timestamp.pdf",
        size: 1024000,
        mimetype: "application/pdf",
        uploadedAt: "2025-07-13T10:00:00Z"
      }
    ]
  }
}
```

## 🚨 Error Responses

### Common Error Codes

| Status Code | Error Message                                            | Cause                      |
| ----------- | -------------------------------------------------------- | -------------------------- |
| 400         | "File size too large. Maximum size is 10MB per file"     | File exceeds size limit    |
| 400         | "Too many files. Maximum 5 files allowed per submission" | More than 5 files uploaded |
| 400         | "Please upload only PDF or DOCX files"                   | Invalid file type          |
| 401         | "You are not logged in! Please log in to get access"     | Missing/invalid JWT token  |
| 403         | "You can only submit files for your own applications"    | Unauthorized access        |
| 404         | "Application not found"                                  | Invalid application ID     |
| 404         | "Submission not found"                                   | Invalid submission ID      |

### Error Response Format

```javascript
{
  success: false,
  message: "Error message",
  error: {
    statusCode: 400,
    status: "fail"
  }
}
```

## 🔄 Workflow

### Complete File Submission Workflow

1. **User applies to a task** → Gets `applicationId`
2. **Application gets accepted** → User can submit files
3. **User submits work files** → Files stored with metadata
4. **Optional: Delete specific files** → Remove unwanted submissions
5. **Task owner reviews submissions** → Can request revisions or mark complete

### Application Status Flow

```
pending → accepted → submitted → completed
    ↓         ↓         ↓
 rejected  cancelled  needs_revision
```

## 📝 React Component Example

```jsx
import React, { useState } from "react";

const FileSubmissionComponent = ({ applicationId, authToken }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validationErrors = validateFiles(selectedFiles);

    if (validationErrors.length > 0) {
      setError(validationErrors.join(", "));
      return;
    }

    setFiles(selectedFiles);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (files.length === 0) {
      setError("Please select files to upload");
      return;
    }

    setUploading(true);
    setError("");

    try {
      await submitFiles(applicationId, files, authToken);
      alert("Files submitted successfully!");
      setFiles([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="files">
          Select files (PDF, DOC, DOCX - Max 5 files, 10MB each):
        </label>
        <input
          type="file"
          id="files"
          multiple
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </div>

      {error && <div style={{ color: "red" }}>{error}</div>}

      {files.length > 0 && (
        <div>
          <h4>Selected Files:</h4>
          <ul>
            {files.map((file, index) => (
              <li key={index}>
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </li>
            ))}
          </ul>
        </div>
      )}

      <button type="submit" disabled={uploading || files.length === 0}>
        {uploading ? "Uploading..." : "Submit Files"}
      </button>
    </form>
  );
};

export default FileSubmissionComponent;
```

## 🔧 Backend Configuration

### File Storage

- **Location**: `/uploads/submissions/`
- **Naming Pattern**: `{userId}-{taskId}-{timestamp}.{extension}`
- **Example**: `60f1b2e4d5a8b7c9e1f2a3b4-60f1b2e4d5a8b7c9e1f2a3b5-1625097600000.pdf`

### Middleware Stack

```javascript
// Route with middleware
router.post(
  "/:id/submit",
  authController.protect, // Authentication
  uploadTaskSubmission, // File upload (multer.any())
  handleSubmissionUploadError, // Error handling
  applicationController.submitFiles // Controller
);
```

## 🧪 Testing

### Test File Upload with cURL

```bash
curl -X POST \
  http://localhost:3000/api/applications/APPLICATION_ID/submit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "files=@/path/to/your/document.pdf"
```

### Test Delete Submission

```bash
curl -X DELETE \
  http://localhost:3000/api/applications/APPLICATION_ID/submissions/SUBMISSION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📱 Mobile Considerations

For React Native or mobile apps:

```javascript
// React Native file upload
const uploadMobileFiles = async (applicationId, fileUri, authToken) => {
  const formData = new FormData();

  formData.append("submissions", {
    uri: fileUri,
    type: "application/pdf", // or detected mime type
    name: "document.pdf",
  });

  const response = await fetch(`/api/applications/${applicationId}/submit`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "multipart/form-data",
    },
    body: formData,
  });

  return response.json();
};
```

## 🔍 Troubleshooting

### Common Issues

1. **"Unexpected file field" Error**

   - **Cause**: Using wrong field name with `multer.single()`
   - **Solution**: Use any field name or ensure field name matches "submission"

2. **File Type Rejection**

   - **Cause**: Browser sends different MIME type than expected
   - **Solution**: Check both file extension and MIME type validation

3. **Large File Upload Fails**

   - **Cause**: File exceeds 10MB limit or server timeout
   - **Solution**: Compress files or implement chunked upload for larger files

4. **Authentication Errors**
   - **Cause**: Missing or expired JWT token
   - **Solution**: Ensure valid token in Authorization header

### Debug Mode

Add this to enable detailed logging:

```javascript
// Add to submissionFileFilter for debugging
console.log("File details:", {
  originalname: file.originalname,
  mimetype: file.mimetype,
  size: file.size,
});
```
