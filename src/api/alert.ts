/**
 * Alert Management API - CLEAN + BACKEND ALIGNED VERSION (FINAL)
 */

import { getAuthHeader, getAuthToken } from './auth';

const API_BASE_URL = 'http://siteguardph.duckdns.org/api';

/**
 * Backend-aligned AlertDTO
 */
export interface AlertDTO {
  id?: number;
  personId?: number;
  personCode?: string;
  personName?: string;
  alertType: string;
  alertMessage?: string;
  isAcknowledged?: boolean;
  createdAt?: string;
  acknowledgedAt?: string;
  acknowledgedByName?: string;
}

/**
 * Backend-aligned HealthProfile (hotlist module)
 */
export interface HealthProfile {
  id?: number;
  personCode: string;
  isHotlisted: boolean;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
}

/* =========================================================
   INTERNAL SAFE FETCH WRAPPER (reduces repetition bugs)
========================================================= */
const safeFetch = async (url: string, options?: RequestInit) => {
  const token = getAuthToken();

  if (!token) {
    console.warn('⚠️ Missing auth token');
    throw new Error('Not authenticated');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || response.statusText);
  }

  return response;
};

/* =========================================================
   ALERTS
========================================================= */

/**
 * Get active alerts
 */
export const getActiveAlerts = async (): Promise<AlertDTO[]> => {
  try {
    const res = await safeFetch(`${API_BASE_URL}/alerts/active`);
    const data = (await res.json()) as AlertDTO[];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('❌ getActiveAlerts:', error);
    return [];
  }
};

/**
 * Acknowledge alert
 */
export const acknowledgeAlert = async (alertId: number): Promise<void> => {
  try {
    await safeFetch(
      `${API_BASE_URL}/alerts/${alertId}/acknowledge`,
      { method: 'PUT' }
    );
  } catch (error) {
    console.error('❌ acknowledgeAlert:', error);
    throw error;
  }
};

/**
 * Delete alert (ADMIN only backend rule)
 */
export const deleteAlert = async (alertId: number): Promise<void> => {
  try {
    await safeFetch(`${API_BASE_URL}/alerts/${alertId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('❌ deleteAlert:', error);
    throw error;
  }
};

/**
 * Get active alert count
 * Backend returns: number (Long)
 */
export const getActiveAlertCount = async (): Promise<number> => {
  try {
    const res = await safeFetch(`${API_BASE_URL}/alerts/count/active`);
    const data = await res.json();

    return typeof data === 'number' ? data : 0;
  } catch (error) {
    console.error('❌ getActiveAlertCount:', error);
    return 0;
  }
};

/* =========================================================
   HOTLIST (HEALTH PROFILE MODULE)
========================================================= */

/**
 * Get all hotlisted persons
 */
export const getAllHotlistedPersons = async (): Promise<HealthProfile[]> => {
  try {
    const res = await safeFetch(
      `${API_BASE_URL}/health-profile/hotlist/all`
    );

    const data = (await res.json()) as HealthProfile[];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('❌ getAllHotlistedPersons:', error);
    return [];
  }
};

/**
 * Update hotlist status
 */
export const updateHotlistStatus = async (
  personCode: string,
  isHotlisted: boolean,
  reason: string
): Promise<void> => {
  try {
    await safeFetch(
      `${API_BASE_URL}/health-profile/person/${personCode}/hotlist`,
      {
        method: 'PUT',
        body: JSON.stringify({
          isHotlisted,
          reason: isHotlisted ? reason : '',
        }),
      }
    );
  } catch (error) {
    console.error('❌ updateHotlistStatus:', error);
    throw error;
  }
};

/* =========================================================
   DISPATCH ALERT
========================================================= */

/**
 * Dispatch alert for real-time notifications
 */
export async function dispatchAlert(payload: {
  alertType: string;
  personCode?: string;
  personId?: number;
}) {
  const res = await safeFetch(`${API_BASE_URL}/alerts/trigger`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return await res.json().catch(() => ({}));
}