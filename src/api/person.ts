/**
 * Person API service
 * Handles all person-related CRUD operations
 */

import { authenticatedFetch, safeReadErrorMessage } from './fetch';

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
  personCode?: string;
  firstName?: string;
  lastName?: string;
  /** UI-friendly full name */
  name?: string;
  role?: string;
  status?: string;
  email?: string;
  phoneNumber?: string;
  teamId?: number | null;
  // legacy UI fields (may be absent)
  position?: string;
  department?: string;
  createdAt?: string;
  updatedAt?: string;

  // fingerprint indicators (backend may not expose these directly; kept for UI compatibility)
  fingerprint?: boolean | string;
  fingerprintTemplate?: string;
  fingerprints?: unknown[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * Convert backend PersonResponseDTO to UI-friendly PersonResponse
 */
const toPersonResponse = (dto: any): PersonResponse => {
  const firstName = dto?.firstName ?? '';
  const lastName = dto?.lastName ?? '';
  const fullName = String(`${firstName} ${lastName}`).trim();

  return {
    id: dto.id,
    personCode: dto.personCode,
    firstName: dto.firstName,
    lastName: dto.lastName,
    name: dto.name ?? fullName,
    role: dto.role,
    status: dto.status,
    email: dto.email,
    phoneNumber: dto.phoneNumber ?? dto.phone,
    teamId: dto.teamId ?? null,
    position: dto.position,
    department: dto.department,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    fingerprint: dto.fingerprint,
    fingerprintTemplate: dto.fingerprintTemplate,
    fingerprints: dto.fingerprints,
  };
};

/**
 * Get all persons
 */
export const getAllPersons = async (): Promise<PersonResponse[]> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/persons`);

    if (!response.ok) {
      throw new Error(`Failed to fetch persons: ${response.statusText}`);
    }

    const json = await response.json();
    const list = (json?.data ?? json) as any[];
    return Array.isArray(list) ? list.map(toPersonResponse) : [];
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

    const json: ApiResponse<PersonResponse> | PersonResponse = await response.json();
    // Handle both wrapped and unwrapped responses
    const personData = 'data' in json ? json.data : json;

    if (!personData || !('id' in personData)) {
      throw new Error('Person not found');
    }
    return toPersonResponse(personData);
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
      throw new Error(`Failed to fetch persons by team: ${response.statusText}`);
    }

    const json = await response.json();
    const list = (json?.data ?? json) as any[];
    return Array.isArray(list) ? list.map(toPersonResponse) : [];
  } catch (error) {
    console.error(`Error fetching persons for team ${teamId}:`, error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * Convenience: Get all fingerprint-enrolled persons
 */
export const getFingerprintEnrolledPersons = async (): Promise<PersonResponse[]> => {
  const persons = await getAllPersons();
  // Back-compat: some older codepaths may filter by fingerprint presence.
  // The current backend returns fingerprint templates via other endpoints, so keep this permissive.
  return persons.filter((p) => {
    const anyP = p as any;
    return Boolean(anyP.fingerprint ?? anyP.fingerprintTemplate ?? anyP.fingerprints);
  });
};

export type CreatePersonUiPayload = {
  name: string;
  email: string;
  phone?: string;
  position?: string;
  department?: string;
  role: 'WORKER' | 'ENGINEER' | 'NURSE' | 'ADMIN' | 'STAFF';
  fingerprint?: number | string;
};

export const createPersonUi = async (payload: CreatePersonUiPayload): Promise<PersonResponse> => {
  const body: Record<string, string> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined && value !== null) {
      body[key] = String(value);
    }
  }

  const response = await authenticatedFetch(`${API_BASE_URL}/persons/ui`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const msg = await safeReadErrorMessage(response);
    if (response.status === 401) throw new Error('Unauthorized (401). Please login again.');
    if (response.status === 403) throw new Error('Forbidden (403). Requires admin/engineer role.');
    throw new Error(msg || `Failed to create person (${response.status})`);
  }

  return toPersonResponse(await response.json());
};

export const updatePersonUi = async (id: number, payload: Partial<CreatePersonUiPayload>): Promise<PersonResponse> => {
  const body: Record<string, string> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined && value !== null) {
      body[key] = String(value);
    }
  }

  const response = await authenticatedFetch(`${API_BASE_URL}/persons/ui/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const msg = await safeReadErrorMessage(response);
    if (response.status === 401) throw new Error('Unauthorized (401). Please login again.');
    if (response.status === 403) throw new Error('Forbidden (403). Requires admin/engineer role.');
    throw new Error(msg || `Failed to update person (${response.status})`);
  }

  return toPersonResponse(await response.json());
};

export const deletePersonById = async (id: number): Promise<void> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/persons/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const msg = await safeReadErrorMessage(response);
    if (response.status === 401) throw new Error('Unauthorized (401). Please login again.');
    if (response.status === 403) throw new Error('Forbidden (403). Requires admin role.');
    throw new Error(msg || `Failed to delete person (${response.status})`);
  }
};

/**
 * Set or reset a person's password (admin only)
 * PUT /api/persons/{id}/password
 */
export const setPersonPassword = async (id: number, newPassword: string): Promise<void> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/persons/${id}/password`, {
    method: 'PUT',
    body: JSON.stringify({ password: newPassword }),
  });

  if (!response.ok) {
    const msg = await safeReadErrorMessage(response);
    if (response.status === 401) throw new Error('Unauthorized (401). Please login again.');
    if (response.status === 403) throw new Error('Forbidden (403). Requires admin role.');
    throw new Error(msg || `Failed to set/reset password (${response.status})`);
  }
};
