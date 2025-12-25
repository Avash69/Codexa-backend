# Codexa Backend - Complete System Overview

## 🏗️ System Architecture

**Stack**: Node.js + Express.js + MongoDB + JWT Authentication  
**Purpose**: Freelance coding task platform where users apply for paid programming tasks

## 📊 Core Data Models

### User Model

- Authentication (JWT with session tracking)
- Profiles (name, email, skills, bio, profile image)
- Roles: `user` | `admin`
- Active sessions management

### Task Model

- Task details (title, description, company, category, difficulty)
- Financial (payout: $0-$10,000)
- Status workflow: `open` → `in_progress` → `completed` | `cancelled`
- Embedded applicants array and submissions array
- Requirements, skills, tags, deadline

### TaskApplication Model

- Links User ↔ Task with application workflow
- Status: `pending` → `accepted` → `completed` | `rejected` | `cancelled`
- File submissions, progress tracking, feedback
- Payment status tracking

### BlacklistedToken Model

- JWT token invalidation system

## 🔐 Authentication & Authorization

### Authentication Flow

1. **Register/Login** → JWT token issued with user data
2. **Protected Routes** → Bearer token required in Authorization header
3. **Admin Routes** → Additional `role: "admin"` verification
4. **Session Management** → Active session tracking with device info
5. **Logout** → Token blacklisted, session terminated

### Security Features

- JWT with configurable expiration
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Session limit per user (prevents multiple logins)
- Token blacklisting on logout
- Input validation & sanitization
- CORS configuration
- File upload security

## 👤 User Journey & Workflow

### 1. Task Discovery

- **Browse Tasks**: `GET /api/tasks` - View all available tasks (public)
- **Filter/Search**: By category, difficulty, payout range
- **Task Details**: `GET /api/tasks/:id` - Full task information

### 2. Application Process

- **Apply**: `POST /api/applications/apply/:taskId`
  - Creates TaskApplication with status `pending`
  - Adds user to task's applicants array
- **Track Applications**: `GET /api/applications/my` - View all applied tasks
- **Application Status**: pending → accepted → completed

### 3. Work Submission

- **Submit Files**: `POST /api/applications/:applicationId/submit`
  - Upload PDF/DOCX work files
  - Files stored in `uploads/submissions/`
- **Track Progress**: Update completion percentage
- **Withdraw**: `DELETE /api/applications/:applicationId/withdraw`

### 4. Completion & Payment

- Admin reviews submission → approves/rejects
- Status updates: submitted → approved → payment processed

## 👑 Admin Management & Control

### 1. Platform Overview

- **Dashboard**: `GET /api/admin/stats`
  - Total users, tasks, applications, submissions
  - Pending reviews, approved/rejected counts
  - Recent activity (last 30 days)
- **Access Control**: `GET /api/admin/check-access` - Verify admin privileges

### 2. User Management

- **List Users**: `GET /api/admin/users` - Paginated user list
- **Delete User**: `DELETE /api/admin/users/:userId` - Remove user + cascading cleanup
- **User Details**: View profiles, application history

### 3. Task Management

- **List Tasks**: `GET /api/admin/tasks` - All tasks with applicants/submissions
- **Create Task**: `POST /api/admin/tasks` - Post new tasks (admin only)
- **Delete Task**: `DELETE /api/admin/tasks/:taskId` - Remove task + cleanup

### 4. Application Review System

- **View Applications**: `GET /api/admin/task-applications` - All user applications
- **Approve/Reject**: `PATCH /api/admin/applications/:applicationId/status`
  - Status: pending → accepted/rejected
  - When accepted: task assigned to user, status → in_progress
  - Optional feedback message

### 5. Submission Review & Grading

- **User Submissions**: `GET /api/admin/user-submissions/:userId` - All submissions by user
- **Download Files**: `GET /api/admin/submissions/:submissionId/download` - Secure file access
- **Grade Work**: `PATCH /api/admin/submissions/:submissionId/status`
  - Status: pending → approved/rejected
  - Provide feedback to user
- **Track Reviews**: pending_reviews count for workload management

## 🔌 Complete API Reference

### Authentication Endpoints

```
POST /api/auth/register     - User registration
POST /api/auth/login        - User login (returns JWT)
POST /api/auth/logout       - Logout (blacklist token)
```

### Public Task Endpoints

