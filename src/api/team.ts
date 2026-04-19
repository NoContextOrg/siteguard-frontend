/**
 * Team API service
 * Handles all team-related CRUD operations
 */

import { authenticatedFetch, safeReadErrorMessage } from './fetch';

const API_BASE_URL = 'http://siteguardph.duckdns.org/api';

export interface Team {
  id?: number;
  name: string;
  description: string;
  location: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamResponse {
  id: number;
  name: string;
  description: string;
  location: string;
  createdAt: string;
  updatedAt: string;
  members?: number;
}

export interface TeamMember {
  id: number;
  name: string;
  email: string;
  position: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * Get all teams
 */
export const getAllTeams = async (): Promise<TeamResponse[]> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/teams`);

    if (!response.ok) {
      throw new Error(`Failed to fetch teams: ${response.statusText}`);
    }

    const data: ApiResponse<TeamResponse[]> = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching teams:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * Get team by ID
 */
export const getTeamById = async (id: number): Promise<TeamResponse> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/teams/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch team: ${response.statusText}`);
    }

    const data: ApiResponse<TeamResponse> = await response.json();
    if (!data.data) {
      throw new Error('Team not found');
    }
    return data.data;
  } catch (error) {
    console.error(`Error fetching team ${id}:`, error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * Create a new team
 */
export const createTeam = async (teamData: Team): Promise<TeamResponse> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/teams`, {
    method: 'POST',
    body: JSON.stringify(teamData),
  });

  if (!response.ok) {
    const msg = await safeReadErrorMessage(response);
    if (response.status === 401) {
      throw new Error(`Unauthorized (401). Please login again.`);
    }
    if (response.status === 403) {
      throw new Error(`Forbidden (403). Requires admin role.`);
    }
    throw new Error(msg || `Failed to create team (${response.status})`);
  }

  return (await response.json()) as TeamResponse;
};

/**
 * Update team
 */
export const updateTeam = async (id: number, teamData: Partial<Team>): Promise<TeamResponse> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(teamData),
    });

    if (!response.ok) {
      const raw = await response.text().catch(() => '');
      const msg = raw || response.statusText;
      if (response.status === 401) throw new Error('Unauthorized (401). Please login again.');
      if (response.status === 403) throw new Error('Forbidden (403). Your account lacks ADMIN permission to update teams.');
      throw new Error(msg || `Failed to update team: ${response.statusText}`);
    }

    const data: ApiResponse<TeamResponse> = await response.json();
    if (!data.data) {
      throw new Error('Failed to update team');
    }
    return data.data;
  } catch (error) {
    console.error(`Error updating team ${id}:`, error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * Delete team
 */
export const deleteTeam = async (id: number): Promise<void> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/teams/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete team: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Error deleting team ${id}:`, error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * Get team members
 *
 * NOTE: Backend TeamController does NOT expose this route.
 * Use GET /api/persons/team/{teamId} via `getPersonsByTeam()` in `api/person.ts`.
 */
export const getTeamMembers = async (_teamId: number): Promise<TeamMember[]> => {
  throw new Error('Not supported by backend. Use getPersonsByTeam(teamId) instead.');
};

/**
 * Assign workers to a team
 * POST /api/teams/{id}/assign-workers
 */
export const assignWorkersToTeam = async (teamId: number, workerIds: number[]): Promise<TeamResponse> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/teams/${teamId}/assign-workers`, {
      method: 'POST',
      body: JSON.stringify(workerIds),
    });

    if (!response.ok) {
      const errorData: ApiResponse<null> = await response.json().catch(() => ({ success: false, message: '' } as ApiResponse<null>));
      throw new Error(errorData.message || `Failed to assign workers: ${response.statusText}`);
    }

    const data: ApiResponse<TeamResponse> = await response.json();
    if (!data.data) {
      throw new Error('Failed to assign workers');
    }

    return data.data;
  } catch (error) {
    console.error('Error assigning workers to team:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * Remove worker from team
 * DELETE /api/teams/{teamId}/workers/{workerId}
 */
export const removeWorkerFromTeam = async (teamId: number, workerId: number): Promise<void> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/teams/${teamId}/workers/${workerId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to remove worker from team: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error removing worker from team:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

// Back-compat aliases for older UI code
export const addPersonToTeam = async (teamId: number, personId: number): Promise<TeamResponse> =>
  assignWorkersToTeam(teamId, [personId]);

export const removePersonFromTeam = async (teamId: number, personId: number): Promise<void> =>
  removeWorkerFromTeam(teamId, personId);

/**
 * Search teams by name
 *
 * NOTE: Backend TeamController does NOT expose /api/teams/search.
 */
export const searchTeams = async (_query: string): Promise<TeamResponse[]> => {
  throw new Error('Not supported by backend. Use getAllTeams() and filter client-side.');
};
