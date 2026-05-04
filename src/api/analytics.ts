/**
 * Analytics API Service
 * Handles all API calls to the Analytics Controller
 */

import { getAuthHeader } from './auth';

const API_BASE_URL = 'http://siteguardph.duckdns.org/api';

// ========== INTERFACES ========== //

export interface SystemStats {
  total_persons: number;
  admins: number;
  engineers: number;
  nurses: number;
  workers: number;
  staff: number;
}

export interface DashboardOverview {
  totalPersons?: number;
  onsitePersonsToday?: number;
  siteEngineersTotal?: number;
  hotlistWorkers?: number;
  workersAdmitted?: number;
  siteEngineersAdmitted?: number;
  totalTeams?: number;
  admittedTeams?: number;
  attendanceRate?: string;
  attendanceOverview?: Record<string, string[]>;
  alerts?: any[];
  timestamp?: string;
  [key: string]: any;
}

export interface HotlistOverview {
  count: number;
  list: Array<{
    personCode: string;
    name: string;
    role: string;
    team: string;
  }>;
  graph: Record<string, number>;
  [key: string]: any;
}

export interface AttendancePlot {
  start: string;
  end: string;
  counts: Record<string, number>;
}

export interface TeamAttendanceResponse {
  teamDateCounts: Record<string, Record<string, number>>;
  hotlistPerTeam: Record<string, number>;
}

export interface OvertimeData {
  note?: string;
  data?: any[];
  [key: string]: any;
}

export interface AlertsOverview {
  totalActive: number;
  hotlistAlerts: number;
  overtimeAlerts: number;
  medicalAlerts: number;
  lastUpdated: string;
}

export interface StaffEfficiencyResponse {
  periodStart: string;
  periodEnd: string;
  totalStaff: number;
  staffByRole: Record<string, number>;
  staffByTeam: Record<string, number>;
  metrics: any[];
  note?: string;
}

// ========== ANALYTICS ENDPOINTS ========== //

/**
 * Get system statistics (counts by role)
 */
export const getSystemStats = async (): Promise<SystemStats> => {
  try {
    const response = await fetch(`${API_BASE_URL}/analytics/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch system stats: ${response.statusText}`);
    }

    const data: SystemStats = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching system stats:', error);
    throw error;
  }
};

/**
 * Get dashboard overview
 */
export const getDashboardOverview = async (date?: string): Promise<DashboardOverview> => {
  try {
    const url = new URL(`${API_BASE_URL}/analytics/overview`);
    if (date) {
      url.searchParams.append('date', date);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard overview: ${response.statusText}`);
    }

    const data: DashboardOverview = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    throw error;
  }
};

/**
 * Get hotlist overview
 */
export const getHotlistOverview = async (): Promise<HotlistOverview> => {
  try {
    const response = await fetch(`${API_BASE_URL}/analytics/hotlist`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch hotlist overview: ${response.statusText}`);
    }

    const data: HotlistOverview = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching hotlist overview:', error);
    throw error;
  }
};

/**
 * Get attendance plot data
 */
export const getAttendancePlot = async (startDate?: string, endDate?: string): Promise<AttendancePlot> => {
  try {
    const url = new URL(`${API_BASE_URL}/analytics/attendance-plot`);
    if (startDate) {
      url.searchParams.append('start', startDate);
    }
    if (endDate) {
      url.searchParams.append('end', endDate);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch attendance plot: ${response.statusText}`);
    }

    const data: AttendancePlot = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching attendance plot:', error);
    throw error;
  }
};

/**
 * Get team attendance data
 */
export const getTeamAttendance = async (startDate?: string, endDate?: string): Promise<TeamAttendanceResponse> => {
  try {
    const url = new URL(`${API_BASE_URL}/analytics/team-attendance`);
    if (startDate) {
      url.searchParams.append('start', startDate);
    }
    if (endDate) {
      url.searchParams.append('end', endDate);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch team attendance: ${response.statusText}`);
    }

    const data: TeamAttendanceResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching team attendance:', error);
    throw error;
  }
};

/**
 * Get members per team breakdown
 */
export const getMembersPerTeam = async (): Promise<Record<string, number>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/analytics/members-per-team`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch members per team: ${response.statusText}`);
    }

    const data: Record<string, number> = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching members per team:', error);
    throw error;
  }
};

/**
 * Get overtime overview
 */
export const getOvertimeOverview = async (date?: string): Promise<OvertimeData> => {
  try {
    const url = new URL(`${API_BASE_URL}/analytics/overtime`);
    if (date) {
      url.searchParams.append('date', date);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch overtime overview: ${response.statusText}`);
    }

    const data: OvertimeData = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching overtime overview:', error);
    throw error;
  }
};

/**
 * Generate daily attendance report (CSV)
 */
export const generateDailyReport = async (date?: string): Promise<Blob> => {
  try {
    const url = new URL(`${API_BASE_URL}/analytics/daily-report`);
    if (date) {
      url.searchParams.append('date', date);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to generate daily report: ${response.statusText}`);
    }

    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('Error generating daily report:', error);
    throw error;
  }
};

/**
 * Download daily attendance report
 */
export const downloadDailyReport = async (date?: string): Promise<void> => {
  try {
    const blob = await generateDailyReport(date);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `daily-attendance-${date || new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading daily report:', error);
    throw error;
  }
};

/**
 * Get alerts overview
 */
export const getAlertsOverview = async (): Promise<AlertsOverview> => {
  try {
    const response = await fetch(`${API_BASE_URL}/analytics/alerts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch alerts overview: ${response.statusText}`);
    }

    const data: AlertsOverview = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching alerts overview:', error);
    throw error;
  }
};

/**
 * Get staff efficiency metrics
 */
export const getStaffEfficiency = async (startDate?: string, endDate?: string): Promise<StaffEfficiencyResponse> => {
  try {
    const url = new URL(`${API_BASE_URL}/analytics/staff-efficiency`);
    if (startDate) {
      url.searchParams.append('start', startDate);
    }
    if (endDate) {
      url.searchParams.append('end', endDate);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch staff efficiency: ${response.statusText}`);
    }

    const data: StaffEfficiencyResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching staff efficiency:', error);
    throw error;
  }
};
