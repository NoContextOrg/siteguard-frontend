/**
 * Authenticated Fetch Wrapper
 * Automatically includes JWT token in all API requests
 */

import { getAuthHeader } from './auth';

interface RequestOptions extends RequestInit {
  body?: string | FormData | null;
}

export const authenticatedFetch = async (
  url: string,
  options: RequestOptions = {}
): Promise<Response> => {
  const headers = {
    ...getAuthHeader(),
    ...(!(options.body instanceof FormData) && {
      'Content-Type': 'application/json',
    }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle token expiration
  if (response.status === 401) {
    // Token expired, redirect to login
    localStorage.removeItem('accessToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userRoles');
    localStorage.removeItem('tokenExpiry');
    window.location.href = '/';
  }

  return response;
};
