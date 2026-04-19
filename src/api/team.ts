/**
 * Team API service
 * Handles all team-related CRUD operations
 */

import { authenticatedFetch } from './fetch';

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
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/teams`, {
      method: 'POST',
      body: JSON.stringify(teamData),
    });

    if (!response.ok) {
      const errorData: ApiResponse<null> = await response.json();
      throw new Error(errorData.message || `Failed to create team: ${response.statusText}`);
    }

    const data: ApiResponse<TeamResponse> = await response.json();
    if (!data.data) {
      throw new Error('Failed to create team');
    }
    return data.data;
  } catch (error) {
    console.error('Error creating team:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
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
      const errorData: ApiResponse<null> = await response.json();
      throw new Error(errorData.message || `Failed to update team: ${response.statusText}`);
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
 */
export const getTeamMembers = async (teamId: number): Promise<TeamMember[]> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/teams/${teamId}/members`);

    if (!response.ok) {
      throw new Error(`Failed to fetch team members: ${response.statusText}`);
    }

    const data: ApiResponse<TeamMember[]> = await response.json();
    return data.data || [];
  } catch (error) {
    console.error(`Error fetching team members for team ${teamId}:`, error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * Add person to team
 */
export const addPersonToTeam = async (teamId: number, personId: number): Promise<TeamResponse> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/teams/${teamId}/members/${personId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const errorData: ApiResponse<null> = await response.json();
      throw new Error(
        errorData.message || `Failed to add person to team: ${response.statusText}`
      );
    }

    const data: ApiResponse<TeamResponse> = await response.json();
    if (!data.data) {
      throw new Error('Failed to add person to team');
    }
    return data.data;
  } catch (error) {
    console.error(`Error adding person to team:`, error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * Remove person from team
 */
export const removePersonFromTeam = async (teamId: number, personId: number): Promise<void> => {
  try {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/teams/${teamId}/members/${personId}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to remove person from team: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Error removing person from team:`, error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * Search teams by name
 */
export const searchTeams = async (query: string): Promise<TeamResponse[]> => {
  try {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/teams/search?query=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error(`Failed to search teams: ${response.statusText}`);
    }

    const data: ApiResponse<TeamResponse[]> = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error searching teams:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};
