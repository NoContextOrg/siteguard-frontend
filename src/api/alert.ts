/**
 * Alert API service
 * Handles alert and health profile related API calls
 */

import { authenticatedFetch } from './fetch';

const API_BASE_URL = 'http://siteguardph.duckdns.org/api';

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
 * Get all active (unacknowledged) alerts
 */
export const getActiveAlerts = async (): Promise<AlertDTO[]> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/alerts/active`);

    if (!response.ok) {
      throw new Error(`Failed to fetch active alerts: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * Get all active alerts (legacy alias)
 */
export const getAllAlerts = async (): Promise<AlertDTO[]> => {
  return getActiveAlerts();
};

/**
 * Get alerts for a specific person (by person ID)
 */
export const getAlertsByPersonId = async (personId: number): Promise<AlertDTO[]> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/alerts/person/${personId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch alerts for person: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error(`Error fetching alerts for person ${personId}:`, error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * Get alerts for a specific person (legacy - by person code)
 */
export const getAlertsForPerson = async (personCode: string): Promise<AlertDTO[]> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/alerts/person/${personCode}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch alerts: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error(`Error fetching alerts for ${personCode}:`, error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * Get alerts by type
 */
export const getAlertsByType = async (alertType: string): Promise<AlertDTO[]> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/alerts/type/${alertType}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch alerts by type: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error(`Error fetching alerts of type ${alertType}:`, error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * Acknowledge an alert (mark as read/resolved)
 */
export const acknowledgeAlert = async (alertId: number): Promise<AlertDTO> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/alerts/${alertId}/acknowledge`, {
      method: 'PUT',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to acknowledge alert: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error(`Error acknowledging alert:`, error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * Resolve an alert (legacy alias for acknowledge)
 */
export const resolveAlert = async (alertId: number): Promise<AlertDTO> => {
  return acknowledgeAlert(alertId);
};

/**
 * Get count of active alerts
 */
export const getActiveAlertCount = async (): Promise<number> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/alerts/count/active`);

    if (!response.ok) {
      throw new Error(`Failed to fetch alert count: ${response.statusText}`);
    }

    const data = await response.json();
    return data.activeAlertCount || 0;
  } catch (error) {
    console.error('Error fetching active alert count:', error);
    return 0;
  }
};

/**
 * Get count of alerts by type
 */
export const getAlertCountByType = async (alertType: string): Promise<number> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/alerts/count/type/${alertType}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch alert count: ${response.statusText}`);
    }

    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error(`Error fetching alert count for type ${alertType}:`, error);
    return 0;
  }
};

/**
 * Delete an alert (admin only)
 */
export const deleteAlert = async (alertId: number): Promise<void> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/alerts/${alertId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to delete alert: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Error deleting alert:`, error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * Get health profile for a person
 */
export const getHealthProfile = async (personCode: string): Promise<HealthProfile> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/health-profile/${personCode}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch health profile: ${response.statusText}`);
    }

    const data: ApiResponse<HealthProfile> = await response.json();
    if (!data.data) {
      throw new Error('Health profile not found');
    }
    return data.data;
  } catch (error) {
    console.error(`Error fetching health profile for ${personCode}:`, error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * Update hotlist status for a person
 */
export const updateHotlistStatus = async (
  personCode: string,
  isHotlisted: boolean,
  reason?: string
): Promise<HealthProfile> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/health-profile/${personCode}/hotlist`, {
      method: 'PUT',
      body: JSON.stringify({ isHotlisted, reason }),
    });

    if (!response.ok) {
      const errorData: ApiResponse<null> = await response.json();
      throw new Error(
        errorData.message || `Failed to update hotlist status: ${response.statusText}`
      );
    }

    const data: ApiResponse<HealthProfile> = await response.json();
    if (!data.data) {
      throw new Error('Failed to update hotlist status');
    }
    return data.data;
  } catch (error) {
    console.error(`Error updating hotlist status:`, error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * Get all hotlisted persons
 */
export const getAllHotlistedPersons = async (): Promise<HealthProfile[]> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/health-profile/hotlist/all`);

    if (!response.ok) {
      throw new Error(`Failed to fetch hotlisted persons: ${response.statusText}`);
    }

    const data: ApiResponse<HealthProfile[]> = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching hotlisted persons:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * Create an alert manually (if allowed)
 * Note: Alerts are typically triggered automatically by system events.
 * This endpoint may not exist or may be restricted.
 */
export const createAlert = async (
  personCode: string,
  alertType: string,
  message: string
): Promise<Alert> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/alerts`, {
      method: 'POST',
      body: JSON.stringify({ personCode, alertType, message }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to create alert: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error(`Error creating alert:`, error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};
