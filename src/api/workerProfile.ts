import { authenticatedFetch } from './fetch';

const API_BASE_URL = 'http://localhost:8080/api';

export interface WorkerFullUpdateDTO {
  name?: string;
  phoneNumber?: string;
  address?: string;
  birthdate?: string;
  age?: number;
  yearOfEmployment?: number;
  position?: string;
}

export const updateFullWorkerProfile = async (
  personId: number,
  dto: WorkerFullUpdateDTO,
): Promise<any> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/worker-profiles/person/${personId}/full`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!response.ok) {
    throw new Error('Failed to update worker profile');
  }
  return response.json();
};