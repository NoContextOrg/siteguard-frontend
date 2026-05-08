/**
 * Analytics API Service
 * Handles all API calls to the Analytics Controller
 */

import { authenticatedFetch, safeReadErrorMessage } from './fetch';

const API_BASE_URL = 'http://siteguardph.duckdns.org/api';

// ===== shared helpers (required by trends + exports) =====
const buildQuery = (params: Record<string, string | number | boolean | undefined | null>) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
};

const toBackendFilterParam = (key: TimeFilterKey): string => {
  switch (key) {
    case '3_HOURS':
      return '3_HOURS';
    case '6_HOURS':
      return '6_HOURS';
    case '12_HOURS':
      return '12_HOURS';
    case '24_HOURS':
      return '24_HOURS';
    case '7_DAYS':
      return '1_WEEK';
    case 'CUSTOM':
      // trends endpoints only accept filter; for custom ranges unified dashboard uses start/end.
      return '1_WEEK';
    default:
      return '1_WEEK';
  }
};

const exportTimeFilterToFilename = (f: DashboardTimeFilterState) => {
  if (f.key === 'CUSTOM') return `${f.start ?? 'start'}_${f.end ?? 'end'}`;
  if (f.key === '7_DAYS') return '7d';
  if (f.key === '24_HOURS') return '24h';
  if (f.key === '12_HOURS') return '12h';
  if (f.key === '6_HOURS') return '6h';
  if (f.key === '3_HOURS') return '3h';
  return 'range';
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// ===== Excel export (global) =====
export const exportAnalyticsExcel = async (opts: {
  exportType: ExportType;
  filter?: string;
  teamId?: number;
  role?: string;
  personCode?: string;
  alertType?: string;
  startDate?: string;
  endDate?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  filename: string;
}) => {
  const qs = buildQuery({
    exportType: opts.exportType,
    filter: opts.filter,
    teamId: opts.teamId,
    role: opts.role,
    personCode: opts.personCode,
    alertType: opts.alertType,
    startDate: opts.startDate,
    endDate: opts.endDate,
    sortField: opts.sortField,
    sortDirection: opts.sortDirection,
  });

  const response = await authenticatedFetch(`${API_BASE_URL}/analytics/export${qs}`, {
    headers: {
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  });

  if (!response.ok) {
    const msg = await safeReadErrorMessage(response);
    throw new Error(msg || `Failed to export analytics: ${response.statusText}`);
  }

  const blob = await response.blob();
  downloadBlob(blob, opts.filename);
};

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

export type TimeFilterKey = '3_HOURS' | '6_HOURS' | '12_HOURS' | '24_HOURS' | '7_DAYS' | 'CUSTOM';

export interface DashboardTimeFilterState {
  key: TimeFilterKey;
  start?: string; // YYYY-MM-DD
  end?: string;   // YYYY-MM-DD
}

export type ExportType =
  | 'ATTENDANCE_TRENDS'
  | 'ALERTS_OVERVIEW'
  | 'HOTLIST_REPORT'
  | 'OVERTIME_REPORT'
  | 'ANALYTICS_SUMMARY'
  | 'WORKER_ATTENDANCE_LOGS'
  | 'WORKER_TRENDS'
  | string;

export interface TrendResponseDTO {
  filter?: string;
  startDate?: string;
  endDate?: string;
  timeline?: Array<{ label: string; value: number }>;
  breakdown?: Array<{ name: string; value: number }>;
  summary?: Record<string, any>;
  [key: string]: any;
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

// ===== Trends endpoints =====
export const getAttendanceTrends = async (timeFilter: DashboardTimeFilterState): Promise<TrendResponseDTO> => {
  const filter = toBackendFilterParam(timeFilter.key);
  const qs = buildQuery({ filter });
  const response = await authenticatedFetch(`${API_BASE_URL}/analytics/trends/attendance${qs}`);
  if (!response.ok) {
    const msg = await safeReadErrorMessage(response);
    throw new Error(msg || `Failed to fetch attendance trends: ${response.statusText}`);
  }
  return response.json();
};

export const getHotlistTrends = async (timeFilter: DashboardTimeFilterState): Promise<TrendResponseDTO> => {
  const filter = toBackendFilterParam(timeFilter.key);
  const qs = buildQuery({ filter });
  const response = await authenticatedFetch(`${API_BASE_URL}/analytics/trends/hotlist${qs}`);
  if (!response.ok) {
    const msg = await safeReadErrorMessage(response);
    throw new Error(msg || `Failed to fetch hotlist trends: ${response.statusText}`);
  }
  return response.json();
};

export const getAlertTrends = async (timeFilter: DashboardTimeFilterState): Promise<TrendResponseDTO> => {
  const filter = toBackendFilterParam(timeFilter.key);
  const qs = buildQuery({ filter });
  const response = await authenticatedFetch(`${API_BASE_URL}/analytics/trends/alerts${qs}`);
  if (!response.ok) {
    const msg = await safeReadErrorMessage(response);
    throw new Error(msg || `Failed to fetch alert trends: ${response.statusText}`);
  }
  return response.json();
};

export const getStaffEfficiencyTrends = async (timeFilter: DashboardTimeFilterState): Promise<TrendResponseDTO> => {
  const filter = toBackendFilterParam(timeFilter.key);
  const qs = buildQuery({ filter });
  const response = await authenticatedFetch(`${API_BASE_URL}/analytics/trends/staff-efficiency${qs}`);
  if (!response.ok) {
    const msg = await safeReadErrorMessage(response);
    throw new Error(msg || `Failed to fetch staff efficiency trends: ${response.statusText}`);
  }
  return response.json();
};

export const getTeamAttendanceTrends = async (timeFilter: DashboardTimeFilterState): Promise<TrendResponseDTO> => {
  const filter = toBackendFilterParam(timeFilter.key);
  const qs = buildQuery({ filter });
  const response = await authenticatedFetch(`${API_BASE_URL}/analytics/trends/team-attendance${qs}`);
  if (!response.ok) {
    const msg = await safeReadErrorMessage(response);
    throw new Error(msg || `Failed to fetch team attendance trends: ${response.statusText}`);
  }
  return response.json();
};

export const getWorkerAttendanceTrends = async (
  personCode: string,
  timeFilter: DashboardTimeFilterState
): Promise<TrendResponseDTO> => {
  const filter = toBackendFilterParam(timeFilter.key);
  const qs = buildQuery({ filter });
  const response = await authenticatedFetch(
    `${API_BASE_URL}/analytics/trends/worker/${encodeURIComponent(personCode)}${qs}`
  );
  if (!response.ok) {
    const msg = await safeReadErrorMessage(response);
    throw new Error(msg || `Failed to fetch worker trends: ${response.statusText}`);
  }
  return response.json();
};

export const makeDefaultDashboardTimeFilter = (): DashboardTimeFilterState => ({
  key: '7_DAYS',
});

export const makeExportFilename = (prefix: string, timeFilter: DashboardTimeFilterState) => {
  const suffix = exportTimeFilterToFilename(timeFilter);
  return `${prefix}-${suffix}.xlsx`;
};

// Remove invalid/duplicate exports added above (helpers are already exported where they are defined).
// (no-op placeholders kept for clarity)

// Ensure the following are exported (or declared) exactly once in this file:
// - buildQuery
// - toBackendFilterParam
// - exportTimeFilterToFilename
// - exportAnalyticsExcel
// - exportWorkerExcel

// Worker export helper (Excel)
export const exportWorkerExcel = async (opts: {
  personCode: string;
  filter?: string;
  startDate?: string;
  endDate?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  filename: string;
}) => {
  const qs = buildQuery({
    filter: opts.filter,
    startDate: opts.startDate,
    endDate: opts.endDate,
    sortField: opts.sortField,
    sortDirection: opts.sortDirection,
  });

  const response = await authenticatedFetch(
    `${API_BASE_URL}/analytics/export/worker/${encodeURIComponent(opts.personCode)}${qs}`
  );

  if (!response.ok) {
    const msg = await safeReadErrorMessage(response);
    throw new Error(msg || `Failed to export worker data: ${response.statusText}`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = opts.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
