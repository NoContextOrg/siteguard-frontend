/**
 * Authenticated Fetch Wrapper
 * Automatically includes JWT token in all API requests
 */

interface RequestOptions extends RequestInit {
  body?: string | FormData | null;
}

/**
 * Authenticated fetch helper
 * - Always attaches Authorization: Bearer <token> from localStorage
 * - Never assumes JSON error bodies (backend may return plain text)
 */
export const authenticatedFetch = async (
  input: RequestInfo | URL,
  init: RequestOptions = {}
): Promise<Response> => {
  const token = localStorage.getItem('accessToken');
  const rolesRaw = localStorage.getItem('userRoles');

  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type') && init.body != null && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Debug: verify auth header + roles at the moment of request
  const urlStr = typeof input === 'string' ? input : (input as any)?.toString?.();
  const authHeader = headers.get('Authorization');
  let roles: unknown = null;
  try {
    roles = rolesRaw ? JSON.parse(rolesRaw) : null;
  } catch {
    roles = rolesRaw;
  }
  console.log('🧾 [AUTH_FETCH]', {
    url: urlStr,
    method: init.method || 'GET',
    hasToken: !!token,
    tokenLength: token?.length || 0,
    hasAuthorizationHeader: !!authHeader,
    authorizationPrefix: authHeader ? authHeader.split(' ')[0] : null,
    roles,
  });

  const response = await fetch(input, {
    ...init,
    headers,
  });

  // Helpful debug for 401s
  if (response.status === 401) {
    let bodyText = '';
    try {
      bodyText = await response.clone().text();
    } catch {
      // ignore
    }
    console.warn('⚠️ [AUTH_FETCH_401]', {
      url: urlStr,
      hasToken: !!token,
      tokenLength: token?.length || 0,
      hasAuthorizationHeader: !!authHeader,
      roles,
      responseBody: bodyText?.slice(0, 200),
    });
  }

  return response;
};

/**
 * Safe response parsing utility
 */
export const safeReadErrorMessage = async (response: Response): Promise<string> => {
  try {
    const text = await response.text();
    if (!text) return response.statusText || `Request failed (${response.status})`;
    try {
      const json = JSON.parse(text);
      return json?.message || json?.error || text;
    } catch {
      return text;
    }
  } catch {
    return response.statusText || `Request failed (${response.status})`;
  }
};