```
GET  /api/tasks             - List all tasks (public, with filters)
GET  /api/tasks/:id         - Get single task details
GET  /api/tasks/categories  - Available task categories
GET  /api/tasks/difficulties - Available difficulty levels
GET  /api/tasks/stats       - Public task statistics
```

### User Application Endpoints (Protected)

```
POST   /api/applications/apply/:taskId              - Apply to task
GET    /api/applications/my                         - My applied tasks
GET    /api/applications/my/stats                   - My application stats
GET    /api/applications/:applicationId             - Application details
PUT    /api/applications/:applicationId/progress    - Update progress
DELETE /api/applications/:applicationId/withdraw    - Withdraw application
POST   /api/applications/:applicationId/submit      - Submit work files
DELETE /api/applications/:applicationId/submissions/:submissionId - Delete submission
```

### Profile Management (Protected)

```
GET    /api/profile         - Get user profile
PUT    /api/profile         - Update profile
POST   /api/profile/upload  - Upload profile image
```

### Admin Panel Endpoints (Admin Only)

```
GET    /api/admin/check-access                      - Verify admin access
GET    /api/admin/stats                             - Dashboard statistics
GET    /api/admin/debug                             - Database debug info

# User Management
GET    /api/admin/users                             - List all users
DELETE /api/admin/users/:userId                     - Delete user

# Task Management
GET    /api/admin/tasks                             - List all tasks
POST   /api/admin/tasks                             - Create new task
DELETE /api/admin/tasks/:taskId                     - Delete task

# Application Management
GET    /api/admin/task-applications                 - All applications
PATCH  /api/admin/applications/:applicationId/status - Approve/reject application

# Submission Management
GET    /api/admin/user-submissions/:userId          - User's submissions
GET    /api/admin/submissions/:submissionId/download - Download submission file
PATCH  /api/admin/submissions/:submissionId/status  - Grade submission
```

## 🔄 Status Flow & State Management

### Application Lifecycle

```
pending    → User applied, waiting for admin review
accepted   → Admin approved, task assigned to user, task status → in_progress
rejected   → Admin declined application
completed  → Work finished and approved, payment processed
cancelled  → Application withdrawn by user or admin
```

### Task Lifecycle

```
open        → Available for applications, accepting applicants
in_progress → Assigned to user, work in progress
completed   → Work submitted and approved
cancelled   → Task cancelled by admin
```

### Submission Review Process

```
pending    → Files uploaded, awaiting admin review
submitted  → Formal submission complete
approved   → Work approved by admin, payment due
rejected   → Work needs revision, feedback provided
```

### File Management & Storage

```
Profile Images:     /uploads/profile-images/
Task Submissions:   /uploads/submissions/
Download Security:  JWT authentication required
File Types:         PDF, DOCX for submissions | JPG, PNG for profiles
```

## 🔑 Admin Access & Database

### Default Admin Account

```
Email:    admin@codeandcash.com
Password: admin123456
Script:   node scripts/create-admin.js
```

### MongoDB Collections

```
users              - User accounts, profiles, sessions
tasks              - Tasks with embedded applicants/submissions
taskapplications   - Detailed application tracking
blacklistedtokens  - Invalid JWT tokens
```

### Key Database Relationships

```
User 1:N TaskApplication N:1 Task
User 1:N Sessions (JWT tracking)
Task 1:N Applicants (embedded)
Task 1:N Submissions (embedded)
TaskApplication 1:N FileSubmissions
```

## 🛡️ Security & Middleware

### Protection Layers

- **Authentication**: JWT verification middleware
- **Authorization**: Role-based access control
- **File Upload**: Multer with file type validation
- **Input Validation**: Request body sanitization
- **Error Handling**: Centralized error processing
- **CORS**: Cross-origin request management
- **Rate Limiting**: API request throttling (configurable)

### Environment Configuration

```
NODE_ENV, PORT, JWT_SECRET, JWT_EXPIRES_IN
MONGODB_URI, MAX_ACTIVE_SESSIONS
FILE_UPLOAD_LIMIT, CORS_ORIGIN
```

---

## 📋 Quick Reference Summary

**Core Purpose**: Freelance coding task platform with admin approval workflow  
**Tech Stack**: Node.js + Express + MongoDB + JWT  
**Key Features**: Task posting, user applications, file submissions, admin review system  
**Security**: JWT + RBAC + session management + file validation  
**Admin Panel**: Complete CRUD operations + approval workflows + analytics

**Production Ready**: ✅ Error handling, logging, validation, security, file management
