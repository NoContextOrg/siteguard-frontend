/**
 * Attendance API service
 * Handles all attendance-related API calls
 */

import { authenticatedFetch } from './fetch';

const API_BASE_URL = 'http://localhost:8080/api';

export interface AttendanceLog {
  id?: number;
  personCode: string;
  personName?: string;
  eventType: 'LOGIN' | 'LOGOUT' | 'OVERTIME';
  eventTimestamp: string;
  rawPayload?: string;
  createdAt?: string;
}

export interface AttendanceDTO {
  personCode: string;
  eventType: string;
  rawPayload?: string;
}

export interface AttendanceSummary {
  date: string;
  presentCount: number;
  totalLogs: number;
}

export interface AttendanceStats {
  from: string;
  to: string;
  totalLogins: number;
  totalLogouts: number;
  uniquePersons: number;
  totalLogs: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * Log attendance event (from IoT device or manual entry)
 * Supports device identification via headers for IoT integration
 */
export const logAttendance = async (
  payload: Record<string, unknown>,
  deviceId?: string,
  apiKey?: string
): Promise<any> => {
  try {
    const headers: Record<string, string> = {};
    if (deviceId) headers['X-Device-ID'] = deviceId;
    if (apiKey) headers['X-API-Key'] = apiKey;

    const response = await authenticatedFetch(`${API_BASE_URL}/attendance/log`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to log attendance: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error logging attendance:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * Batch log attendance events
 * Optimized for IoT device submissions with multiple events
 */
export const batchLogAttendance = async (
  events: Record<string, unknown>[],
  deviceId?: string,
  apiKey?: string
): Promise<any> => {
  try {
    const headers: Record<string, string> = {};
    if (deviceId) headers['X-Device-ID'] = deviceId;
    if (apiKey) headers['X-API-Key'] = apiKey;

    const response = await authenticatedFetch(`${API_BASE_URL}/attendance/batch`, {
      method: 'POST',
      body: JSON.stringify(events),
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to batch log attendance: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error batch logging attendance:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * Get attendance history for a person
 */
export const getAttendanceByPerson = async (personCode: string): Promise<AttendanceLog[]> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/attendance/person/${personCode}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch attendance: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error(`Error fetching attendance for ${personCode}:`, error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * Get attendance logs within a date range for a person
 */
export const getAttendanceByPersonAndDateRange = async (
  personCode: string,
  from?: string,
  to?: string
): Promise<AttendanceLog[]> => {
  try {
    let url = `${API_BASE_URL}/attendance/person/${personCode}/range`;
    const params = new URLSearchParams();
    
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await authenticatedFetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch attendance: ${response.statusText}`);
    }

    const data: ApiResponse<AttendanceLog[]> = await response.json();
    return data.data || [];
  } catch (error) {
    console.error(`Error fetching attendance for ${personCode} in range:`, error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * Get all attendance logs
 */
export const getAllAttendance = async (): Promise<AttendanceLog[]> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/attendance`);

    if (!response.ok) {
      throw new Error(`Failed to fetch attendance: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error fetching all attendance:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * Get today's attendance summary
 */
export const getTodaysSummary = async (): Promise<AttendanceSummary> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/attendance/summary/today`);

    if (!response.ok) {
      throw new Error(`Failed to fetch today's summary: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('Error fetching today\'s summary:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * Get attendance statistics for a date range
 */
export const getAttendanceStats = async (
  from?: string,
  to?: string
): Promise<AttendanceStats> => {
  try {
    let url = `${API_BASE_URL}/attendance/stats`;
    const params = new URLSearchParams();
    
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await authenticatedFetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch attendance stats: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * ESP32 Compatibility: GET /api/biometric -> { lastId: number }
 *
 * Backend Option A: this endpoint may be public. We intentionally do NOT require auth here,
 * to support device polling even when a user session isn't established.
 */
export const getBiometricLastId = async (): Promise<number> => {
  const response = await fetch(`${API_BASE_URL}/biometric`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const msg = await response.text().catch(() => response.statusText);
    throw new Error(msg || `Failed to fetch biometric lastId: ${response.statusText}`);
  }

  const data = await response.json().catch(() => ({} as any));
  const lastId = (data?.lastId ?? data?.data?.lastId) as unknown;
  const n = typeof lastId === 'number' ? lastId : Number(lastId);
  return Number.isFinite(n) ? n : 0;
};

export type BiometricAction = 'SCAN' | 'REGISTER' | 'RENAME';

/**
 * ESP32 Compatibility: POST /api/biometric
 *
 * Backend currently supports SCAN and REGISTER (RENAME is reserved).
 */
export const postBiometricAction = async (payload: {
  userId: number | string;
  action: BiometricAction;
  name?: string;
}): Promise<any> => {
  const doUnauthed = async () => {
    const r = await fetch(`${API_BASE_URL}/biometric`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const msg = await r.text().catch(() => r.statusText);
      throw new Error(msg || `Failed to post biometric action: ${r.statusText}`);
    }

    return r.json().catch(() => ({}));
  };

  const response = await authenticatedFetch(`${API_BASE_URL}/biometric`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    // If backend is configured as public for biometric endpoints, fall back to no-auth request.
    if (response.status === 401 || response.status === 403) {
      return doUnauthed();
    }

    const msg = await response.text().catch(() => response.statusText);
    throw new Error(msg || `Failed to post biometric action: ${response.statusText}`);
  }

  // May return JSON map
  return response.json().catch(() => ({}));
};
