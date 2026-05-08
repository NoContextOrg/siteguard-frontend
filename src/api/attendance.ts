/**
 * Attendance API service
 * Handles all attendance-related API calls
 */

const API_BASE_URL = 'http://siteguardph.duckdns.org/api';

export interface AttendanceLog {
  id?: number;
  personCode: string;
  personName?: string;
  eventType: string;
  eventTimestamp: string;
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

const buildQuery = (params: Record<string, string | undefined>) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) q.set(k, v);
  });
  const s = q.toString();
  return s ? `?${s}` : '';
};

/** GET /api/attendance */
export const getAllAttendance = async (): Promise<AttendanceLog[]> => {
  const res = await fetch(`${API_BASE_URL}/attendance`);
  if (!res.ok) throw new Error('Failed to load attendance logs');
  return res.json();
};

/** GET /api/attendance/summary/today */
export const getTodaysSummary = async (): Promise<AttendanceSummary> => {
  const res = await fetch(`${API_BASE_URL}/attendance/summary/today`);
  if (!res.ok) throw new Error('Failed to load today\'s summary');
  return res.json();
};

/** GET /api/attendance/stats?from=YYYY-MM-DD&to=YYYY-MM-DD */
export const getAttendanceStats = async (from?: string, to?: string): Promise<AttendanceStats> => {
  const qs = buildQuery({ from, to });
  const res = await fetch(`${API_BASE_URL}/attendance/stats${qs}`);
  if (!res.ok) throw new Error('Failed to load attendance stats');
  return res.json();
};

/** GET /api/attendance/person/{personCode} */
export const getAttendanceForPerson = async (personCode: string): Promise<AttendanceLog[]> => {
  const res = await fetch(`${API_BASE_URL}/attendance/person/${encodeURIComponent(personCode)}`);
  if (!res.ok) throw new Error('Failed to load person attendance');
  return res.json();
};

/** GET /api/attendance/person/{personCode}/range?from=YYYY-MM-DD&to=YYYY-MM-DD */
export const getAttendanceForPersonInRange = async (personCode: string, from?: string, to?: string): Promise<AttendanceLog[]> => {
  const qs = buildQuery({ from, to });
  const res = await fetch(`${API_BASE_URL}/attendance/person/${encodeURIComponent(personCode)}/range${qs}`);
  if (!res.ok) throw new Error('Failed to load person attendance (range)');
  return res.json();
};

/** GET /api/attendance/person/{personCode}/calendar */
export const getAttendanceCalendar = async (personCode: string): Promise<Record<string, string[]>> => {
  const res = await fetch(`${API_BASE_URL}/attendance/person/${encodeURIComponent(personCode)}/calendar`);
  if (!res.ok) throw new Error('Failed to load attendance calendar');
  return res.json();
};

/** GET /api/attendance/person/{personCode}/summary */
export const getWorkerAttendanceSummary = async (personCode: string): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/attendance/person/${encodeURIComponent(personCode)}/summary`);
  if (!res.ok) throw new Error('Failed to load worker attendance summary');
  return res.json();
};

/** GET /api/attendance/person/{personCode}/heatmap?year=YYYY */
export const getAttendanceHeatmap = async (personCode: string, year = 2026): Promise<any[]> => {
  const res = await fetch(`${API_BASE_URL}/attendance/person/${encodeURIComponent(personCode)}/heatmap?year=${year}`);
  if (!res.ok) throw new Error('Failed to load attendance heatmap');
  return res.json();
};

/**
 * Backwards-compatible export.
 * Some pages import getBiometricLastId from this module.
 * If the backend does not support it anymore, we return null instead of crashing.
 */
export const getBiometricLastId = async (): Promise<number | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/biometric/last-id`);
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data === 'number') return data;
    if (typeof data?.lastId === 'number') return data.lastId;
    if (typeof data?.id === 'number') return data.id;
    return null;
  } catch {
    return null;
  }
};
