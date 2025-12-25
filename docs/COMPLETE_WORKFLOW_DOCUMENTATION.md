# Complete Task Application & Submission Workflow Documentation

## Overview

This documentation covers the complete 6-step workflow for task applications and submissions, along with all necessary backend endpoints, frontend integration code, and design suggestions.

## 6-Step Workflow

1. **User applies for task** → Status: `pending`
2. **Admin approves application** → Status: `accepted`
3. **User works on task** → Status: `accepted` (user can update progress)
4. **User submits PDF/DOCX file(s)** → Status: `submitted`
5. **Admin reviews submission** → Status: `completed` or `needs_revision`
6. **Optional: Re-submission** → Back to step 4 if `needs_revision`

## Backend API Endpoints

### User Endpoints

#### 1. Apply for Task

```
POST /api/applications/apply/:taskId
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "message": "I would like to apply for this task because..."
}

Response:
{
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "application": {
      "_id": "applicationId",
      "status": "pending",
      "appliedAt": "2025-01-10T10:00:00Z",
      "taskId": { "title": "Task Title", "payout": 50 },
      "userId": { "name": "John Doe", "email": "john@example.com" }
    }
  }
}
```

#### 2. Get User's Applications

```
GET /api/applications/my
Authorization: Bearer <token>

Query Parameters:
- page: number (default: 1)
- limit: number (default: 10)
- status: string (optional: pending, accepted, submitted, completed, needs_revision)

Response:
{
  "success": true,
  "data": {
    "applications": [
      {
        "_id": "applicationId",
        "status": "accepted",
        "appliedAt": "2025-01-10T10:00:00Z",
        "progress": 25,
        "taskId": { "title": "Task Title", "payout": 50 },
        "submissions": []
      }
    ],
    "totalPages": 1,
    "currentPage": 1,
    "total": 1
  }
}
```

#### 3. Submit Files for Application

```
POST /api/applications/:applicationId/submit
Content-Type: multipart/form-data
Authorization: Bearer <token>

Form Data:
- files[]: File (PDF/DOCX files)

Response:
{
  "success": true,
  "message": "Files submitted successfully",
  "data": {
    "applicationId": "applicationId",
    "submittedFiles": [
      {
        "filename": "unique-filename.pdf",
        "originalName": "My-Project.pdf",
        "size": 1024000,
        "mimetype": "application/pdf",
        "uploadedAt": "2025-01-10T12:00:00Z"
      }
    ],
    "totalSubmissions": 1,
    "progress": 25
  }
}
```

#### 4. Update Application Progress

```
PUT /api/applications/:applicationId/progress
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "progress": 75
}

Response:
{
  "success": true,
  "message": "Progress updated successfully",
  "data": {
    "applicationId": "applicationId",
    "progress": 75
  }
}
```

#### 5. Get Application Details

```
GET /api/applications/:applicationId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "application": {
      "_id": "applicationId",
      "status": "submitted",
      "progress": 100,
      "submissions": [
        {
          "_id": "submissionId",
          "originalName": "My-Project.pdf",
          "size": 1024000,
          "uploadedAt": "2025-01-10T12:00:00Z"
        }
      ],
      "adminReview": {
        "status": "pending",
        "comments": ""
      },
      "taskId": { "title": "Task Title", "description": "Task description" }
    }
  }
}
```

### Admin Endpoints

#### 1. Get All Applications

```
GET /api/admin/applications
Authorization: Bearer <admin-token>

Query Parameters:
- page: number (default: 1)
- limit: number (default: 10)
- status: string (optional filter)

Response:
{
  "status": "success",
  "data": {
    "applications": [...],
    "totalPages": 5,
    "currentPage": 1,
    "total": 45
  }
}
```

#### 2. Update Application Status (Approve/Reject)

```
PATCH /api/admin/applications/:applicationId/status
Authorization: Bearer <admin-token>

Body:
{
  "status": "accepted", // or "rejected"
  "comments": "Application approved based on qualifications"
}

Response:
{
  "status": "success",
  "message": "Application status updated successfully",
  "data": {
    "applicationId": "applicationId",
    "status": "accepted",
    "comments": "Application approved based on qualifications"
  }
}
```

#### 3. Get Applications with Submissions (For Review)

