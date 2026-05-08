/**
 * Analytics API Service
 * Handles all API calls to the Analytics Controller
 */

import { authenticatedFetch, safeReadErrorMessage } from './fetch';

const API_BASE_URL = 'http://localhost:8080/api';

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

export interface NameValuePair {
  name: string;
  value: number;
}

export interface UnifiedAnalyticsResponse {
  systemStats?: SystemStats;
  dashboardOverview?: DashboardOverview;
  hotlistOverview?: {
    count: number;
    list: Array<{
      personCode: string;
      name: string;
      role: string;
      team: string;
    }>;
    graph: NameValuePair[];
  };
  alertsOverview?: AlertsOverview;
  staffEfficiency?: {
    periodStart: string;
    periodEnd: string;
    totalStaff: number;
    staffByRole: NameValuePair[];
    staffByTeam: NameValuePair[];
  };
  attendancePlot?: AttendancePlot;
  teamAttendance?: TeamAttendanceResponse;
  overallAttendanceOverview?: {
    totalPersons: number;
    presentToday: number;
    absentToday: number;
    attendanceRate: number;
    trend: string;
    trendPercentage: number;
    roleBreakdown: NameValuePair[];
    teamBreakdown: NameValuePair[];
    timestamp: string;
  };
  hotlistAttendanceOverview?: {
    totalHotlisted: number;
    presentHotlisted: number;
    absentHotlisted: number;
    hotlistAttendanceRate: number;
    trend: string;
    trendPercentage: number;
    dailyTrend: Array<{date: string, present: number, absent: number, rate: number}>;
    riskIndicators: Array<{personCode: string, name: string, team: string, riskLevel: string, consecutiveAbsentDays: number, lastSeenDate: string}>;
    timestamp: string;
  };
  enhancedAttendanceOverview?: {
    timeSeries: Array<{date: string, count: number}>;
    teamBreakdown: Array<{name: string, present: number, absent: number, leave: number}>;
    roleBreakdown: NameValuePair[];
    totalPresent: number;
    totalAbsent: number;
    overallRate: number;
    trend: string;
    trendPercentage: number;
    startDate: string;
    endDate: string;
  };
  enhancedHotlistOverview?: {
    totalHotlisted: number;
    list: Array<{personCode: string, name: string, role: string, team: string}>;
    teamBreakdown: NameValuePair[];
    trends: Array<{date: string, present: number, absent: number, rate: number}>;
    riskIndicators: Array<{personCode: string, name: string, team: string, riskLevel: string, consecutiveAbsentDays: number, lastSeenDate: string}>;
    attendanceRate: number;
    trend: string;
    trendPercentage: number;
    timestamp: string;
  };
  teamAttendanceOverview?: {
    teamMetrics: Array<{teamName: string, totalMembers: number, presentToday: number, absentToday: number, attendanceRate: number, trend: string, trendPercentage: number, historicalTrend: Array<{date: string, count: number}>}>;
    topPerformingTeams: Array<{teamName: string, attendanceRate: number, trend: string, trendPercentage: number, rank: number}>;
    lowestPerformingTeams: Array<{teamName: string, attendanceRate: number, trend: string, trendPercentage: number, rank: number}>;
    overallAverageRate: number;
    overallTrend: string;
    startDate: string;
    endDate: string;
  };
}

// ========== ANALYTICS ENDPOINTS ========== //

/**
 * Get system statistics (counts by role)
 */
export const getSystemStats = async (): Promise<SystemStats> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/analytics/stats`);

    if (!response.ok) {
      const msg = await safeReadErrorMessage(response);
      throw new Error(msg || `Failed to fetch system stats: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching system stats:', error);
    throw error;
  }
};

/**
 * Get unified analytics data for all dashboards
 */
export const getUnifiedDashboard = async (
  date?: string,
  start?: string,
  end?: string
): Promise<UnifiedAnalyticsResponse> => {
  try {
    let url = `${API_BASE_URL}/analytics/dashboard`;
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await authenticatedFetch(url);

    if (!response.ok) {
      const msg = await safeReadErrorMessage(response);
      throw new Error(msg || `Failed to fetch unified dashboard: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching unified dashboard:', error);
    throw error;
  }
};

/**
 * Get dashboard overview
 */
export const getDashboardOverview = async (date?: string): Promise<DashboardOverview> => {
  try {
    let url = `${API_BASE_URL}/analytics/overview`;
    if (date) {
      url += `?date=${encodeURIComponent(date)}`;
    }

    const response = await authenticatedFetch(url);

    if (!response.ok) {
      const msg = await safeReadErrorMessage(response);
      throw new Error(msg || `Failed to fetch dashboard overview: ${response.statusText}`);
    }

    return await response.json();
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
    const response = await authenticatedFetch(`${API_BASE_URL}/analytics/hotlist`);

    if (!response.ok) {
      const msg = await safeReadErrorMessage(response);
      throw new Error(msg || `Failed to fetch hotlist overview: ${response.statusText}`);
    }

    return await response.json();
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
    let url = `${API_BASE_URL}/analytics/attendance-plot`;
    const params = new URLSearchParams();
    if (startDate) params.append('start', startDate);
    if (endDate) params.append('end', endDate);
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await authenticatedFetch(url);

    if (!response.ok) {
      const msg = await safeReadErrorMessage(response);
      throw new Error(msg || `Failed to fetch attendance plot: ${response.statusText}`);
    }

    return await response.json();
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
    let url = `${API_BASE_URL}/analytics/team-attendance`;
    const params = new URLSearchParams();
    if (startDate) params.append('start', startDate);
    if (endDate) params.append('end', endDate);
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await authenticatedFetch(url);

    if (!response.ok) {
      const msg = await safeReadErrorMessage(response);
      throw new Error(msg || `Failed to fetch team attendance: ${response.statusText}`);
    }

    return await response.json();
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
    const response = await authenticatedFetch(`${API_BASE_URL}/analytics/members-per-team`);

    if (!response.ok) {
      const msg = await safeReadErrorMessage(response);
      throw new Error(msg || `Failed to fetch members per team: ${response.statusText}`);
    }

    return await response.json();
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
    let url = `${API_BASE_URL}/analytics/overtime`;
    if (date) {
      url += `?date=${encodeURIComponent(date)}`;
    }

    const response = await authenticatedFetch(url);

    if (!response.ok) {
      const msg = await safeReadErrorMessage(response);
      throw new Error(msg || `Failed to fetch overtime overview: ${response.statusText}`);
    }

    return await response.json();
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
    let url = `${API_BASE_URL}/analytics/daily-report`;
    if (date) {
      url += `?date=${encodeURIComponent(date)}`;
    }

    const response = await authenticatedFetch(url);

    if (!response.ok) {
      const msg = await safeReadErrorMessage(response);
      throw new Error(msg || `Failed to generate daily report: ${response.statusText}`);
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
    const response = await authenticatedFetch(`${API_BASE_URL}/analytics/alerts`);

    if (!response.ok) {
      const msg = await safeReadErrorMessage(response);
      throw new Error(msg || `Failed to fetch alerts overview: ${response.statusText}`);
    }

    return await response.json();
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
    let url = `${API_BASE_URL}/analytics/staff-efficiency`;
    const params = new URLSearchParams();
    if (startDate) params.append('start', startDate);
    if (endDate) params.append('end', endDate);
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await authenticatedFetch(url);

    if (!response.ok) {
      const msg = await safeReadErrorMessage(response);
      throw new Error(msg || `Failed to fetch staff efficiency: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching staff efficiency:', error);
    throw error;
  }
};
