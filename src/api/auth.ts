/**
 * Authentication API service
 * Handles all auth-related API calls to the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://siteguardph.duckdns.org/api';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  username: string;
  roles: string[];
  expiresIn: number;
  tokenType: string;
}

export interface AuthError {
  error?: string;
  message?: string;
}

/**
 * Login user with email and password
 */
export const loginUser = async (loginData: LoginRequest): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });

    if (!response.ok) {
      let errorMessage = 'Login failed';
      try {
        const errorData: AuthError = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data: AuthResponse = await response.json();
    
    // Normalize response in case backend returns different field names
    const normalized = normalizeAuthResponse(data);
    
    return normalized;
  } catch (error) {
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * Verify if the current token is valid
 */
export const verifyToken = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.ok;
  } catch (error) {
    return false;
  }
};

/**
 * Logout user (clear local storage)
 */
export const logoutUser = (): void => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userRoles');
  localStorage.removeItem('tokenExpiry');
};

/**
 * Get stored auth token
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

/**
 * Get stored user email
 */
export const getStoredUserEmail = (): string | null => {
  return localStorage.getItem('userEmail');
};

/**
 * Get stored user roles
 */
export const getUserRoles = (): string[] => {
  const roles = localStorage.getItem('userRoles');
  return roles ? JSON.parse(roles) : [];
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  const expiry = localStorage.getItem('tokenExpiry');
  
  if (!token || !expiry) return false;
  
  return new Date().getTime() < parseInt(expiry);
};

/**
 * Check if user has a specific role
 */
export const hasRole = (role: string): boolean => {
  const roles = getUserRoles();
  return roles.some(r => r.includes(role.toUpperCase()));
};

/**
 * Store auth data in local storage with STRICT validation
 * CRITICAL: This MUST save the JWT to localStorage
 */
export const storeAuthData = (authResponse: AuthResponse, rememberMe: boolean = false): void => {
  try {
    // Step 1: Validate input
    if (!authResponse?.accessToken) {
      throw new Error('Missing accessToken in response');
    }
    if (!authResponse?.roles || !Array.isArray(authResponse.roles)) {
      throw new Error('Missing or invalid roles in response');
    }

    // Step 2: Store accessToken and verify
    localStorage.setItem('accessToken', authResponse.accessToken);
    const verifyToken = localStorage.getItem('accessToken');
    if (!verifyToken) {
      throw new Error('Failed to store accessToken');
    }

    // Step 3: Store userEmail
    localStorage.setItem('userEmail', authResponse.username || '');

    // Step 4: Store userRoles
    const rolesJson = JSON.stringify(authResponse.roles);
    localStorage.setItem('userRoles', rolesJson);
    const verifyRoles = localStorage.getItem('userRoles');
    if (!verifyRoles) {
      throw new Error('Failed to store userRoles');
    }

    // Step 5: Store tokenExpiry
    // Trust the backend's calculated expiresIn, with a safe fallback
    const expirySeconds = authResponse.expiresIn || (rememberMe ? 2592000 : 21600);
    const expiryMs = new Date().getTime() + (expirySeconds * 1000);
    localStorage.setItem('tokenExpiry', expiryMs.toString());

  } catch (error) {
    throw error;
  }
};

/**
 * Get authorization header for API requests
 */
export const getAuthHeader = (): Record<string, string> => {
  const token = getAuthToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

/**
 * Get primary user role (first role from list)
 */
export const getPrimaryRole = (): string | null => {
  const roles = getUserRoles();
  if (roles.length === 0) return null;
  
  // Extract role name from "ROLE_ADMIN" format
  const primaryRole = roles[0];
  return primaryRole.replace('ROLE_', '').toLowerCase();
};

/**
 * Get dashboard route based on user role
 */
export const getDashboardRoute = (): string => {
  const role = getPrimaryRole();
  
  switch (role) {
    case 'admin':
      return '/admin_dashboard';
    case 'engineer':
      return '/engineer_dashboard';
    case 'nurse':
      return '/dashboard';
    case 'staff':
      return '/dashboard';
    default:
      return '/dashboard';
  }
};

/**
 * Check if user is a specific role
 */
export const isRole = (role: string): boolean => {
  const roles = getUserRoles();
  return roles.some(r => r.toUpperCase().includes(role.toUpperCase()));
};

/**
 * Check if JWT token is still valid
 * Logs detailed debug info
 */
export const isTokenValid = (): boolean => {
  const token = getAuthToken();
  const expiry = localStorage.getItem('tokenExpiry');
  
  if (!token || !expiry) {
    return false;
  }
  
  const now = new Date().getTime();
  const expiryTime = parseInt(expiry);
  const isValid = now < expiryTime;
  
  return isValid;
};

/**
 * Listen for logout events across browser tabs/windows
 * Only logs out when explicitly cleared, not on token expiry
 */
export const initAuthListener = () => {
  const handleStorageChange = (e: StorageEvent) => {
    // Only redirect if accessToken is explicitly removed (logout action)
    // Check if value was present and is now null (logout from another tab)
    if (e.key === 'accessToken') {
      if (e.oldValue !== null && e.newValue === null) {
        window.location.href = '/';
      }
    }
  };

  window.addEventListener('storage', handleStorageChange);

  // Return cleanup function
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};

/**
 * Validate and normalize auth response from backend
 * Backend might return different field names
 */
export const normalizeAuthResponse = (response: any): AuthResponse => {
  // Map possible field names from backend
  const token = response.accessToken || response.token || response.access_token;
  const username = response.username || response.email || response.user || 'Unknown';
  const roles = response.roles || response.user?.roles || [];
  const expiresIn = response.expiresIn || response.expires_in || 21600; // Default to 6 hours
  const tokenType = response.tokenType || response.token_type || 'Bearer';

  if (!token) {
    throw new Error('Invalid login response: no access token');
  }

  const normalized: AuthResponse = {
    accessToken: token,
    username,
    roles: Array.isArray(roles) ? roles : [roles],
    expiresIn: typeof expiresIn === 'string' ? parseInt(expiresIn) : expiresIn,
    tokenType
  };

  return normalized;
};

/**
 * Verify and restore auth state from localStorage
 * Called on app load
 */
export const restoreAuthState = (): { isValid: boolean; email?: string; roles?: string[] } => {
  const token = localStorage.getItem('accessToken');
  const email = localStorage.getItem('userEmail');
  const rolesJson = localStorage.getItem('userRoles');
  const expiry = localStorage.getItem('tokenExpiry');

  if (!token || !email || !rolesJson || !expiry) {
    return { isValid: false };
  }

  // Check if token is expired
  const now = new Date().getTime();
  const expiryTime = parseInt(expiry);
  if (now >= expiryTime) {
    clearAuthData();
    return { isValid: false };
  }

  try {
    const roles = JSON.parse(rolesJson);
    return { isValid: true, email, roles };
  } catch (error) {
    clearAuthData();
    return { isValid: false };
  }
};

/**
 * Clear all auth data
 */
export const clearAuthData = (): void => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userRoles');
  localStorage.removeItem('tokenExpiry');
};