```
GET /api/admin/submissions
Authorization: Bearer <admin-token>

Query Parameters:
- page: number (default: 1)
- limit: number (default: 10)
- status: string (default: "submitted")

Response:
{
  "status": "success",
  "data": {
    "applications": [
      {
        "_id": "applicationId",
        "status": "submitted",
        "submissions": [
          {
            "_id": "submissionId",
            "originalName": "Project-File.pdf",
            "size": 1024000,
            "uploadedAt": "2025-01-10T12:00:00Z"
          }
        ],
        "taskId": { "title": "Task Title", "payout": 50 },
        "userId": { "name": "John Doe", "email": "john@example.com" }
      }
    ],
    "totalPages": 3,
    "currentPage": 1,
    "total": 25
  }
}
```

#### 4. Get Application Submission Details

```
GET /api/admin/applications/:applicationId/submissions
Authorization: Bearer <admin-token>

Response:
{
  "status": "success",
  "data": {
    "application": {
      "_id": "applicationId",
      "status": "submitted",
      "submissions": [...],
      "taskId": { "title": "Task Title", "description": "Full description" },
      "userId": { "name": "John Doe", "email": "john@example.com", "profileImage": "..." },
      "adminReview": {
        "status": "pending",
        "comments": ""
      }
    }
  }
}
```

#### 5. Download Submission File

```
GET /api/admin/applications/:applicationId/submissions/:submissionId/download
Authorization: Bearer <admin-token>

Response: File download with proper headers
```

#### 6. Review Application Submission

```
PATCH /api/admin/applications/:applicationId/review
Authorization: Bearer <admin-token>

Body:
{
  "status": "accepted", // or "needs_revision"
  "comments": "Great work! Task completed successfully." // or "Please revise the document format"
}

Response:
{
  "status": "success",
  "message": "Application submission reviewed successfully",
  "data": {
    "applicationId": "applicationId",
    "status": "completed", // or "needs_revision"
    "adminReview": {
      "reviewedBy": "adminId",
      "reviewedAt": "2025-01-10T14:00:00Z",
      "status": "accepted",
      "comments": "Great work! Task completed successfully."
    }
  }
}
```

## Frontend Integration Code

### React Components

#### 1. User Dashboard - Application Status Component

```jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const ApplicationStatusCard = ({ application }) => {
  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      accepted: "bg-green-100 text-green-800",
      submitted: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      needs_revision: "bg-red-100 text-red-800",
      rejected: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status) => {
    const texts = {
      pending: "Pending Review",
      accepted: "Approved - Work in Progress",
      submitted: "Submitted - Under Review",
      completed: "Completed",
      needs_revision: "Needs Revision",
      rejected: "Rejected",
    };
    return texts[status] || status;
  };

  const canSubmitFiles = () => {
    return (
      application.status === "accepted" ||
      application.status === "needs_revision"
    );
  };

  const canUpdateProgress = () => {
    return application.status === "accepted";
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {application.taskId.title}
          </h3>
          <p className="text-sm text-gray-600">${application.taskId.payout}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
            application.status
          )}`}
        >
          {getStatusText(application.status)}
        </span>
      </div>

      {/* Progress Bar */}
      {application.status === "accepted" && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{application.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${application.progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Submission Count */}
      {application.submissions && application.submissions.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            📎 {application.submissions.length} file(s) submitted
          </p>
        </div>
      )}

      {/* Admin Review */}
      {application.adminReview &&
        application.adminReview.status !== "pending" && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Admin Review
            </h4>
            <p className="text-sm text-gray-700">
              {application.adminReview.comments}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Reviewed on{" "}
              {new Date(
                application.adminReview.reviewedAt
              ).toLocaleDateString()}
            </p>
          </div>
        )}

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        {canUpdateProgress() && (
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Update Progress
          </button>
        )}
        {canSubmitFiles() && (
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            Submit Files
          </button>
        )}
        <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
          View Details
        </button>
      </div>
    </div>
  );
};

export default ApplicationStatusCard;
```

#### 2. File Upload Component

```jsx
import React, { useState } from "react";
import axios from "axios";

