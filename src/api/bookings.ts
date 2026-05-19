import { apiClient } from './client';

interface Booking {
  id: string;
  tripId?: string;
  trip_id?: string;
  travelerId?: string;
  traveler_id?: string;
  travelerName?: string;
  traveler_name?: string;
  travelerAvatar?: string;
  traveler_avatar?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'approved' | 'payment_submitted' | 'rejected';
  amount: number;
  adminNote?: string;
  admin_note?: string;
  createdAt?: string;
  created_at?: string;
}

interface PaymentAccount {
  id: string;
  method_type: string;
  account_title: string;
  account_number: string;
  bank_name?: string;
  is_active: boolean;
}

interface PaymentInfoResponse {
  booking: Booking;
  payment_accounts: PaymentAccount[];
}

export interface PlannerBooking extends Booking {
  tripTitle?: string;
  trip_title?: string;
  tripHeroImage?: string;
  trip_hero_image?: string;
  tripLocation?: string;
  trip_location?: string;
  travelerPhone?: string;
  traveler_phone?: string;
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

  // Planner endpoints
  getPlannerBookings: (params?: { tripId?: string; status?: string; page?: number }) =>
    apiClient.get<PaginatedResponse<PlannerBooking>>('/planner/bookings', {
      params: { trip_id: params?.tripId, status: params?.status, page: params?.page },
    }),

  confirmBooking: (id: string) =>
    apiClient.patch<PlannerBooking>(`/planner/bookings/${id}/confirm`),

  rejectBooking: (id: string) =>
    apiClient.patch<PlannerBooking>(`/planner/bookings/${id}/cancel`),

  // Payment endpoints (traveler)
  getPaymentInfo: (bookingId: string) =>
    apiClient.get<PaymentInfoResponse>(`/bookings/${bookingId}/payment_info`),

  submitPaymentProof: (bookingId: string, formData: FormData) =>
    apiClient.post<Booking>(`/bookings/${bookingId}/payment_proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
