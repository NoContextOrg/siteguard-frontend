# SiteGuard Frontend

A modern, responsive React + TypeScript application built with Vite for workforce security and construction site management. Features JWT-based authentication, role-based access control, and real-time attendance tracking.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Setup Instructions](#setup-instructions)
- [Authentication](#authentication)
- [Project Structure](#project-structure)
- [API Integration](#api-integration)
- [Troubleshooting](#troubleshooting)
- [Development](#development)

## Overview

SiteGuard is a comprehensive workforce management system designed for construction sites with:

- ✅ **Biometric Attendance System** - Fingerprint verification for accurate worker identification
- ✅ **Real-Time Tracking** - Live monitoring of worker attendance and site activity
- ✅ **Role-Based Access Control** - Admin, Engineer, Nurse, Worker roles with specific permissions
- ✅ **JWT Authentication** - Secure email-based login with token management
- ✅ **Protected Routes** - Route guarding with automatic role validation
- ✅ **Responsive Design** - Beautiful UI with Tailwind CSS and Framer Motion animations
- ✅ **Construction Management** - Centralized platform for project, worker, and attendance management

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

## Authentication

### Overview

The frontend implements JWT-based authentication with the following features:

- ✅ Email-based login (not username)
- ✅ Automatic token verification on app load
- ✅ Token expiration handling (1 hour default)
- ✅ Role-based access control (RBAC)
- ✅ Protected routes with automatic redirects
- ✅ Global auth state management with React Context

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

| Role | Description | Access |
|------|-------------|--------|
| `admin` | Full system access | All features, user management |
| `engineer` | Site engineer access | Team management, worker tracking |
| `nurse` | Health professional | Health monitoring, reports |
| `worker` | Site worker | Basic attendance, profile |
| `staff` | General staff | Limited access |

## Project Structure

```
src/
├── api/
│   ├── auth.ts           # Authentication API functions
│   └── fetch.ts          # Authenticated fetch wrapper
├── context/
│   └── AuthContext.tsx   # Global auth state management
├── components/
│   ├── Navbar.tsx        # Navigation bar
│   └── ProtectedRoute.tsx # Route protection component
├── assets/               # Images and static files
├── App.tsx               # Main app with routing
├── App.css               # Global styles
├── index.css             # Tailwind CSS entry
└── main.tsx              # React entry point
```

## API Integration

### Available Services

#### Authentication Service (`src/api/auth.ts`)

```typescript
// Login user
loginUser({ email, password }): Promise<AuthResponse>

// Verify token validity
verifyToken(token): Promise<boolean>

// Check authentication status
isAuthenticated(): boolean

// Check user role
hasRole(role): boolean

// Get stored auth data
getAuthToken(): string | null
getStoredUserEmail(): string | null
getUserRoles(): string[]

// Clear auth data
logoutUser(): void
```

#### Authenticated Fetch (`src/api/fetch.ts`)

```typescript
// Make authenticated API request with automatic token handling
authenticatedFetch(url, options): Promise<Response>
```

### Making API Calls

```typescript
// Example: Fetch workers
const response = await authenticatedFetch(
  `${import.meta.env.VITE_API_URL}/workers`,
  { method: 'GET' }
);

// Example: Create new worker
const response = await authenticatedFetch(
  `${import.meta.env.VITE_API_URL}/workers`,
  {
    method: 'POST',
    body: JSON.stringify({ name: 'John', role: 'worker' })
  }
);

if (response.ok) {
  const data = await response.json();
  console.log(data);
} else {
  console.error('API Error:', response.status);
}
```

## Troubleshooting

### Login Issues

**Problem**: Login fails with "Invalid email or password"

**Solutions**:
- Verify backend is running on `http://localhost:8080`
- Check that the user exists in the database
- Ensure user has a password hash (non-worker roles require password)
- Verify CORS is enabled in backend
- Check browser console for network errors

**Problem**: CORS error when logging in

**Solutions**:
- Add frontend URL to CORS whitelist in backend
- For development: `http://localhost:5173`
- For production: your actual domain
- Ensure backend returns proper CORS headers

### Authentication Issues

**Problem**: User redirected to login immediately after authentication

**Solutions**:
- Verify `VITE_API_URL` environment variable is set correctly
- Check that backend token verification endpoint is working
- Verify localStorage is enabled in browser
- Check browser console for auth errors
- Try clearing localStorage and logging in again

**Problem**: Token expiration causes immediate logout

**Solutions**:
- This is expected behavior (default 1 hour expiration)
- To extend, modify `expiresIn` in backend
- Consider implementing refresh token endpoint for longer sessions

### Protected Routes Not Working

**Solutions**:
- Verify `AuthProvider` wraps entire app in `App.tsx`
- Check that roles match expected format (e.g., "ROLE_ADMIN")
- Ensure token is stored in localStorage after login
- Check that `requiredRoles` parameter matches actual role names
- Review browser console for role mismatch warnings

### Build Issues

**Problem**: TypeScript errors during build

**Solutions**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript configuration
npx tsc --noEmit

# Run lint to find issues
npm run lint
```

## Development

### Available Scripts

```bash
# Start development server with HMR
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Lint TypeScript and JSX files
npm run lint

# Format code (if prettier is set up)
npm run format
```

### Technology Stack

| Tool | Version | Purpose |
|------|---------|---------|
| **React** | 19.2.4 | UI library |
| **TypeScript** | ~6.0.2 | Type safety |
| **Vite** | 8.0.4 | Build tool & dev server |
| **Tailwind CSS** | 4.2.2 | Utility-first CSS |
| **React Router** | 7.14.1 | Client-side routing |
| **Lucide React** | 1.8.0 | Icon library |
| **Framer Motion** | 12.38.0 | Animation library |
| **AOS** | 2.3.4 | Scroll animations |
| **Recharts** | 3.8.1 | Data visualization |

### ESLint Configuration

The project uses ESLint for code quality. For a production setup, enable type-aware linting:

### ESLint Configuration

The project uses ESLint for code quality. For a production setup, enable type-aware linting:

```js
// eslint.config.js
export default defineConfig([
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
])
```

### Docker Deployment

Build and run with Docker:

```bash
# Build Docker image
docker build -t siteguard-frontend:latest .

# Run container
docker run -p 80:80 siteguard-frontend:latest

# Access at http://localhost
```

The Dockerfile uses multi-stage build for optimal image size (~20MB).

## Security Best Practices

1. **JWT Token Storage**
   - Currently stored in localStorage (vulnerable to XSS)
   - For production: consider httpOnly cookies
   - Implement Content Security Policy (CSP)

2. **HTTPS in Production**
   - Always use HTTPS for token transmission
   - Never send tokens over unencrypted connections

3. **CORS Configuration**
   - Use specific domains, not `*`
   - Enable credentials only when necessary
   - Whitelist only trusted origins

4. **Token Rotation**
   - Implement refresh token endpoint
   - Rotate tokens periodically
   - Clear tokens on logout

5. **Environment Variables**
   - Never commit `.env.local` to version control
   - Use different URLs for dev/prod
   - Validate all environment variables at startup

## Performance Optimization

- **Code Splitting**: Routes automatically code-split with React Router
- **Image Optimization**: Use optimized images in public folder
- **Lazy Loading**: Components loaded on demand with React.lazy()
- **Caching**: Browser caching configured via nginx (server-side)
- **Minification**: Vite automatically minifies production builds

## Support & Documentation

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Router Documentation](https://reactrouter.com)

## License

Private - SiteGuard Project

## Contributing

For contributions, please follow the existing code style and create a pull request with:
- Clear description of changes
- Testing performed
- Any breaking changes noted
