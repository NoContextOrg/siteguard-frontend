/**
 * API Configuration Service
 * Centralizes all API and WebSocket base URLs from environment variables
 * This ensures consistency across all API calls throughout the application
 */

// ===== API Base URLs =====
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://siteguardph.duckdns.org/api';

// ===== WebSocket Base URLs =====
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'wss://siteguardph.duckdns.org/ws';

// ===== Derived API Endpoints =====
export const API_ENDPOINTS = {
  // Analytics
  analytics: {
    dashboard: `${API_BASE_URL}/analytics/dashboard`,
    trends: `${API_BASE_URL}/analytics/trends`,
    export: `${API_BASE_URL}/analytics/export`,
    filter: `${API_BASE_URL}/analytics/filter`,
  },
  // Attendance
  attendance: {
    export: `${API_BASE_URL}/export/attendance`,
    records: `${API_BASE_URL}/attendance`,
    plot: `${API_BASE_URL}/analytics/attendance-plot`,
  },
  // Alerts
  alerts: {
    active: `${API_BASE_URL}/alerts/active`,
    list: `${API_BASE_URL}/alerts`,
    acknowledge: `${API_BASE_URL}/alerts/acknowledge`,
  },
  // Person/Authentication
  person: {
    all: `${API_BASE_URL}/person`,
    current: `${API_BASE_URL}/person/current`,
    by_code: (code: string) => `${API_BASE_URL}/person/${code}`,
  },
  // Teams
  teams: {
    list: `${API_BASE_URL}/teams`,
    by_id: (id: number) => `${API_BASE_URL}/teams/${id}`,
  },
};

// ===== Derived WebSocket Endpoints =====
export const WS_ENDPOINTS = {
  alerts: `${WS_BASE_URL}/alerts`,
  notifications: `${WS_BASE_URL}/notifications`,
  attendance: `${WS_BASE_URL}/attendance`,
};

// ===== Environment Variables Reference =====
// .env.local or .env files should contain:
// VITE_API_URL=http://siteguardph.duckdns.org/api
// VITE_WS_URL=ws://siteguardph.duckdns.org/ws
