/**
 * Person API service
 * Handles all person-related CRUD operations
 */

import { authenticatedFetch } from './fetch';

const API_BASE_URL = 'http://siteguardph.duckdns.org/api';

export interface Person {
  id?: number;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  joinDate?: string;
  fingerprint?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PersonResponse {
  id: number;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  joinDate: string;
  fingerprint: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * Get all persons
 */
export const getAllPersons = async (): Promise<PersonResponse[]> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/persons`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch persons: ${response.statusText}`);
    }

    const data: ApiResponse<PersonResponse[]> = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching persons:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * Get person by ID
 */
export const getPersonById = async (id: number): Promise<PersonResponse> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/persons/${id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch person: ${response.statusText}`);
    }

    const data: ApiResponse<PersonResponse> = await response.json();
    if (!data.data) {
      throw new Error('Person not found');
    }
    return data.data;
  } catch (error) {
    console.error(`Error fetching person ${id}:`, error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * Create a new person
 */
export const createPerson = async (personData: Person): Promise<PersonResponse> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/persons`, {
      method: 'POST',
      body: JSON.stringify(personData),
    });

    if (!response.ok) {
      const errorData: ApiResponse<null> = await response.json();
      throw new Error(errorData.message || `Failed to create person: ${response.statusText}`);
    }

    const data: ApiResponse<PersonResponse> = await response.json();
    if (!data.data) {
      throw new Error('Failed to create person');
    }
    return data.data;
  } catch (error) {
    console.error('Error creating person:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * Update person
 */
export const updatePerson = async (id: number, personData: Partial<Person>): Promise<PersonResponse> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/persons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(personData),
    });

    if (!response.ok) {
      const errorData: ApiResponse<null> = await response.json();
      throw new Error(errorData.message || `Failed to update person: ${response.statusText}`);
    }

    const data: ApiResponse<PersonResponse> = await response.json();
    if (!data.data) {
      throw new Error('Failed to update person');
    }
    return data.data;
  } catch (error) {
    console.error(`Error updating person ${id}:`, error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * Delete person
 */
export const deletePerson = async (id: number): Promise<void> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/persons/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete person: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Error deleting person ${id}:`, error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * Register fingerprint for a person
 */
export const registerFingerprint = async (
  personId: number,
  fingerprintData: string
): Promise<PersonResponse> => {
  try {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/persons/${personId}/fingerprint`,
      {
        method: 'POST',
        body: JSON.stringify({ fingerprint: fingerprintData }),
      }
    );

    if (!response.ok) {
      const errorData: ApiResponse<null> = await response.json();
      throw new Error(
        errorData.message || `Failed to register fingerprint: ${response.statusText}`
      );
    }

    const data: ApiResponse<PersonResponse> = await response.json();
    if (!data.data) {
      throw new Error('Failed to register fingerprint');
    }
    return data.data;
  } catch (error) {
    console.error('Error registering fingerprint:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * Search persons by name
 */
export const searchPersons = async (query: string): Promise<PersonResponse[]> => {
  try {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/persons/search?query=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error(`Failed to search persons: ${response.statusText}`);
    }

    const data: ApiResponse<PersonResponse[]> = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error searching persons:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * Get persons in a team.
 * GET /api/persons/team/{teamId}
 */
export const getPersonsByTeam = async (teamId: number): Promise<PersonResponse[]> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/persons/team/${teamId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch team persons: ${response.statusText}`);
    }

    const data: ApiResponse<PersonResponse[]> = await response.json();
    return data.data || [];
  } catch (error) {
    console.error(`Error fetching persons for team ${teamId}:`, error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};
