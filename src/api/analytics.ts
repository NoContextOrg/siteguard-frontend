/**
 * Analytics API Service
 * Handles all API calls to the Analytics Controller
 */

import { authenticatedFetch, safeReadErrorMessage } from './fetch';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://siteguardph.duckdns.org/api';

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

// ===== Timing Metrics Formatting =====
/** Format milliseconds to human-readable string */
export const formatMs = (ms: number | null | undefined): string => {
  if (ms === null || ms === undefined) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

/** Calculate average timing metric from array of workers */
export const getAverageTimingMetric = (
  workers: BiometricTimingMetrics[],
  metricKey: keyof BiometricTimingMetrics
): number | null => {
  const values = workers
    .map((w) => w[metricKey])
    .filter((v): v is number => v !== null && v !== undefined);
  
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
};

const jsonToCsv = (data: any[], metadata?: ExportMetadata): string => {
  let columns: string[] = [];
  let headers: string[] = [];

  if (metadata?.columns && metadata.columns.length > 0) {
    columns = metadata.columns;
    headers = columns.map(c => metadata.columnHeaders?.[c] || c);
  } else if (data && data.length > 0) {
    columns = Object.keys(data[0]);
    headers = [...columns];
  } else {
    return '';
  }

  const rows = (data || []).map(row => 
    columns.map(col => {
      const cell = row[col] === null || row[col] === undefined ? '' : String(row[col]);
      return `"${cell.replace(/"/g, '""')}"`;
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
};

// ========== INTERFACES ========== //

export interface ExportMetadata {
  exportType?: string;
  format?: string;
  appliedFilters?: Record<string, any>;
  generatedAt?: string;
  filename?: string;
  executionTimeMs?: number;
  columns?: string[];
  columnHeaders?: Record<string, string>;
}

export interface FilterResponseDTO {
  totalRecords: number;
  data: any[];
  page: number;
  size: number;
  [key: string]: any;
}

export interface ExportResponseDTO {
  generatedAt?: string;
  exportType?: string;
  filters?: Record<string, any>;
  totalRecords: number;
  data: any[];
  metadata?: ExportMetadata;
  [key: string]: any;
}

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

// ===== Biometric Response Time Metrics =====
export interface BiometricTimingMetrics {
  // Login timing (milliseconds)
  loginScanTimeMs?: number | null;
  loginVerificationTimeMs?: number | null;
  loginProcessingTimeMs?: number | null;
  loginNotificationTimeMs?: number | null;
  loginTotalResponseTimeMs?: number | null;
  // Logout timing (milliseconds)
  logoutScanTimeMs?: number | null;
  logoutVerificationTimeMs?: number | null;
  logoutProcessingTimeMs?: number | null;
  logoutNotificationTimeMs?: number | null;
  logoutTotalResponseTimeMs?: number | null;
}

// ===== ComprehensiveAttendanceExportDTO =====
export interface ComprehensiveAttendanceExportWorkerDTO extends BiometricTimingMetrics {
  workerName: string;
  employeeId: string;
  teamId: number;
  teamName: string;
  loginTime?: string | null;
  logoutTime?: string | null;
  totalHours?: number;
  status: string; // PRESENT, ABSENT, ACTIVE, NO_LOGOUT, etc.
  overtime?: boolean;
  hotlisted?: boolean;
  isActive?: boolean;
}

export interface ComprehensiveAttendanceExportSummaryDTO {
  totalWorkers: number;
  present: number;
  absent: number;
  overtime: number;
  hotlisted: number;
}

export interface ComprehensiveAttendanceExportDTO {
  date: string;
  generatedAt: string; // ISO date-time
  summary: ComprehensiveAttendanceExportSummaryDTO;
  workers: ComprehensiveAttendanceExportWorkerDTO[];
}

// ===== TeamAttendanceResponseDTO =====
export interface TeamAttendanceResponseWorkerDTO extends BiometricTimingMetrics {
  workerName: string;
  employeeId: string;
  loginTime?: string | null;
  logoutTime?: string | null;
  totalHours?: number;
  status: string;
  overtime?: boolean;
  hotlisted?: boolean;
  isActive?: boolean;
}

export interface TeamAttendanceSummaryDTO {
  totalWorkers: number;
  present: number;
  absent: number;
  overtime: number;
  hotlisted: number;
}

export interface TeamAttendanceResponseDTO {
  date: string;
  generatedAt: string; // ISO date-time
  id: number; // teamId
  teamName: string;
  projectArea?: string;
  classification?: string;
  siteEngineerId?: number;
  siteEngineerName?: string;
  workerCount: number;
  overtimeThresholdHours?: number;
  createdAt?: string; // ISO date-time
  workers: TeamAttendanceResponseWorkerDTO[];
  summary: TeamAttendanceSummaryDTO;
}

export type ExportType =
  | 'ATTENDANCE'
  | 'ATTENDANCE_TRENDS'
  | 'ALERTS'
  | 'WORKERS'
  | 'HOTLIST'
  | 'TEAMS'
  | 'WORKER_ANALYTICS'
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
    const data = await getUnifiedDashboard();
    if (!data.systemStats) throw new Error('System stats not available');
    return data.systemStats;
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
    const data = await getUnifiedDashboard(date);
    if (!data.dashboardOverview) throw new Error('Dashboard overview not available');
    return data.dashboardOverview;
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
    const data = await getUnifiedDashboard();
    if (!data.hotlistOverview) throw new Error('Hotlist overview not available');
    return data.hotlistOverview as unknown as HotlistOverview;
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
 * Download daily attendance report (PDF) - Overall Attendance Overview format
 */
export const downloadDailyAttendancePdf = async (date?: string): Promise<void> => {
  try {
    let url = `${API_BASE_URL}/export/attendance`;
    if (date) {
      url += `?date=${encodeURIComponent(date)}`;
    }

    const response = await authenticatedFetch(url);

    if (!response.ok) {
      const msg = await safeReadErrorMessage(response);
      throw new Error(msg || `Failed to fetch daily attendance data: ${response.statusText}`);
    }

    const data: any = await response.json();
    
    const doc = new jsPDF();
    const reportDate = data.date || date || new Date().toISOString().split('T')[0];
    
    // ===== Header =====
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('Overall Attendance Overview', 14, 20);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Report Date: ${reportDate}`, 14, 28);
    if (data.generatedAt) {
      doc.text(`Generated At: ${new Date(data.generatedAt).toLocaleString()}`, 14, 33);
    }

    let startY = 42;

    // ===== Summary Statistics =====
    if (data.summary) {
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Summary Statistics', 14, startY);
      startY += 7;
      
      autoTable(doc, {
        startY,
        head: [['Total Workers', 'Present', 'Absent', 'Overtime', 'Hotlisted']],
        body: [[
          data.summary.totalWorkers || 0,
          data.summary.present || 0,
          data.summary.absent || 0,
          data.summary.overtime || 0,
          data.summary.hotlisted || 0
        ]],
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
        bodyStyles: { fontStyle: 'normal', textColor: 0 },
        alternateRowStyles: { fillColor: [242, 242, 242] },
        margin: { bottom: 12 }
      });
      
      startY = (doc as any).lastAutoTable.finalY + 10;
    }

    // ===== Attendance by Team and Worker Details =====
    if (data.teams && data.teams.length > 0) {
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Attendance by Team', 14, startY);
      startY += 7;

      // Team summary table
      const teamSummaryBody = data.teams.map((team: any) => {
        const workers = team.workers || [];
        const presentCount = workers.filter((w: any) => w.status === 'PRESENT' || w.isActive).length;
        const absentCount = workers.filter((w: any) => w.status === 'ABSENT').length;
        const overtimeCount = workers.filter((w: any) => w.overtime).length;
        
        return [
          team.teamName || 'Unassigned',
          workers.length,
          presentCount,
          absentCount,
          overtimeCount
        ];
      });

      autoTable(doc, {
        startY,
        head: [['Team', 'Total', 'Present', 'Absent', 'Overtime']],
        body: teamSummaryBody,
        headStyles: { fillColor: [71, 85, 105], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { bottom: 12 }
      });

      startY = (doc as any).lastAutoTable.finalY + 10;

      // ===== Detailed Workers per Team =====
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Worker Details by Team', 14, startY);
      startY += 7;

      let isFirstTeam = true;
      data.teams.forEach((team: any) => {
        const workers = team.workers || [];
        
        // Add new page if needed
        if (startY > 240) {
          doc.addPage();
          startY = 20;
        }

        if (!isFirstTeam) startY += 3;
        isFirstTeam = false;

        // Team header
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(71, 85, 105);
        doc.text(`${team.teamName || 'Unassigned'} (${workers.length} workers)`, 14, startY);
        doc.setTextColor(0, 0, 0);
        startY += 6;

        if (workers.length > 0) {
          // Workers table for this team
          const workerTableBody = workers.map((w: any) => [
            w.workerName || '-',
            w.employeeId || '-',
            w.loginTime ? w.loginTime.slice(0, 5) : '-',
            w.logoutTime ? w.logoutTime.slice(0, 5) : '-',
            w.totalHours ? w.totalHours.toFixed(1) : '-',
            w.status || '-',
            w.overtime ? 'Yes' : 'No',
            w.hotlisted ? 'Yes' : 'No'
          ]);

          autoTable(doc, {
            startY,
            head: [['Name', 'ID', 'Login', 'Logout', 'Hours', 'Status', 'OT', 'Hotlist']],
            body: workerTableBody,
            headStyles: { fillColor: [120, 130, 140], textColor: 255, fontSize: 9, fontStyle: 'bold' },
            bodyStyles: { fontSize: 8 },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            columnStyles: {
              4: { halign: 'right' },
              6: { halign: 'center' },
              7: { halign: 'center' }
            },
            margin: { bottom: 3 }
          });

          startY = (doc as any).lastAutoTable.finalY + 3;
        } else {
          doc.setFontSize(9);
          doc.text('No workers in this team', 14, startY);
          startY += 5;
        }
      });

    } else {
      doc.setFontSize(11);
      doc.text('No attendance records found for this date.', 14, startY);
    }

    doc.save(`attendance-overview-${reportDate}.pdf`);
  } catch (error) {
    console.error('Error downloading daily attendance PDF:', error);
    throw error;
  }
};

/**
 * Get alerts overview
 */
export const getAlertsOverview = async (): Promise<AlertsOverview> => {
  try {
    const data = await getUnifiedDashboard();
    if (!data.alertsOverview) throw new Error('Alerts overview not available');
    return data.alertsOverview;
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
    const data = await getUnifiedDashboard(undefined, startDate, endDate);
    if (!data.staffEfficiency) throw new Error('Staff efficiency not available');
    return data.staffEfficiency as any;
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

// ==================== FILTER ENDPOINTS ====================

export const filterAttendance = async (opts: {
  filter?: string;
  role?: string;
  teamId?: number;
  attendanceStatus?: string;
  overtimeOnly?: boolean;
  hotlistOnly?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}): Promise<FilterResponseDTO> => {
  const qs = buildQuery(opts);
  const response = await authenticatedFetch(`${API_BASE_URL}/analytics/filter/attendance${qs}`);
  if (!response.ok) {
    const msg = await safeReadErrorMessage(response);
    throw new Error(msg || `Failed to filter attendance: ${response.statusText}`);
  }
  return response.json();
};

export const filterAlerts = async (opts: {
  filter?: string;
  alertType?: string;
  activeOnly?: boolean;
  acknowledged?: boolean;
  personCode?: string;
  teamId?: number;
  role?: string;
  startDate?: string;
  endDate?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  size?: number;
}): Promise<FilterResponseDTO> => {
  const qs = buildQuery(opts);
  const response = await authenticatedFetch(`${API_BASE_URL}/analytics/filter/alerts${qs}`);
  if (!response.ok) {
    const msg = await safeReadErrorMessage(response);
    throw new Error(msg || `Failed to filter alerts: ${response.statusText}`);
  }
  return response.json();
};

export const filterWorkers = async (opts: {
  filter?: string;
  hotlistedOnly?: boolean;
  activeOnly?: boolean;
  role?: string;
  teamId?: number;
  overtimeOnly?: boolean;
  admittedToday?: boolean;
  attendanceRateThreshold?: number;
  search?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  size?: number;
}): Promise<FilterResponseDTO> => {
  const qs = buildQuery(opts);
  const response = await authenticatedFetch(`${API_BASE_URL}/analytics/filter/workers${qs}`);
  if (!response.ok) {
    const msg = await safeReadErrorMessage(response);
    throw new Error(msg || `Failed to filter workers: ${response.statusText}`);
  }
  return response.json();
};

export const filterTeams = async (opts: {
  filter?: string;
  highOvertime?: boolean;
  lowAttendance?: boolean;
  hotlistCount?: number;
  activeTeamsOnly?: boolean;
  assignedEngineer?: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  size?: number;
}): Promise<FilterResponseDTO> => {
  const qs = buildQuery(opts);
  const response = await authenticatedFetch(`${API_BASE_URL}/analytics/filter/teams${qs}`);
  if (!response.ok) {
    const msg = await safeReadErrorMessage(response);
    throw new Error(msg || `Failed to filter teams: ${response.statusText}`);
  }
  return response.json();
};

export const filterWorkerAnalytics = async (personCode: string, opts: {
  filter?: string;
  attendanceType?: string;
  overtimeOnly?: boolean;
  alertOnly?: boolean;
  startDate?: string;
  endDate?: string;
  exportMode?: boolean;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  size?: number;
}): Promise<FilterResponseDTO> => {
  const qs = buildQuery(opts);
  const response = await authenticatedFetch(`${API_BASE_URL}/analytics/filter/worker/${encodeURIComponent(personCode)}${qs}`);
  if (!response.ok) {
    const msg = await safeReadErrorMessage(response);
    throw new Error(msg || `Failed to filter worker analytics: ${response.statusText}`);
  }
  return response.json();
};

// ==================== EXPORT ENDPOINTS ====================

export const exportData = async (opts: {
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
}): Promise<ExportResponseDTO> => {
  const qs = buildQuery(opts);
  const response = await authenticatedFetch(`${API_BASE_URL}/analytics/export${qs}`);
  if (!response.ok) {
    const msg = await safeReadErrorMessage(response);
    throw new Error(msg || `Failed to export data: ${response.statusText}`);
  }
  return response.json();
};

export const exportWorkerData = async (opts: {
  personCode: string;
  filter?: string;
  startDate?: string;
  endDate?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}): Promise<ExportResponseDTO> => {
  const { personCode, ...rest } = opts;
  const qs = buildQuery(rest);

  const response = await authenticatedFetch(
    `${API_BASE_URL}/analytics/export/worker/${encodeURIComponent(personCode)}${qs}`
  );

  if (!response.ok) {
    const msg = await safeReadErrorMessage(response);
    throw new Error(msg || `Failed to export worker data: ${response.statusText}`);
  }

  return response.json();
};

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
  const { filename, ...rest } = opts;
  const data = await exportData(rest);
  const csv = jsonToCsv(data.data || [], data.metadata);
  // Prepend BOM (\uFEFF) for Excel UTF-8 compatibility
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const finalFilename = (data.metadata?.filename || filename).replace(/\.xlsx$/, '.csv');
  downloadBlob(blob, finalFilename);
};

export const exportWorkerExcel = async (opts: {
  personCode: string;
  filter?: string;
  startDate?: string;
  endDate?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  filename: string;
}) => {
  const { filename, ...rest } = opts;
  const data = await exportWorkerData(rest);
  const csv = jsonToCsv(data.data || [], data.metadata);
  // Prepend BOM (\uFEFF) for Excel UTF-8 compatibility
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const finalFilename = (data.metadata?.filename || filename).replace(/\.xlsx$/, '.csv');
  downloadBlob(blob, finalFilename);
};
