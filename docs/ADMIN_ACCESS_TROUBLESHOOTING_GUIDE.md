# Admin Access Troubleshooting Guide

## 🔍 Backend Code Reference for Frontend Debugging

This document provides all the backend code information needed to diagnose and fix admin access issues in the frontend.

---

## 1. 🔐 Auth Controller - Login Endpoint

### File: `src/controllers/authController.js`

#### Login Function (`/api/auth/login`)

```javascript
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  // Find user by email with password field
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new AppError("Invalid credentials", 401));
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return next(new AppError("Invalid credentials", 401));
  }

  // Create user session
  const userAgent = req.headers["user-agent"] || "Unknown device";
  const ipAddress =
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    "Unknown IP";
  const { token, user: userData } = await createUserSession(
    user,
    userAgent,
    ipAddress
  );

  res.status(200).json({
    status: "success",
    token,
    data: { user: userData },
  });
});
```

#### Expected Response Format:

```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "id": "686bc227d09a313c39ba9d67",
      "name": "System Administrator",
      "email": "admin@codeandcash.com",
      "role": "admin"
    }
  }
}
```

---

## 2. 👤 User Model - Role Schema

### File: `src/models/User.js`

#### Role Field Definition:

```javascript
role: {
  type: String,
  enum: ["user", "admin"],
  default: "user",
},
```

#### JSON Serialization Method:

```javascript
// Remove sensitive fields when converting to JSON
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.activeSessions;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpire;
  return userObject;
};
```

**Note:** The `role` field is NOT removed in toJSON(), so it should be available in API responses.

---

## 3. 🛡️ Auth Middleware - JWT Protection

### File: `src/middlewares/auth.js`

#### Protect Middleware:

```javascript
export const protect = catchAsync(async (req, res, next) => {
  // 1) Get token and check if it exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in. Please log in to get access.", 401)
    );
  }

  // 2) Check if token is blacklisted
  const isBlacklisted = await BlacklistedToken.findOne({ token });
  if (isBlacklisted) {
    return next(
      new AppError("Your session has expired. Please log in again.", 401)
    );
  }

  // 3) Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new AppError("Invalid token. Please log in again.", 401));
    }
    if (error.name === "TokenExpiredError") {
      return next(
        new AppError("Your token has expired. Please log in again.", 401)
      );
    }
    return next(
      new AppError("Authentication failed. Please log in again.", 401)
    );
  }

  // 4) Check if user still exists
  const currentUser = await User.findById(decoded.userId);
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }

  // 5) Attach user to request
  req.user = currentUser;
  req.token = token;
  next();
});
```

---

## 4. 🚀 Admin Access Endpoint

### File: `src/controllers/adminController.js`

#### Check Admin Access Function:

```javascript
export const checkAdminAccess = catchAsync(async (req, res) => {
  // If this route is accessed, the user is already authenticated as admin
  // due to the adminAuth middleware
  logger.info(`👑 Admin access verified for user: ${req.user.email}`);

  res.status(200).json({
    status: "success",
    message: "Admin access verified",
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    },
  });
});
```

### File: `src/routes/admin.js`

#### Admin Authentication Middleware:

```javascript
const adminAuth = (req, res, next) => {
  // First use the protect middleware
  protect(req, res, (err) => {
    if (err) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
    }

    // Then check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Access denied. Admin privileges required.",
      });
    }

    next();
  });
};
```

---

## 5. 📋 Admin Credentials

### Default Admin User:

```
Email: admin@codexa.com
Password: admin123456
Role: admin
```

### Database Verification:

```javascript
// Admin user exists in database with:
{
  _id: "686bc227d09a313c39ba9d67",
  email: "admin@codexa.com",
  name: "System Administrator",
  role: "admin",
  createdAt: "2025-07-07T12:48:39.933Z"
}
```

---

## 6. 🔍 API Testing Results

