import { create } from 'zustand';
import { bookingsApi, type PlannerBooking } from '../api/bookings';
import type { Booking } from '../types';

interface BookingState {
  myBookings: Booking[];
  plannerBookings: PlannerBooking[];
  isLoading: boolean;

  fetchMyBookings: () => Promise<void>;
  fetchPlannerBookings: (tripId?: string) => Promise<void>;
  confirmBooking: (id: string) => Promise<void>;
  rejectBooking: (id: string) => Promise<void>;
}

export const useBookingStore = create<BookingState>((set) => ({
  myBookings: [],
  plannerBookings: [],
  isLoading: false,

  fetchMyBookings: async () => {
    set({ isLoading: true });
    try {
      const res = await bookingsApi.getMyBookings();
      const raw = res.data;
      const data = Array.isArray(raw) ? raw : (raw as any)?.data ?? [];
      set({ myBookings: data });
    } catch {
      // Network error
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPlannerBookings: async (tripId?: string) => {
    set({ isLoading: true });
    try {
      const res = await bookingsApi.getPlannerBookings({ tripId });
      const raw = res.data;
      const data = Array.isArray(raw) ? raw : (raw as any)?.bookings ?? (raw as any)?.data ?? [];
      set({ plannerBookings: data });
    } catch {
      // Network error
    } finally {
      set({ isLoading: false });
    }
  },

  confirmBooking: async (id) => {
    try {
      await bookingsApi.confirmBooking(id);
      set((state) => ({
        plannerBookings: state.plannerBookings.map((b) =>
          b.id === id ? { ...b, status: 'confirmed' as const } : b,
        ),
      }));
    } catch {
      // Error handled by caller
    }
  },

  rejectBooking: async (id) => {
    try {
      await bookingsApi.rejectBooking(id);
      set((state) => ({
        plannerBookings: state.plannerBookings.map((b) =>
          b.id === id ? { ...b, status: 'cancelled' as const } : b,
        ),
      }));
    } catch {
      // Error handled by caller
    }
  },
}));
