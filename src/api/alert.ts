/**
 * Alert Management API - CLEAN VERSION
 * All duplicate functions removed
 */

import { getAuthHeader, getAuthToken } from './auth';

const API_BASE_URL = 'http://localhost:8080/api';

export interface Alert {
  id?: number;
  personId?: number;
  personCode?: string;
  personName?: string;
  alertType: string;
  message?: string;
  description?: string;
  createdAt?: string;
  resolvedAt?: string;
  acknowledgedAt?: string;
  isResolved?: boolean;
  isAcknowledged?: boolean;
}

export interface AlertDTO {
  id?: number;
  personId?: number;
  alertType: string;
  description?: string;
  createdAt?: string;
  acknowledgedAt?: string;
}

export interface HealthProfile {
  id?: number;
  personCode: string;
  isHotlisted: boolean;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * Get active alerts
 */
export const getActiveAlerts = async (): Promise<AlertDTO[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      console.warn('⚠️ No auth token available');
      return [];
    }

    console.log('📡 Fetching active alerts...');
    const response = await fetch(`${API_BASE_URL}/alerts/active`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.warn('⚠️ [401_ALERTS] Unauthorized');
        throw new Error('Unauthorized');
      }
      throw new Error(`Failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Alerts fetched:', data.length, 'items');
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching alerts:', error);
    throw error;
  }
};

/**
 * Acknowledge an alert
 */
export const acknowledgeAlert = async (alertId: number): Promise<void> => {
  try {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    console.log('📡 Acknowledging alert:', alertId);
    const response = await fetch(`${API_BASE_URL}/alerts/${alertId}/acknowledge`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.warn('⚠️ [401_ACK] Unauthorized');
        throw new Error('Unauthorized');
      }
      throw new Error(`Failed: ${response.statusText}`);
    }

    console.log('✅ Alert acknowledged');
  } catch (error) {
    console.error('❌ Error acknowledging alert:', error);
    throw error;
  }
};

/**
 * Delete an alert
 */
export const deleteAlert = async (alertId: number): Promise<void> => {
  try {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    console.log('📡 Deleting alert:', alertId);
    const response = await fetch(`${API_BASE_URL}/alerts/${alertId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.warn('⚠️ [401_DELETE] Unauthorized');
        throw new Error('Unauthorized');
      }
      throw new Error(`Failed: ${response.statusText}`);
    }

    console.log('✅ Alert deleted');
  } catch (error) {
    console.error('❌ Error deleting alert:', error);
    throw error;
  }
};

/**
 * Get active alert count
 */
export const getActiveAlertCount = async (): Promise<number> => {
  try {
    const token = getAuthToken();
    if (!token) return 0;

    console.log('📡 Fetching active alert count...');
    const response = await fetch(`${API_BASE_URL}/alerts/count/active`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.warn('⚠️ [401_COUNT] Unauthorized');
        throw new Error('Unauthorized');
      }
      throw new Error(`Failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Alert count:', data?.activeAlertCount);
    return data?.activeAlertCount || 0;
  } catch (error) {
    console.error('❌ Error fetching alert count:', error);
    return 0;
  }
};

/**
 * Get all hotlisted persons
 */
export const getAllHotlistedPersons = async (): Promise<HealthProfile[]> => {
  try {
    const token = getAuthToken();
    if (!token) return [];

    console.log('📡 Fetching hotlisted persons...');
    const response = await fetch(`${API_BASE_URL}/health-profile/hotlist/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.warn('⚠️ [401_HOTLIST] Unauthorized');
        throw new Error('Unauthorized');
      }
      throw new Error(`Failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Hotlisted persons:', data.length, 'items');
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching hotlisted persons:', error);
    throw error;
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
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    console.log('📡 Updating hotlist status:', { personCode, isHotlisted });
    const response = await fetch(`${API_BASE_URL}/health-profile/${personCode}/hotlist`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        isHotlisted,
        reason: isHotlisted ? reason : '',
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.warn('⚠️ [401_UPDATE] Unauthorized');
        throw new Error('Unauthorized');
      }
      throw new Error(`Failed: ${response.statusText}`);
    }

    console.log('✅ Hotlist status updated');
  } catch (error) {
    console.error('❌ Error updating hotlist status:', error);
    throw error;
  }
};
