import { apiClient } from './client';
import type { Agency, Trip } from '../types';

interface PaginatedResponse<T> {
  data: T[];
  meta: { currentPage: number; totalPages: number; totalCount: number };
}

export const plannersApi = {
  getAll: (params?: { page?: number; q?: string }) =>
    apiClient.get<PaginatedResponse<Agency>>('/agencies', { params }),

  getById: (id: string) =>
    apiClient.get<Agency>(`/agencies/${id}`),

  getTrips: (id: string, page = 1) =>
    apiClient.get<PaginatedResponse<Trip>>(`/agencies/${id}/trips`, { params: { page } }),
};
