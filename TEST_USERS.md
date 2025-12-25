# Test User Credentials

## 🧪 Test Users for Development

### Admin User (for Admin Panel Testing)

- **Email**: `admin@codeandcash.com`
- **Password**: `admin123456`
- **Role**: `admin`
- **Usage**: Access admin panel, manage users, tasks, and applications

### Regular Test Users (for User Functionality Testing)

#### 1. Primary Test User

- **Email**: `testuser@example.com`
- **Password**: `testpass123`
- **Role**: `user`
- **Name**: Test User
- **Skills**: JavaScript, React, Node.js
- **Experience**: Intermediate
- **Hourly Rate**: $25
- **User ID**: `686f1c071fcce67d1a7d1485`

#### 2. John Developer (Senior Developer)

- **Email**: `john@example.com`
- **Password**: `john123456`
- **Role**: `user`
- **Name**: John Developer
- **Skills**: JavaScript, React, Node.js, MongoDB
- **Experience**: Senior
- **Hourly Rate**: $75
- **Location**: San Francisco, CA

#### 3. Sarah Designer (UI/UX Designer)

- **Email**: `sarah@example.com`
- **Password**: `sarah123456`
- **Role**: `user`
- **Name**: Sarah Designer
- **Skills**: UI/UX Design, Figma, Adobe Creative Suite
- **Experience**: Intermediate
- **Hourly Rate**: $50
- **Location**: New York, NY

#### 4. Mike Tester (QA Specialist)

- **Email**: `mike@example.com`
- **Password**: `mike123456`
- **Role**: `user`
- **Name**: Mike Tester
- **Skills**: QA Testing, Automation, Selenium
- **Experience**: Intermediate
- **Hourly Rate**: $40
- **Location**: Austin, TX

## 🎯 Testing Scenarios

### Frontend Testing

1. **Login Testing**: Use any user credentials above
2. **My Tasks Page**: Login and apply for tasks, then view applied tasks
3. **Profile Management**: Edit user profiles with different skill sets
4. **Task Application**: Apply for tasks with different users
5. **Admin Panel**: Use admin credentials to manage users and tasks

### API Testing

1. **Authentication**:

   ```bash
   POST /api/auth/login
   {
     "email": "testuser@example.com",
     "password": "testpass123"
   }
   ```

2. **My Applied Tasks**:

   ```bash
   GET /api/applications/my
   Authorization: Bearer <token>
   ```

3. **Admin Debug**:
   ```bash
   GET /api/admin/debug
   Authorization: Bearer <admin_token>
   ```

## 🔧 Scripts Available

- `node scripts/create-test-user.js` - Create/verify primary test user
- `node scripts/create-additional-test-users.js` - Create additional test users
- `node scripts/create-admin.js` - Create/verify admin user

## 📝 Notes

- All users have complete profiles with skills, experience, and rates
- Users can apply for tasks and view them in "My Tasks" page
- Admin can manage all users and tasks
- Passwords are hashed using bcrypt
- All users are ready for immediate testing

## 🚀 Quick Test Steps

1. **Start your backend server**
2. **Login with any user** (e.g., `testuser@example.com` / `testpass123`)
3. **Apply for some tasks**
4. **View applied tasks** at `/api/applications/my`
5. **Test admin functions** with admin credentials
