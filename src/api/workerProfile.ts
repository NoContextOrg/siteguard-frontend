import { authenticatedFetch } from './fetch';
import type { PersonResponse } from './person';

const API_BASE_URL = 'http://localhost:8080/api';

export interface WorkerProfileUpdateDTO {
  contactNumber?: string;
  address?: string;
  age?: number;
  birthdate?: string;
  position?: string;
  yearOfEmployment?: number;
}

export const updateWorkerProfile = async (
  personId: number,
  dto: WorkerProfileUpdateDTO,
): Promise<any> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/worker-profiles/person/${personId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!response.ok) {
    throw new Error('Failed to update worker profile');
  }
  return response.json();
};