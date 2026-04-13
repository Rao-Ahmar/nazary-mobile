import { create } from 'zustand';
import { bookingsApi, type PlannerBooking } from '../api/bookings';

interface BookingState {
  plannerBookings: PlannerBooking[];
  isLoading: boolean;

  fetchPlannerBookings: (tripId?: string) => Promise<void>;
  confirmBooking: (id: string) => Promise<void>;
  rejectBooking: (id: string) => Promise<void>;
}

export const useBookingStore = create<BookingState>((set) => ({
  plannerBookings: [],
  isLoading: false,

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
