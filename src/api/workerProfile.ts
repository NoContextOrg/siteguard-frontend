import { authenticatedFetch } from './fetch';
import type { PersonResponse } from './person';

export interface WorkerProfileUpdateDTO {
  name?: string;
  address?: string;
  phoneNumber?: string;
  age?: number;
  birthDate?: string;
  position?: string;
  employmentYear?: number;
}

export const updateWorkerProfile = async (
  personId: number,
  dto: WorkerProfileUpdateDTO,
): Promise<PersonResponse> => {
  const response = await authenticatedFetch(`/api/worker-profiles/person/${personId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!response.ok) {
    throw new Error('Failed to update worker profile');
  }
  return response.json();
};