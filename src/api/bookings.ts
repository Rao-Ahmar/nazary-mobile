import { apiClient } from './client';

interface Booking {
  id: string;
  trip_id: string;
  traveler_id: string;
  traveler_name: string;
  traveler_avatar?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  amount: number;
  created_at: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { currentPage: number; totalPages: number; totalCount: number };
}

export const bookingsApi = {
  requestToJoin: (tripId: string) =>
    apiClient.post<Booking>(`/trips/${tripId}/bookings`, {}),

  getMyBookings: (page = 1) =>
    apiClient.get<PaginatedResponse<Booking>>('/bookings', { params: { page } }),

  cancel: (id: string) =>
    apiClient.patch<Booking>(`/bookings/${id}/cancel`),
};
