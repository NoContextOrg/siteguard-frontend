/**
 * Authentication API service
 * Handles all auth-related API calls to the backend
 */

const API_BASE_URL = 'http://siteguardph.duckdns.org/api';

export interface LoginRequest {
  email: string;
  password: string;
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
    console.log('🔐 Login attempt with email:', loginData.email);
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });

    console.log('📡 Login response status:', response.status);

    if (!response.ok) {
      const errorData: AuthError = await response.json();
      console.error('❌ Login failed:', errorData);
      throw new Error(errorData.error || 'Login failed');
    }

    const data: AuthResponse = await response.json();
    console.log('✅ Login response received:', {
      hasToken: !!data.accessToken,
      username: data.username,
      roles: data.roles,
      expiresIn: data.expiresIn,
      tokenType: data.tokenType
    });
    
    // Normalize response in case backend returns different field names
    const normalized = normalizeAuthResponse(data);
    
    return normalized;
  } catch (error) {
    console.error('❌ Login error:', error);
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
    console.error('Token verification failed:', error);
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
 * Debug all localStorage operations
 * Log the complete state before and after each operation
 */
const logStorageState = (operation: string) => {
  const state = {
    accessToken: localStorage.getItem('accessToken') ? `EXISTS (${localStorage.getItem('accessToken')!.length} chars)` : 'MISSING',
    userEmail: localStorage.getItem('userEmail') || 'MISSING',
    userRoles: localStorage.getItem('userRoles') || 'MISSING',
    tokenExpiry: localStorage.getItem('tokenExpiry') || 'MISSING',
  };
  console.log(`[${operation}] localStorage state:`, state);
  return state;
};

/**
 * Store auth data in local storage with STRICT validation
 * CRITICAL: This MUST save the JWT to localStorage
 */
export const storeAuthData = (authResponse: AuthResponse): void => {
  try {
    console.log('💾 [AUTH_STORAGE_START] Storing auth response');
    
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
    console.log('✅ [TOKEN_STORED] accessToken is now in storage');

    // Step 3: Store userEmail
    localStorage.setItem('userEmail', authResponse.username || '');
    console.log('✅ [EMAIL_STORED] userEmail:', authResponse.username);

    // Step 4: Store userRoles
    const rolesJson = JSON.stringify(authResponse.roles);
    localStorage.setItem('userRoles', rolesJson);
    const verifyRoles = localStorage.getItem('userRoles');
    if (!verifyRoles) {
      throw new Error('Failed to store userRoles');
    }
    console.log('✅ [ROLES_STORED] userRoles:', authResponse.roles);

    // Step 5: Store tokenExpiry
    const expiryMs = new Date().getTime() + ((authResponse.expiresIn || 3600) * 1000);
    localStorage.setItem('tokenExpiry', expiryMs.toString());
    console.log('✅ [EXPIRY_STORED] Expires at:', new Date(expiryMs).toLocaleString());

    // Step 6: Final verification
    const finalState = {
      token: localStorage.getItem('accessToken') ? '✅ EXISTS' : '❌ MISSING',
      email: localStorage.getItem('userEmail') ? '✅ EXISTS' : '❌ MISSING',
      roles: localStorage.getItem('userRoles') ? '✅ EXISTS' : '❌ MISSING',
      expiry: localStorage.getItem('tokenExpiry') ? '✅ EXISTS' : '❌ MISSING',
    };
    console.log('✅ [AUTH_STORAGE_COMPLETE] Final state:', finalState);

  } catch (error) {
    console.error('❌ [AUTH_STORAGE_FAILED]', error);
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
  
  console.log('⏰ [TOKEN_CHECK] Validating token:', {
    hasToken: !!token,
    hasExpiry: !!expiry,
    tokenLength: token ? token.length : 0,
  });
  
  if (!token || !expiry) {
    console.warn('⚠️ [TOKEN_INVALID] Missing token or expiry', { 
      hasToken: !!token, 
      hasExpiry: !!expiry 
    });
    return false;
  }
  
  const now = new Date().getTime();
  const expiryTime = parseInt(expiry);
  const isValid = now < expiryTime;
  
  const timeRemaining = expiryTime - now;
  const minutesRemaining = Math.floor(timeRemaining / 1000 / 60);
  
  console.log('⏰ [TOKEN_VALIDITY]:', {
    isValid,
    minutesRemaining,
    expiryTime: new Date(expiryTime).toLocaleString(),
    currentTime: new Date(now).toLocaleString()
  });
  
  return isValid;
};

/**
 * Listen for logout events across browser tabs/windows
 * Only logs out when explicitly cleared, not on token expiry
 */
export const initAuthListener = () => {
  const handleStorageChange = (e: StorageEvent) => {
    console.log('🔍 Storage change detected:', {
      key: e.key,
      oldValue: e.oldValue ? e.oldValue.substring(0, 20) + '...' : 'null',
      newValue: e.newValue ? e.newValue.substring(0, 20) + '...' : 'null',
      url: e.url,
    });

    // Only redirect if accessToken is explicitly removed (logout action)
    // Check if value was present and is now null (logout from another tab)
    if (e.key === 'accessToken') {
      console.log('🔑 AccessToken change:', {
        hadValue: !!e.oldValue,
        hasValue: !!e.newValue,
        isLogout: e.oldValue !== null && e.newValue === null
      });

      if (e.oldValue !== null && e.newValue === null) {
        // User was logged in and now is logged out from another tab
        console.log('🚪 Logout detected from another tab');
        window.location.href = '/';
      }
    }

    // Log tokenExpiry changes
    if (e.key === 'tokenExpiry') {
      console.log('⏱️ TokenExpiry change:', {
        oldValue: e.oldValue,
        newValue: e.newValue,
        // Calculate time remaining if new value exists
        timeRemaining: e.newValue ? new Date(parseInt(e.newValue)).toLocaleString() : 'none'
      });
    }
  };

  window.addEventListener('storage', handleStorageChange);
  console.log('✅ Auth listener initialized');

  // Return cleanup function
  return () => {
    window.removeEventListener('storage', handleStorageChange);
    console.log('🧹 Auth listener cleaned up');
  };
};

/**
 * Validate and normalize auth response from backend
 * Backend might return different field names
 */
export const normalizeAuthResponse = (response: any): AuthResponse => {
  console.log('🔍 Normalizing auth response:', response);
  
  // Map possible field names from backend
  const token = response.accessToken || response.token || response.access_token;
  const username = response.username || response.email || response.user || 'Unknown';
  const roles = response.roles || response.user?.roles || [];
  const expiresIn = response.expiresIn || response.expires_in || 3600;
  const tokenType = response.tokenType || response.token_type || 'Bearer';

  if (!token) {
    console.error('❌ No token found in response');
    throw new Error('Invalid login response: no access token');
  }

  const normalized: AuthResponse = {
    accessToken: token,
    username,
    roles: Array.isArray(roles) ? roles : [roles],
    expiresIn: typeof expiresIn === 'string' ? parseInt(expiresIn) : expiresIn,
    tokenType
  };

  console.log('✅ Normalized response:', normalized);
  return normalized;
};

/**
 * Verify and restore auth state from localStorage
 * Called on app load
 */
export const restoreAuthState = (): { isValid: boolean; email?: string; roles?: string[] } => {
  console.log('🔍 [RESTORE_START] Checking localStorage for auth data...');
  
  const token = localStorage.getItem('accessToken');
  const email = localStorage.getItem('userEmail');
  const rolesJson = localStorage.getItem('userRoles');
  const expiry = localStorage.getItem('tokenExpiry');

  console.log('📦 [STORED_DATA]:', {
    token: token ? `✅ (${token.length} chars)` : '❌ MISSING',
    email: email ? `✅ (${email})` : '❌ MISSING',
    roles: rolesJson ? `✅ (${rolesJson})` : '❌ MISSING',
    expiry: expiry ? `✅ (${new Date(parseInt(expiry)).toLocaleString()})` : '❌ MISSING',
  });

  if (!token || !email || !rolesJson || !expiry) {
    console.warn('⚠️ [RESTORE_INCOMPLETE] Missing required auth data');
    return { isValid: false };
  }

  // Check if token is expired
  const now = new Date().getTime();
  const expiryTime = parseInt(expiry);
  if (now >= expiryTime) {
    console.warn('⏰ [TOKEN_EXPIRED] Token has expired');
    clearAuthData();
    return { isValid: false };
  }

  try {
    const roles = JSON.parse(rolesJson);
    console.log('✅ [RESTORE_SUCCESS] Auth state restored from storage');
    return { isValid: true, email, roles };
  } catch (error) {
    console.error('❌ [RESTORE_ERROR] Failed to parse roles:', error);
    clearAuthData();
    return { isValid: false };
  }
};

/**
 * Clear all auth data
 */
export const clearAuthData = (): void => {
  console.log('🧹 [CLEAR_AUTH] Removing all auth data from localStorage');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userRoles');
  localStorage.removeItem('tokenExpiry');
  console.log('✅ [CLEARED] Auth data cleared');
};
