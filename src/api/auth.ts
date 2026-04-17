/**
 * Authentication API service
 * Handles all auth-related API calls to the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

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
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });

    if (!response.ok) {
      const errorData: AuthError = await response.json();
      throw new Error(errorData.error || 'Login failed');
    }

    const data: AuthResponse = await response.json();
    return data;
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
 * Store auth data in local storage
 */
export const storeAuthData = (authResponse: AuthResponse): void => {
  localStorage.setItem('accessToken', authResponse.accessToken);
  localStorage.setItem('userEmail', authResponse.username);
  localStorage.setItem('userRoles', JSON.stringify(authResponse.roles));
  
  // Calculate expiry time (current time + expiresIn seconds)
  const expiryTime = new Date().getTime() + (authResponse.expiresIn * 1000);
  localStorage.setItem('tokenExpiry', expiryTime.toString());
};

/**
 * Get authorization header for API requests
 */
export const getAuthHeader = (): Record<string, string> => {
  const token = getAuthToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};
