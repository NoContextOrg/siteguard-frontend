# SiteGuard Frontend

A modern, responsive React + TypeScript application built with Vite for workforce security and construction site management. Features JWT-based authentication, role-based access control, and real-time attendance tracking.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Setup Instructions](#setup-instructions)
- [Authentication & Authorization](#authentication--authorization)
- [Role-Based Routing](#role-based-routing)
- [Project Structure](#project-structure)
- [API Integration](#api-integration)
- [Architecture](#architecture)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Security Best Practices](#security-best-practices)

## Overview

SiteGuard is a comprehensive workforce management system designed for construction sites with:

- ✅ **Biometric Attendance System** - Fingerprint verification for accurate worker identification
- ✅ **Real-Time Tracking** - Live monitoring of worker attendance and site activity
- ✅ **Role-Based Access Control** - Admin, Engineer, Nurse, Staff roles with specific permissions
- ✅ **JWT Authentication** - Secure email-based login with token management
- ✅ **Protected Routes** - Route guarding with automatic role validation
- ✅ **Responsive Design** - Beautiful UI with Tailwind CSS and Framer Motion animations
- ✅ **Construction Management** - Centralized platform for project, worker, and attendance management
- ✅ **Auto-Redirect** - Authenticated users automatically directed to role-specific dashboards

## Quick Start

### Prerequisites

- **Node.js** 20.x or higher
- **npm** 10.x or higher
- **Backend** - SiteGuard Spring Boot API running on `http://localhost:8080`

### Installation & Development

```bash
# 1. Clone and navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Create environment configuration
cp .env.example .env.local

# 4. Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Setup Instructions

### 1. Environment Configuration

Create a `.env.local` file in the frontend root directory:

```env
# Development
VITE_API_URL=http://localhost:8080/api

# Production (update with your domain)
# VITE_API_URL=https://api.siteguard.com/api
```

**Note**: The `.env.example` file is provided as a template.

### 2. Backend Requirements

Ensure your Spring Boot backend is properly configured:

#### Required Endpoints
- `POST /api/auth/login` - User authentication
- `GET /api/auth/verify` - Token validation
- `POST /api/auth/register` - User registration (optional)

#### CORS Configuration

Add CORS support in your backend for the frontend URL:

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins(
                "http://localhost:5173",  // Development
                "https://your-domain.com" // Production
            )
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600);
    }
}
```

#### Authentication Endpoints

**Login - POST /api/auth/login**

Request:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "user@example.com",
  "roles": ["ROLE_ENGINEER", "ROLE_ADMIN"],
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

Error Response (401 Unauthorized):
```json
{
  "error": "Invalid email or password"
}
```

**Token Verification - GET /api/auth/verify**

Headers:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Response (200 OK):
```json
{
  "message": "Token is valid",
  "timestamp": 1629876543210
}
```

### 3. Testing the Setup

#### Create a Test User (via Backend)

```bash
# Create a test admin user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "admin",
    "password": "TestPassword123"
  }'

# Create a test engineer user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "role": "engineer",
    "password": "TestPassword123"
  }'
```

#### Test Login

1. Navigate to `http://localhost:5173`
2. Click "Get Started" to open the signin modal
3. Enter test credentials:
   - Email: `john@example.com`
   - Password: `TestPassword123`
4. Click "Sign In"
5. You should be redirected to the dashboard

## Authentication & Authorization

### Overview

The frontend implements JWT-based authentication with the following features:

- ✅ Email-based login (not username)
- ✅ Automatic token verification on app load
- ✅ Token expiration handling (1 hour default)
- ✅ Role-based access control (RBAC)
- ✅ Protected routes with automatic redirects
- ✅ Global auth state management with React Context
- ✅ Auto-redirect to role-appropriate dashboard after login

### Authentication Flow

```
1. User enters email & password in signin modal
        ↓
2. POST /api/auth/login { email, password }
        ↓
3. Backend returns JWT token + user roles
        ↓
4. Store in localStorage: accessToken, userEmail, userRoles, tokenExpiry
        ↓
5. Redirect to /dashboard
        ↓
6. Protected routes validate token and roles
        ↓
7. Token expired? → Auto logout → Redirect to /
```

### LocalStorage Keys

After successful login, these keys are stored:

```javascript
localStorage.getItem('accessToken')    // JWT token for API requests
localStorage.getItem('userEmail')      // User's email address
localStorage.getItem('userRoles')      // Array of user roles (JSON stringified)
localStorage.getItem('tokenExpiry')    // Token expiration timestamp
```

### Using Auth Context in Components

```typescript
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { isAuthenticated, userEmail, roles, login, logout, loading, error } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Welcome, {userEmail}!</p>
          <p>Roles: {roles.join(', ')}</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <p>Please log in</p>
      )}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
```

### Using Authenticated API Calls

```typescript
import { authenticatedFetch } from './api/fetch';

async function fetchWorkers() {
  try {
    const response = await authenticatedFetch(
      'http://localhost:8080/api/workers',
      { method: 'GET' }
    );
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Failed to fetch workers:', error);
  }
}
```

The `authenticatedFetch` wrapper automatically:
- Adds JWT token to all requests
- Handles 401 responses (token expiration)
- Redirects to login if token is invalid

### Protected Routes

Routes are protected based on authentication and roles:

```typescript
// Requires authentication only
<Route path="/dashboard" element={
  <ProtectedRoute>
    <NurseDashboard />
  </ProtectedRoute>
} />

// Requires authentication + admin role
<Route path="/admin_dashboard" element={
  <ProtectedRoute requiredRoles={['admin']}>
    <AdminDashboard />
  </ProtectedRoute>
} />

// Requires authentication + engineer role
<Route path="/engineer_dashboard" element={
  <ProtectedRoute requiredRoles={['engineer']}>
    <EngineerDashboard />
  </ProtectedRoute>
} />
```

### User Roles

The system supports these roles:

| Role | Dashboard | Description | Access |
|------|-----------|-------------|--------|
| `admin` | `/admin_dashboard` | Full system access | All features, user management, team oversight |
| `engineer` | `/engineer_dashboard` | Site engineer access | Team management, worker tracking, project management |
| `nurse` | `/dashboard` | Health professional | Health monitoring, worker wellness, medical reports |
| `staff` | `/dashboard` | General staff | Limited access to worker information |

**Note**: Workers do not have frontend login access. Worker attendance is tracked via biometric kiosk systems integrated with the backend.

## Role-Based Routing

### How It Works

After successful authentication, the system automatically redirects users to their role-specific dashboard:

```
User Login
    ↓
Backend returns: accessToken, userEmail, userRoles
    ↓
Frontend stores in localStorage
    ↓
RoleBasedRedirect component detects authentication
    ↓
getDashboardRoute() converts roles to dashboard URLs
    ↓
Auto-redirect to appropriate dashboard
```

### Role to Dashboard Mapping

| Role | Dashboard Route | Component | Auto-Redirect |
|------|-----------------|-----------|---|
| `admin` | `/admin_dashboard` | AdminDashboard | Yes |
| `engineer` | `/engineer_dashboard` | EngineerDashboard | Yes |
| `nurse` or `staff` | `/dashboard` | NurseDashboard | Yes |
| Unauthenticated | `/` | LandingPage | N/A |

### Implementation Details

#### RoleBasedRedirect Component
Wraps the landing page to automatically detect authenticated users and redirect them to the appropriate dashboard based on their role.

```typescript
// src/components/RoleBasedRedirect.tsx
<Route path="/" element={
  <RoleBasedRedirect>
    <LandingPage />
  </RoleBasedRedirect>
} />
```

#### ProtectedRoute Component
Guards routes requiring authentication and specific roles. Unauthorized access redirects to the landing page.

```typescript
// Requires authentication only
<Route path="/dashboard" element={
  <ProtectedRoute>
    <NurseDashboard />
  </ProtectedRoute>
} />

// Requires authentication + admin role
<Route path="/admin_dashboard" element={
  <ProtectedRoute requiredRoles={['admin']}>
    <AdminDashboard />
  </ProtectedRoute>
} />
```

#### Auth Helper Functions
Located in `src/api/auth.ts`:

```typescript
// Get user's primary role (first role in array)
getPrimaryRole(): string | null

// Determine which dashboard to route to
getDashboardRoute(): string

// Check if user has specific role
isRole(role: string): boolean

// Get stored auth data
getAuthToken(): string | null
getStoredUserEmail(): string | null
getUserRoles(): string[]
```

## Project Structure

```
src/
├── api/
│   ├── auth.ts           # Authentication API functions & helpers
│   └── fetch.ts          # Authenticated fetch wrapper
├── context/
│   └── AuthContext.tsx   # Global auth state management (useAuth hook)
├── components/
│   ├── Navbar.tsx        # Navigation bar
│   ├── ProtectedRoute.tsx # Route protection component (auth + role check)
│   └── RoleBasedRedirect.tsx # Auto-redirect component for landing page
├── assets/               # Images and static files
├── App.tsx               # Main app with routing
├── App.css               # Global styles
├── index.css             # Tailwind CSS entry
├── main.tsx              # React entry point
├── *_Dashboard.tsx       # Role-specific dashboards (Admin, Engineer, Nurse)
├── Admin_Team.tsx        # Admin team management
├── Admin_Team_Detail.tsx # Admin team detail view
├── Engineer_Team.tsx     # Engineer team management
├── Workers.tsx           # Workers list view
└── Nurse_Dashboard.tsx   # Nurse health monitoring dashboard
```

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                 Frontend (React + Vite)             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Landing Page                                       │
│  └── RoleBasedRedirect (Auto-redirect layer)       │
│      ├─ Not Authenticated? → Show Landing           │
│      └─ Authenticated?                              │
│         ↓                                            │
│      Get Role(s) from localStorage                  │
│         ↓                                            │
│      getDashboardRoute() → Determine URL            │
│         ↓                                            │
│      Auto-navigate to dashboard                     │
│                                                     │
│  Dashboards (Protected Routes)                      │
│  ├── Admin Dashboard (/admin_dashboard)             │
│  ├── Engineer Dashboard (/engineer_dashboard)       │
│  └── Nurse Dashboard (/dashboard)                   │
│                                                     │
│  Each route wrapped in ProtectedRoute               │
│  ├─ Check: isAuthenticated?                         │
│  ├─ Check: has required role(s)?                    │
│  └─ Unauthorized? → Redirect to /                   │
│                                                     │
└─────────────────────────────────────────────────────┘
            ↓ HTTP/HTTPS (JWT)                  
┌─────────────────────────────────────────────────────┐
│            Backend (Spring Boot)                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  POST /api/auth/login                              │
│  ├─ Authenticate user (email + password)           │
│  ├─ Generate JWT token                             │
│  └─ Return: token, roles, email                     │
│                                                     │
│  GET /api/auth/verify                              │
│  ├─ Validate JWT token                             │
│  └─ Return: valid/invalid                           │
│                                                     │
│  Other Protected Endpoints                          │
│  ├─ /api/workers (GET, POST, etc.)                 │
│  ├─ /api/teams                                      │
│  ├─ /api/attendance                                 │
│  └─ ... (all require Authorization header)         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Authentication Flow

```
1. User accesses http://localhost:5173
   ↓
2. App initializes AuthContext
   ├─ Check localStorage for token
   ├─ If token exists, call GET /api/auth/verify
   └─ Set isAuthenticated = true/false
   ↓
3. If authenticated, RoleBasedRedirect triggers
   ├─ Get roles from localStorage
   ├─ Call getDashboardRoute()
   └─ Auto-navigate to dashboard
   ↓
4. If not authenticated, show Landing Page
   ├─ User clicks "Get Started"
   ├─ SignIn Modal opens
   ├─ User enters email & password
   └─ Click "Sign In"
   ↓
5. API Call: POST /api/auth/login
   ├─ Request: { email, password }
   └─ Response: { accessToken, roles, username, expiresIn }
   ↓
6. Store in localStorage
   ├─ accessToken (JWT)
   ├─ userEmail
   ├─ userRoles (JSON stringified)
   └─ tokenExpiry (timestamp)
   ↓
7. Redirect to /dashboard
   ├─ RoleBasedRedirect checks authentication
   ├─ Calls getDashboardRoute()
   └─ Navigates to role dashboard
   ↓
8. Protected routes validate
   ├─ ProtectedRoute checks: isAuthenticated? ✓
   ├─ ProtectedRoute checks: required roles? ✓
   └─ Render dashboard component
```

### Component Relationships

```
App (root)
│
├── AuthProvider (context wrapper)
│   │
│   └── BrowserRouter
│       │
│       ├── Route "/" → RoleBasedRedirect
│       │   └── LandingPage (with SignInModal)
│       │
│       ├── Route "/admin_dashboard" → ProtectedRoute
│       │   └── AdminDashboard
│       │       ├── Admin_Team
│       │       └── Admin_Team_Detail
│       │
│       ├── Route "/engineer_dashboard" → ProtectedRoute
│       │   └── EngineerDashboard
│       │       └── Engineer_Team
│       │
│       └── Route "/dashboard" → ProtectedRoute
│           └── NurseDashboard
│               └── Workers (list)
```

## API Integration

### Available Services

#### Authentication Service (`src/api/auth.ts`)

```typescript
// Login user with email and password
loginUser(email: string, password: string): Promise<AuthResponse>

// Verify token validity
verifyToken(token: string): Promise<boolean>

// Check if user is authenticated
isAuthenticated(): boolean

// Get user's primary role (first role in array, lowercase)
getPrimaryRole(): string | null

// Get dashboard route for user's role
getDashboardRoute(): string  // Returns: "/admin_dashboard" | "/engineer_dashboard" | "/dashboard"

// Check if user has specific role
isRole(role: string): boolean
hasRole(role: string): boolean

// Get stored auth data
getAuthToken(): string | null
getStoredUserEmail(): string | null
getUserRoles(): string[]  // Returns array like: ["ROLE_ADMIN"]

// Clear auth data
logoutUser(): void
clearAuthData(): void
```

#### Authenticated Fetch (`src/api/fetch.ts`)

```typescript
// Make authenticated API request with automatic token handling
authenticatedFetch(url: string, options?: RequestInit): Promise<Response>

// Automatically:
// - Adds Authorization header with JWT token
// - Handles 401 responses (token expiration → logout)
// - Redirects to login if token is invalid
```

### Making API Calls

```typescript
import { authenticatedFetch } from './api/fetch';

// Example: Fetch workers list
async function getWorkers() {
  try {
    const response = await authenticatedFetch(
      `${import.meta.env.VITE_API_URL}/workers`,
      { method: 'GET' }
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log('Workers:', data);
    } else {
      console.error('Error:', response.status);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

// Example: Create new worker
async function createWorker(workerData) {
  const response = await authenticatedFetch(
    `${import.meta.env.VITE_API_URL}/workers`,
    {
      method: 'POST',
      body: JSON.stringify(workerData)
    }
  );
  
  return response.json();
}

// Example: Update team
async function updateTeam(teamId, teamData) {
  const response = await authenticatedFetch(
    `${import.meta.env.VITE_API_URL}/teams/${teamId}`,
    {
      method: 'PUT',
      body: JSON.stringify(teamData)
    }
  );
  
  return response.json();
}
```

### Using Auth Context in Components

```typescript
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { 
    isAuthenticated,  // boolean
    userEmail,        // string | null
    roles,            // string[]
    loading,          // boolean
    error,            // string | null
    login,            // (email, password) => Promise
    logout            // () => void
  } = useAuth();

  if (loading) {
    return <div>Loading authentication...</div>;
  }

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Welcome, {userEmail}!</p>
          <p>Roles: {roles.map(r => r.replace('ROLE_', '')).join(', ')}</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <p>Please log in to continue</p>
      )}
      {error && <p className="text-red-600">Error: {error}</p>}
    </div>
  );
}
```

## Troubleshooting

### Login Issues

**Problem**: Login fails with "Invalid email or password"

**Solutions**:
- Verify backend is running on `http://localhost:8080`
- Check that the user exists in the database
- Verify CORS is enabled in backend
- Check browser console (F12) for network errors
- Verify the user role is one of: `ROLE_ADMIN`, `ROLE_ENGINEER`, `ROLE_NURSE`, `ROLE_STAFF`

**Problem**: CORS error when logging in

**Solutions**:
- Add frontend URL to CORS whitelist in backend configuration
- For development: `http://localhost:5173`
- For production: your actual domain
- Ensure backend returns proper CORS headers: `Access-Control-Allow-*`

**Problem**: "Cannot POST /api/auth/login" error

**Solutions**:
- Verify backend is running: `http://localhost:8080`
- Check `VITE_API_URL` in `.env.local` matches backend URL
- Verify backend has `/api/auth/login` endpoint
- Check network tab in browser DevTools for 404/500 errors

### Authentication Issues

**Problem**: User is immediately redirected to login after successful authentication

**Solutions**:
- Check browser localStorage (DevTools → Application → Local Storage)
- Verify `accessToken`, `userEmail`, `userRoles` are stored
- Check that `tokenExpiry` is in the future
- Try clearing localStorage: `localStorage.clear()` in browser console
- Verify backend's `/api/auth/verify` endpoint is working

**Problem**: "Token expired" and automatic logout

**Solutions**:
- This is expected behavior (default 1 hour expiration)
- To extend session: configure `expiresIn` in backend
- Implement refresh token endpoint for longer sessions
- User should log in again

**Problem**: Role-based redirect not working

**Solutions**:
- Verify `AuthProvider` wraps entire app in `src/App.tsx`
- Check roles in localStorage: `localStorage.getItem('userRoles')`
- Expected format: `["ROLE_ADMIN"]` (JSON stringified array)
- Verify dashboard routes exist:
  - `/admin_dashboard` for admin
  - `/engineer_dashboard` for engineer  
  - `/dashboard` for nurse/staff
- Check browser console for errors

### Protected Routes Issues

**Problem**: Redirected to login when accessing protected routes

**Solutions**:
- Verify token is in localStorage after login
- Check token hasn't expired: compare `tokenExpiry` with current time
- Verify backend's `/api/auth/verify` endpoint works
- Try re-logging in
- Clear localStorage and try again

**Problem**: "You don't have permission to access this page"

**Solutions**:
- Check required role for route (see Role-Based Routing section)
- Verify user has required role in their account
- Check `userRoles` in localStorage
- Ensure role names match exactly (case-sensitive): `ROLE_ADMIN`, `ROLE_ENGINEER`, etc.

### Build & Development Issues

**Problem**: TypeScript errors during `npm run build`

**Solutions**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript configuration
npx tsc --noEmit

# Run linter to find issues
npm run lint
```

**Problem**: Development server won't start

**Solutions**:
```bash
# Clear cache and restart
rm -rf node_modules/.vite
npm run dev

# Check if port 5173 is in use
lsof -i :5173
```

**Problem**: "Module not found" errors

**Solutions**:
- Verify all imports have correct file extensions (`.ts`, `.tsx`, `.ts`)
- Check relative paths: use `./` for relative, not absolute
- Reinstall dependencies: `npm install`

## Development

### Available Scripts

```bash
# Start development server with Hot Module Replacement (HMR)
npm run dev

# Build optimized production bundle
npm run build

# Preview production build locally (before deploy)
npm run preview

# Lint TypeScript and JSX files
npm run lint

# Format code with Prettier (if configured)
npm run format
```

### Technology Stack

| Tool | Version | Purpose |
|------|---------|---------|
| **React** | 19.x | UI library |
| **TypeScript** | ~6.0.2 | Type safety |
| **Vite** | 8.0.x | Build tool & dev server |
| **React Router** | 7.x | Client-side routing |
| **Tailwind CSS** | 4.2.x | Utility-first CSS framework |
| **Lucide React** | 1.8.x | Icon library |
| **Framer Motion** | 12.x | Animation library |
| **AOS** | 2.3.x | Scroll animations |
| **Recharts** | 3.8.x | Data visualization |

### Development Workflow

```bash
# 1. Clone repository
git clone <repo-url>
cd frontend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your backend URL

# 4. Start development server
npm run dev
# Open http://localhost:5173

# 5. Make changes
# Vite will auto-reload with HMR

# 6. Build for production
npm run build

# 7. Test production build
npm run preview
```

### Environment Configuration

Create `.env.local` in the project root:

```env
# Development
VITE_API_URL=http://localhost:8080/api

# Production (uncomment and update)
# VITE_API_URL=https://api.siteguard.com/api
```

**Important**: Do not commit `.env.local` to version control. The file is in `.gitignore`.

### ESLint Configuration

The project uses ESLint for code quality. Configuration is in `eslint.config.js`.

For production deployment, consider enabling type-aware linting:

```js
// eslint.config.js
import tseslint from 'typescript-eslint';

export default [
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
```

### Docker Deployment

Build and run with Docker for production:

```bash
# Build Docker image
docker build -t siteguard-frontend:latest .

# Run container on port 80
docker run -p 80:80 siteguard-frontend:latest

# Access at http://localhost
```

The Dockerfile uses multi-stage builds for optimal image size (~20MB).

### Debugging Tips

**1. Use React DevTools Extension**
- Install React DevTools browser extension
- Inspect component hierarchy
- View and modify state/props

**2. Check Browser Console (F12)**
- Open DevTools → Console tab
- Look for error messages and warnings
- Use `console.log()` for debugging

**3. Check Network Tab**
- See all API requests and responses
- Verify JWT token in Authorization header
- Check for CORS errors

**4. Inspect LocalStorage**
- DevTools → Application → Local Storage
- Verify auth tokens are stored correctly
- Check token expiry time

**5. Use VS Code Debugger**
```json
// .vscode/launch.json
{
  "type": "chrome",
  "request": "launch",
  "name": "Launch Chrome",
  "url": "http://localhost:5173",
  "webRoot": "${workspaceFolder}/src",
  "sourceMapPathPrefix": "webpack:///"
}
```

## Security Best Practices

### 1. JWT Token Storage
- **Current**: localStorage (convenient but XSS-vulnerable)
- **Production Recommendation**: Use httpOnly + Secure cookies
- **CSP Implementation**: Set Content-Security-Policy headers
- **Token Scope**: Limit token permissions to necessary APIs

### 2. HTTPS in Production
- ✅ Always use HTTPS for all communication
- ✅ Never transmit tokens over unencrypted HTTP
- ✅ Enable HSTS (HTTP Strict-Transport-Security)
- ✅ Use strong TLS/SSL certificates

### 3. CORS Configuration
```java
// Backend: Strict CORS configuration
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("https://yourdomain.com")  // Specific domain, not "*"
            .allowedMethods("GET", "POST", "PUT", "DELETE")
            .allowedHeaders("Authorization", "Content-Type")
            .allowCredentials(true)
            .maxAge(3600);
    }
}
```

### 4. Token Management
- ✅ Set reasonable expiration times (1 hour default)
- ✅ Implement refresh token endpoint for extended sessions
- ✅ Clear tokens immediately on logout
- ✅ Validate tokens before each API request
- ✅ Never store sensitive data in JWT payload (it's encoded, not encrypted)

### 5. Environment Variables
- ✅ Never commit `.env.local` (in `.gitignore`)
- ✅ Use different APIs for dev/staging/production
- ✅ Validate all environment variables at app startup
- ✅ Use environment-specific build configurations
- ✅ Document all required environment variables in `.env.example`

### 6. Role-Based Access Control
- ✅ Always validate roles on backend
- ✅ Never trust roles from frontend tokens alone
- ✅ Implement role-based API authorization
- ✅ Log authorization failures for security monitoring
- ✅ Audit sensitive role changes

### 7. Data Protection
- ✅ Validate all user inputs before sending to API
- ✅ Use parameterized queries (backend responsibility)
- ✅ Sanitize user data before display
- ✅ Never expose sensitive IDs in URLs (use proper API design)
- ✅ Implement proper error handling (don't leak server details)

## Performance Optimization

### Code Splitting
- Routes automatically code-split with React Router
- Components lazy-loaded on demand with `React.lazy()`
- Reduces initial bundle size

### Image Optimization
- Use optimized images in `public/` folder
- Consider WebP format for modern browsers
- Implement lazy loading for images below the fold

### Bundle Size
- Vite automatically minifies production builds
- Tree-shaking removes unused code
- Check bundle size: `npm run build` shows size report

### Caching Strategy
- Browser caching: Vite sets cache headers automatically
- API caching: Implement backend caching for frequently accessed data
- Service Workers: Consider PWA for offline support

### Database Query Optimization (Backend)
- Implement pagination for large datasets
- Use database indexes on frequently queried fields
- Lazy load related data only when needed
- Implement query result caching

## Common Tasks

### Adding a New Route
```typescript
// 1. Create dashboard component
// src/NewDashboard.tsx
export default function NewDashboard() { ... }

// 2. Add route in App.tsx
<Route path="/new_dashboard" element={
  <ProtectedRoute requiredRoles={['admin']}>
    <NewDashboard />
  </ProtectedRoute>
} />

// 3. Update getDashboardRoute() in src/api/auth.ts if needed
```

### Adding Authentication to a Component
```typescript
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { isAuthenticated, roles, userEmail } = useAuth();
  
  if (!isAuthenticated) {
    return <p>Please log in</p>;
  }
  
  return <div>Content for authenticated users</div>;
}
```

### Making an API Request
```typescript
import { authenticatedFetch } from './api/fetch';

async function fetchData() {
  const response = await authenticatedFetch(
    `${import.meta.env.VITE_API_URL}/endpoint`,
    { method: 'GET' }
  );
  return response.json();
}
```

## Deployment

### Prerequisites
- Backend API running and accessible
- Environment variables configured
- CORS enabled on backend
- HTTPS certificate (production)

### Development Deployment
```bash
npm run dev
# Runs on http://localhost:5173
```

### Production Build
```bash
npm run build
npm run preview  # Preview before deployment
```

### Docker Deployment
```bash
docker build -t siteguard-frontend .
docker run -p 80:80 siteguard-frontend
```

### Environment Setup
Create `.env.local` for your environment:
```env
VITE_API_URL=https://api.siteguard.com/api
```

## Support & Documentation

### Project Documentation
- **README.md** - This file (comprehensive guide)
- **ARCHITECTURE_DIAGRAMS.md** - System architecture and flow diagrams
- **ROLE_BASED_ROUTING.md** - Detailed role-based routing implementation

### External Resources
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Router](https://reactrouter.com)
- [JWT.io](https://jwt.io) - JWT debugging and learning

### Getting Help
1. Check Troubleshooting section in this README
2. Review browser console (F12) for errors
3. Check backend logs for API errors
4. Verify environment configuration (.env.local)
5. Check network requests in DevTools

## License

Private - SiteGuard Project

## Contributing Guidelines

When contributing to SiteGuard Frontend:

1. **Code Style**
   - Follow existing TypeScript conventions
   - Use meaningful variable/function names
   - Comment complex logic

2. **Before Submitting**
   - Run `npm run lint` and fix issues
   - Run `npm run build` to verify production build
   - Test the feature in development

3. **Pull Request**
   - Clear description of changes
   - Reference related issues
   - Highlight any breaking changes
   - Include testing performed

4. **Commit Messages**
   - Use clear, descriptive messages
   - Format: `type: short description`
   - Examples: `feat: add role-based routing`, `fix: auth token expiry`
