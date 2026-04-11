import { apiClient } from './client';
import type { CustomTripRequest } from '../types';

interface PaginatedResponse<T> {
  data: T[];
  meta: { currentPage: number; totalPages: number; totalCount: number };
}

export const tripRequestsApi = {
  create: (data: {
    plannerId: string;
    destination: string;
    startDate: string;
    endDate: string;
    seats: number;
    category?: string;
    budget?: number;
    note?: string;
  }) =>
    apiClient.post<CustomTripRequest>('/trip_requests', {
      planner_id: data.plannerId,
      destination: data.destination,
      start_date: data.startDate,
      end_date: data.endDate,
      seats: data.seats,
      category: data.category,
      budget: data.budget,
      note: data.note,
    }),

  getMyRequests: (page = 1, status?: string) =>
    apiClient.get<PaginatedResponse<CustomTripRequest>>('/trip_requests', {
      params: { page, status },
    }),

  cancel: (id: string) =>
    apiClient.patch<CustomTripRequest>(`/trip_requests/${id}/cancel`),

  // Planner endpoints
  getIncoming: (page = 1, status?: string) =>
    apiClient.get<PaginatedResponse<CustomTripRequest>>('/planner/trip_requests', {
      params: { page, status },
    }),

  accept: (id: string) =>
    apiClient.patch<CustomTripRequest>(`/planner/trip_requests/${id}/accept`),

  reject: (id: string) =>
    apiClient.patch<CustomTripRequest>(`/planner/trip_requests/${id}/reject`),
};