### Login Test:

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@codeandcash.com", "password": "admin123456"}'
```

**Response:**

```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODZiYzIyN2QwOWEzMTNjMzliYTlkNjciLCJlbWFpbCI6ImFkbWluQGNvZGVhbmRjYXNoLmNvbSIsImlhdCI6MTc1MjE3NTYyNiwiZXhwIjoxNzUyNzgwNDI2fQ.My-Y74hBKjutWPZXqZ9vN5zG6KARC5x_RT4rSGhJ5uA",
  "data": {
    "user": {
      "id": "686bc227d09a313c39ba9d67",
      "name": "System Administrator",
      "email": "admin@codexa.com"
    }
  }
}
```

### Admin Access Test:

```bash
curl -X GET http://localhost:5001/api/admin/check-access \
  -H "Authorization: Bearer [TOKEN]"
```

**Response:**

```json
{
  "status": "success",
  "message": "Admin access verified",
  "data": {
    "user": {
      "id": "686bc227d09a313c39ba9d67",
      "name": "System Administrator",
      "email": "admin@codeandcash.com",
      "role": "admin"
    }
  }
}
```

---

## 7. 🐛 Common Frontend Issues & Solutions

### Issue 1: "Don't have admin role" error

**Possible Causes:**

- Using wrong password (`admin1123456` instead of `admin123456`)
- Not storing JWT token properly after login
- Not including token in Authorization header
- Checking role before user data is loaded

**Frontend Checks:**

1. Verify login credentials: `admin@codeandcash.com` / `admin123456`
2. Check if token is stored in localStorage after login
3. Verify Authorization header format: `Bearer [token]`
4. Check if user.role is available in your state management

### Issue 2: Token not being sent

**Frontend Check:**

```javascript
// Verify token is being sent
const token = localStorage.getItem("token");
console.log("Token:", token);

// Check API call headers
fetch("/api/admin/check-access", {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});
```

### Issue 3: User data not containing role

**Frontend Check:**

```javascript
// After login, check if user data contains role
const loginResponse = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});

const data = await loginResponse.json();
console.log("User data:", data.data.user);
// Should contain: { id, name, email, role }
```

### Issue 4: Role check timing

**Frontend Check:**

```javascript
// Make sure role check happens after user data is loaded
if (user && user.role === "admin") {
  // Show admin interface
} else {
  // Show access denied
}
```

---

## 8. 🔧 Frontend Debug Checklist

### Step 1: Login Flow

- [ ] Correct credentials: `admin@codeandcash.com` / `admin123456`
- [ ] Login API call returns success
- [ ] Token is stored in localStorage
- [ ] User data contains role field

### Step 2: Token Management

- [ ] Token is retrieved from localStorage
- [ ] Token is included in Authorization header
- [ ] Authorization header format: `Bearer [token]`

### Step 3: Admin Access Check

- [ ] `/api/admin/check-access` endpoint is called
- [ ] Response contains user with role: "admin"
- [ ] Frontend role check logic works correctly

### Step 4: Browser Console

- [ ] No JavaScript errors in console
- [ ] Network tab shows successful API calls
- [ ] localStorage contains valid token

---

## 9. 📞 Quick Debug Commands

### Test Login (Backend):

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@codeandcash.com", "password": "admin123456"}'
```

### Test Admin Access (Backend):

```bash
curl -X GET http://localhost:5001/api/admin/check-access \
  -H "Authorization: Bearer [YOUR_TOKEN_HERE]"
```

### Check Database (Backend):

```bash
node -e "
import User from './src/models/User.js';
import connectDB from './src/config/db.js';
await connectDB();
const admin = await User.findOne({ email: 'admin@codeandcash.com' });
console.log('Admin user:', admin);
process.exit(0);
"
```

---

## 10. 📋 Expected API Flow

1. **Login Request:** POST `/api/auth/login`
2. **Login Response:** JWT token + user data (with role)
3. **Store Token:** localStorage.setItem('token', token)
4. **Admin Request:** GET `/api/admin/check-access` with Bearer token
5. **Admin Response:** User data confirming admin role
6. **Frontend:** Allow access to admin interface

---

**Status: Backend is working correctly ✅**  
**Next Step: Debug frontend token handling and role checking logic**
