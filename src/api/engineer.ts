import { getAuthHeader } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://siteguardph.duckdns.org/api';

export const getEngineerDashboardSummary = async (signal?: AbortSignal) => {
    const response = await fetch(`${API_BASE_URL}/engineer/dashboard/summary`, {
        signal,
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
        },
    });
    if (!response.ok) {
        throw new Error('Failed to fetch engineer dashboard');
    }
    return response.json();
};

export const startEngineerAttendanceExport = async (date?: string) => {
    let url = `${API_BASE_URL}/engineer/dashboard/export/attendance?`;
    if (date) url += `date=${date}`;
    
    const response = await fetch(url, { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
        }
    });
    if (!response.ok) {
        throw new Error('Failed to start export');
    }
    return response.json();
};
