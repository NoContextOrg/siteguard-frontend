/**
 * Export API Service
 * Handles asynchronous export job initiation, status polling, and file downloading.
 */

import { API_ENDPOINTS } from './config';
import { authenticatedFetch } from './fetch';

export type ExportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface ExportJob {
  id: number;
  exportType: string;
  format: string;
  status: ExportStatus;
  progressPercentage: number;
  errorMessage?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  expiresAt?: string;
  requestedBy: string;
}

export interface StartExportResponse {
  jobId: number;
  status: ExportStatus;
}

/**
 * Initiates an attendance export job
 */
export const startAttendanceExport = async (date?: string, format: string = 'CSV'): Promise<StartExportResponse> => {
  const params = new URLSearchParams();
  if (date) params.append('date', date);
  params.append('format', format);

  const res = await authenticatedFetch(`${API_ENDPOINTS.exports.start}?${params.toString()}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to start attendance export');
  return res.json();
};

/**
 * Initiates a team attendance export job
 */
export const startTeamAttendanceExport = async (teamId: number, date?: string, format: string = 'CSV'): Promise<StartExportResponse> => {
  const params = new URLSearchParams();
  params.append('teamId', teamId.toString());
  if (date) params.append('date', date);
  params.append('format', format);

  const res = await authenticatedFetch(`${API_ENDPOINTS.exports.teamStart}?${params.toString()}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to start team attendance export');
  return res.json();
};

/**
 * Initiates a global analytics export job
 */
export const startAnalyticsExport = async (params: Record<string, any>): Promise<StartExportResponse> => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString());
    }
  });

  const res = await authenticatedFetch(`${API_ENDPOINTS.exports.analyticsStart}?${queryParams.toString()}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to start analytics export');
  return res.json();
};

/**
 * Initiates an engineer analytics export job
 */
export const startEngineerAnalyticsExport = async (params: Record<string, any>): Promise<StartExportResponse> => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString());
    }
  });

  const res = await authenticatedFetch(`${API_ENDPOINTS.engineerExports.analyticsStart}?${queryParams.toString()}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to start engineer analytics export');
  return res.json();
};

/**
 * Initiates an engineer attendance export job
 */
export const startEngineerAttendanceExport = async (date?: string, format: string = 'CSV'): Promise<StartExportResponse> => {
  const params = new URLSearchParams();
  if (date) params.append('date', date);
  params.append('format', format);

  const res = await authenticatedFetch(`${API_ENDPOINTS.engineerExports.start}?${params.toString()}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to start engineer attendance export');
  return res.json();
};

/**
 * Initiates a worker-specific analytics export job
 */
export const startWorkerAnalyticsExport = async (personCode: string, params: Record<string, any> = {}): Promise<StartExportResponse> => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString());
    }
  });

  const res = await authenticatedFetch(`${API_ENDPOINTS.exports.workerAnalyticsStart(personCode)}?${queryParams.toString()}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to start worker analytics export');
  return res.json();
};

/**
 * Polls for the status of an export job
 */
export const getExportJobStatus = async (jobId: number): Promise<ExportJob> => {
  const res = await authenticatedFetch(API_ENDPOINTS.exports.status(jobId));
  if (!res.ok) throw new Error('Failed to fetch export job status');
  return res.json();
};

/**
 * Downloads the completed export file
 */
export const downloadExportFile = async (jobId: number, filename?: string): Promise<void> => {
  const res = await authenticatedFetch(API_ENDPOINTS.exports.download(jobId));
  if (!res.ok) {
    if (res.status === 404) throw new Error('Export file not found or not ready');
    if (res.status === 410) throw new Error('Export file has expired');
    throw new Error('Failed to download export file');
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  // Try to get filename from content-disposition header
  const contentDisposition = res.headers.get('content-disposition');
  let finalFilename = filename || `export_${jobId}`;
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
    if (filenameMatch && filenameMatch.length > 1) {
      finalFilename = filenameMatch[1];
    }
  }

  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Fetches the recent export history for the current user
 */
export const getExportHistory = async (): Promise<ExportJob[]> => {
  const res = await authenticatedFetch(API_ENDPOINTS.exports.history);
  if (!res.ok) throw new Error('Failed to fetch export history');
  return res.json();
};
