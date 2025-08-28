# Authentication & Authorization System

## Overview
The Smart LMS application now includes a comprehensive authentication and authorization system that restricts access to routes based on user roles.

## Route Protection

### Admin Routes
All admin routes are protected by the `adminGuard`:
- `/admin/dashboard`
- `/admin/manage-admins`
- `/admin/manage-students` 
- `/admin/manage-lecturers`

**Access Requirements:**
- User must be logged in
- User must have `admin` role

**Redirect Behavior:**
- If not logged in → `/auth/login`
- If logged in but not admin → Redirected to appropriate dashboard based on role

### Student Routes
Student routes are protected by the `studentGuard`:
- `/student/dashboard`

**Access Requirements:**
- User must be logged in
- User must have `student` role

### Teacher Routes
Teacher routes are protected by the `teacherGuard`:
- `/lecturer/dashboard`

**Access Requirements:**
- User must be logged in
- User must have `teacher` role

### Auth Routes
Authentication routes are protected by the `preventAuthGuard`:
- `/auth/login`
- `/auth/register/student`
- `/auth/register/teacher`

**Behavior:**
- If user is already logged in → Redirected to appropriate dashboard
- If not logged in → Allow access to auth routes

## Guards Implementation

### 1. Admin Guard (`adminGuard`)
```typescript
// Checks if user is logged in AND has admin role
// Redirects non-admins to their appropriate dashboard
// Redirects unauthenticated users to login
```

### 2. Student Guard (`studentGuard`)
```typescript
// Checks if user is logged in AND has student role
// Redirects non-students to their appropriate dashboard
```

### 3. Teacher Guard (`teacherGuard`)
```typescript
// Checks if user is logged in AND has teacher role
// Redirects non-teachers to their appropriate dashboard
```

### 4. Auth Guard (`authGuard`)
```typescript
// Basic authentication check
// Redirects to login if not authenticated
```

### 5. Prevent Auth Guard (`preventAuthGuard`)
```typescript
// Prevents logged-in users from accessing auth routes
// Redirects to appropriate dashboard based on role
```

## Admin Layout Security Features

### Authentication Check
- Component checks admin status on initialization
- Automatically redirects non-admins to login

### User Information Display
- Shows current user's name and role in toolbar
- Real-time updates via Observable subscription

### Logout Functionality
- Proper logout implementation using AuthService
- Clears user session and redirects to login

## Usage Examples

### Testing Route Protection

1. **Admin Access Test:**
   ```
   1. Try accessing /admin/dashboard without login
   2. Should redirect to /auth/login
   3. Login with admin credentials
   4. Should access admin dashboard successfully
   ```

2. **Role-based Redirect Test:**
   ```
   1. Login as student
   2. Try accessing /admin/dashboard
   3. Should redirect to /student/dashboard
   ```

3. **Auth Route Protection Test:**
   ```
   1. Login as any user
   2. Try accessing /auth/login
   3. Should redirect to appropriate dashboard
   ```

## Security Features

### Token Validation
- Guards check both token existence and user object
- AuthService provides centralized authentication state

### Role-based Access Control
- Granular permissions based on user roles
- Automatic redirection to appropriate areas

### Session Management
- Persistent login state via localStorage
- Proper logout with session cleanup

### User Experience
- Seamless redirects based on user context
- No broken states or unauthorized access

## Admin User Management

After seeding admin users, you can test with these credentials:

| Email | Password | Role |
|-------|----------|------|
| admin@smartlms.com | admin123 | admin |
| john.admin@smartlms.com | johnadmin123 | admin |
| sarah.manager@smartlms.com | sarahmanager123 | admin |

⚠️ **Security Note:** Change these default passwords immediately after first login!

## Next Steps

1. **Test the Authentication:**
   - Seed admin users: `npm run seed:admin`
   - Start the application
   - Test login with admin credentials
   - Verify route protection works

2. **Customize Guards (Optional):**
   - Add additional role checks
   - Implement permission-based access
   - Add route-specific validations

3. **Enhance Security:**
   - Implement JWT token refresh
   - Add session timeout
   - Enable 2FA for admin accounts