const FileUploadComponent = ({ applicationId, onUploadSuccess }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(
      (file) =>
        file.type === "application/pdf" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await axios.post(
        `/api/applications/${applicationId}/submit`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      onUploadSuccess(response.data);
      setFiles([]);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Submit Your Work</h2>

      {/* Drag & Drop Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="space-y-2">
          <div className="text-gray-500">
            <svg
              className="mx-auto h-12 w-12"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="text-gray-600">
            <p className="text-lg">Drag and drop your files here</p>
            <p className="text-sm">or</p>
          </div>
          <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <span>Browse Files</span>
            <input
              type="file"
              multiple
              accept=".pdf,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
          <p className="text-xs text-gray-500">
            Support for PDF and DOCX files only
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Selected Files</h3>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-blue-600">📄</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={uploadFiles}
            disabled={uploading}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              uploading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {uploading ? "Uploading..." : `Upload ${files.length} File(s)`}
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUploadComponent;
```

#### 3. Admin Review Component

```jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const AdminReviewComponent = ({ applicationId }) => {
  const [application, setApplication] = useState(null);
  const [reviewStatus, setReviewStatus] = useState("accepted");
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchApplicationDetails();
  }, [applicationId]);

  const fetchApplicationDetails = async () => {
    try {
      const response = await axios.get(
        `/api/admin/applications/${applicationId}/submissions`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );
      setApplication(response.data.data.application);
    } catch (error) {
      console.error("Error fetching application details:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (submissionId, filename) => {
    try {
      const response = await axios.get(
        `/api/admin/applications/${applicationId}/submissions/${submissionId}/download`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const submitReview = async () => {
    setSubmitting(true);
    try {
      await axios.patch(
        `/api/admin/applications/${applicationId}/review`,
        {
          status: reviewStatus,
          comments: comments,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );

      alert("Review submitted successfully!");
      fetchApplicationDetails(); // Refresh data
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Error submitting review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (!application)
    return <div className="text-center py-8">Application not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {application.taskId.title}
              </h1>
              <p className="text-gray-600 mt-1">${application.taskId.payout}</p>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {application.status}
            </span>
          </div>
        </div>

        {/* User Information */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Applicant Information</h2>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
              {application.userId.profileImage ? (
                <img
                  src={application.userId.profileImage}
                  alt={application.userId.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <span className="text-gray-600 font-medium">
                  {application.userId.name.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {application.userId.name}
              </p>
              <p className="text-gray-600">{application.userId.email}</p>
            </div>
          </div>
        </div>

        {/* Task Description */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Task Description</h2>
          <p className="text-gray-700">{application.taskId.description}</p>
        </div>

        {/* Submissions */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Submitted Files</h2>
          <div className="space-y-3">
            {application.submissions.map((submission, index) => (
              <div
                key={submission._id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">📄</div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {submission.originalName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(submission.size / 1024 / 1024).toFixed(2)} MB • Uploaded{" "}
                      {new Date(submission.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    downloadFile(submission._id, submission.originalName)
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Review Section */}
        {application.status === "submitted" && (
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Review Submission</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Decision
                </label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="accepted">Accept - Mark as Completed</option>
                  <option value="needs_revision">
                    Needs Revision - Request Changes
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows="4"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Provide feedback on the submission..."
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={submitReview}
                  disabled={submitting}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    submitting
                      ? "bg-gray-400 cursor-not-allowed"
                      : reviewStatus === "accepted"
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-yellow-600 hover:bg-yellow-700 text-white"
                  }`}
                >
                  {submitting
                    ? "Submitting..."
                    : reviewStatus === "accepted"
                    ? "Accept & Complete"
                    : "Request Revision"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Previous Review */}
        {application.adminReview &&
          application.adminReview.status !== "pending" && (
            <div className="p-6 bg-gray-50">
              <h2 className="text-lg font-semibold mb-4">Previous Review</h2>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Status:</strong> {application.adminReview.status}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Comments:</strong> {application.adminReview.comments}
                </p>
                <p className="text-xs text-gray-500">
                  Reviewed on{" "}
                  {new Date(
                    application.adminReview.reviewedAt
                  ).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default AdminReviewComponent;
```

### API Client Functions

```javascript
// Enhanced API Client for the complete workflow
class WorkflowAPI {
  constructor() {
    this.baseURL = "/api";
    this.adminURL = "/api/admin";
  }

  // Get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  getAdminHeaders() {
    const token = localStorage.getItem("adminToken");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  // User Methods
  async applyForTask(taskId, message) {
    const response = await fetch(
      `${this.baseURL}/applications/apply/${taskId}`,
      {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ message }),
      }
    );
    return response.json();
  }

  async getMyApplications(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(
      `${this.baseURL}/applications/my?${queryString}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return response.json();
  }

  async getApplicationDetails(applicationId) {
    const response = await fetch(
      `${this.baseURL}/applications/${applicationId}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return response.json();
  }

  async submitFiles(applicationId, files) {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const response = await fetch(
      `${this.baseURL}/applications/${applicationId}/submit`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      }
    );
    return response.json();
  }

  async updateProgress(applicationId, progress) {
    const response = await fetch(
      `${this.baseURL}/applications/${applicationId}/progress`,
      {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ progress }),
      }
    );
    return response.json();
  }

  // Admin Methods
  async getAllApplications(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(
      `${this.adminURL}/applications?${queryString}`,
      {
        headers: this.getAdminHeaders(),
      }
    );
    return response.json();
  }

  async updateApplicationStatus(applicationId, status, comments) {
    const response = await fetch(
      `${this.adminURL}/applications/${applicationId}/status`,
      {
        method: "PATCH",
        headers: this.getAdminHeaders(),
        body: JSON.stringify({ status, comments }),
      }
    );
    return response.json();
  }

  async getSubmittedApplications(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(
      `${this.adminURL}/submissions?${queryString}`,
      {
        headers: this.getAdminHeaders(),
      }
    );
    return response.json();
  }

  async getApplicationSubmissionDetails(applicationId) {
    const response = await fetch(
      `${this.adminURL}/applications/${applicationId}/submissions`,
      {
        headers: this.getAdminHeaders(),
      }
    );
    return response.json();
  }

  async reviewApplicationSubmission(applicationId, status, comments) {
    const response = await fetch(
      `${this.adminURL}/applications/${applicationId}/review`,
      {
        method: "PATCH",
        headers: this.getAdminHeaders(),
        body: JSON.stringify({ status, comments }),
      }
    );
    return response.json();
  }

  async downloadSubmissionFile(applicationId, submissionId) {
    const response = await fetch(
      `${this.adminURL}/applications/${applicationId}/submissions/${submissionId}/download`,
      {
        headers: this.getAdminHeaders(),
      }
    );
    return response.blob();
  }
}

// Export singleton instance
export const workflowAPI = new WorkflowAPI();
```

## Frontend Design Suggestions

### 1. User Dashboard Design

**Layout:**

- Clean, card-based layout showing all applications
- Status indicators with color coding (green for approved, yellow for pending, blue for submitted)
- Progress bars for active tasks
- Action buttons contextually shown based on status

**Key Features:**

- Filter by status (All, Pending, Approved, In Progress, Submitted, Completed)
- Search functionality
- Responsive design for mobile
- Real-time updates using WebSocket or polling

### 2. File Upload Interface

**Design Elements:**

- Drag-and-drop zone with visual feedback
- File type validation (PDF, DOCX only)
- Progress indicators during upload
- File preview with thumbnails
- Multiple file selection support

**UX Considerations:**

- Clear error messages for unsupported formats
- File size limits display
- Upload progress with cancel option
- Success confirmation with file details

### 3. Admin Review Interface

**Layout:**

- Split-screen design: application details on left, review form on right
- Tabbed interface for multiple applications
- Quick action buttons for common reviews
- File viewer integration (PDF.js for in-browser viewing)

**Key Features:**

- Bulk review capabilities
- Comment templates for common feedback
- Review history tracking
- Advanced filtering and search
- Export capabilities for reports

### 4. Status Tracking

**Visual Elements:**

- Timeline view showing application progression
- Status badges with icons
- Color-coded progress indicators
- Notification system for status changes

**Information Architecture:**

- Clear status definitions
- Expected timeframes for each step
- Contact information for support
- FAQ section for common questions

### 5. Mobile Responsiveness

**Design Principles:**

- Mobile-first approach
- Touch-friendly interface elements
- Collapsible sections for better space utilization
- Swipe gestures for navigation
- Optimized file upload for mobile devices

## Security Considerations

1. **File Upload Security:**

   - Virus scanning before storage
   - File type validation on both client and server
   - File size limits
   - Secure file storage with restricted access

2. **Access Control:**

   - Role-based permissions
   - Token-based authentication
   - Session management
   - API rate limiting

3. **Data Protection:**
   - Encryption at rest and in transit
   - Audit logging for admin actions
   - Regular security updates
   - Data backup and recovery plans

## Testing Strategy

1. **Unit Tests:**

   - API endpoint testing
   - File upload functionality
   - Status transition logic
   - Permission checks

2. **Integration Tests:**

   - End-to-end workflow testing
   - Frontend-backend integration
   - File storage and retrieval
   - Email notifications

3. **User Acceptance Tests:**
   - User journey testing
   - Admin workflow testing
   - Error handling scenarios
   - Performance testing

## Deployment Considerations

1. **Environment Setup:**

   - Development, staging, and production environments
   - Database migrations
   - File storage configuration
   - Environment variables

2. **Performance Optimization:**

   - CDN for file delivery
   - Database indexing
   - Caching strategies
   - Image optimization

3. **Monitoring:**
   - Application performance monitoring
   - Error tracking
   - User analytics
   - System health checks

This comprehensive documentation provides everything needed to implement the complete 6-step workflow with proper frontend integration and design considerations.
