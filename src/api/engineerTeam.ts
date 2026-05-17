import { getAuthHeader } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://siteguardph.duckdns.org/api';

export interface EngineerTeamOverview {
  unassignedWorkers: any[];
  hotlistWorkersCount: number;
  hotlistWorkers: any[];
  normalWorkersCount: number;
  normalWorkers: any[];
  overtimeOverview: any;
  attendance: any;
}

export const getEngineerTeamDashboard = async (signal?: AbortSignal): Promise<EngineerTeamOverview> => {
  const response = await fetch(`${API_BASE_URL}/engineer/team/dashboard`, {
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch engineer team dashboard');
  }
  return response.json();
};

export const startEngineerTeamExport = async (date?: string): Promise<{ jobId: number, status: string }> => {
  const url = date 
    ? `${API_BASE_URL}/engineer/team/attendance/export?date=${date}`
    : `${API_BASE_URL}/engineer/team/attendance/export`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });
  if (!response.ok) {
    throw new Error('Failed to start engineer team export');
  }
  return response.json();
};
