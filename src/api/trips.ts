import { apiClient } from './client';
import type { Trip } from '../types';

interface PaginatedResponse<T> {
  data: T[];
  meta: { currentPage: number; totalPages: number; totalCount: number };
}

export const tripsApi = {
  getAll: (params?: { page?: number; q?: string; tag?: string; min_price?: number; max_price?: number; sort?: string; start_date_from?: string; start_date_to?: string; host_id?: string }) =>
    apiClient.get<PaginatedResponse<Trip>>('/trips', { params }),

  getFeatured: () =>
    apiClient.get<Trip[]>('/trips/featured'),

  getById: (id: string) =>
    apiClient.get<Trip>(`/trips/${id}`),

  // Planner endpoints
  getMyTrips: (params?: { page?: number; q?: string; status?: string; min_price?: number; max_price?: number; start_date_from?: string; start_date_to?: string }) =>
    apiClient.get<PaginatedResponse<Trip>>('/planner/trips', { params }),

  create: (data: {
    title: string;
    subtitle?: string;
    description: string;
    location: string;
    price: number;
    currency?: string;
    duration: string;
    start_date: string;
    end_date: string;
    total_seats: number;
    trip_type?: string;
    tags?: string[];
    highlights?: string[];
    itinerary_days?: { day: string; title: string; desc: string }[];
    recurring_enabled?: boolean;
    recurring_rule?: { day_of_week: number; hour: number };
  }) =>
    apiClient.post<Trip>('/planner/trips', data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch<Trip>(`/planner/trips/${id}`, data),

  destroy: (id: string) =>
    apiClient.delete(`/planner/trips/${id}`),

  publish: (id: string) =>
    apiClient.patch<Trip>(`/planner/trips/${id}/publish`),

  complete: (id: string) =>
    apiClient.patch<Trip>(`/planner/trips/${id}/complete`),

  uploadHeroImage: (id: string, formData: FormData) =>
    apiClient.post<Trip>(`/planner/trips/${id}/hero_image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  uploadGallery: (id: string, formData: FormData) =>
    apiClient.post<Trip>(`/planner/trips/${id}/gallery`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateSeats: (id: string, seatsLeft: number) =>
    apiClient.patch<Trip>(`/planner/trips/${id}/update_seats`, { seats_left: seatsLeft }),

  reschedule: (id: string, data: { start_date: string; end_date: string; total_seats?: number }) =>
    apiClient.post<Trip>(`/planner/trips/${id}/reschedule`, data),

  stopRecurring: (id: string) =>
    apiClient.patch<Trip>(`/planner/trips/${id}/stop_recurring`),
};
