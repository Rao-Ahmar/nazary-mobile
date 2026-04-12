import { create } from 'zustand';
import { tripRequestsApi } from '../api/tripRequests';
import type { CustomTripRequest } from '../types';

interface TripRequestState {
  myRequests: CustomTripRequest[];
  incomingRequests: CustomTripRequest[];
  isLoading: boolean;

  fetchMyRequests: () => Promise<void>;
  fetchIncoming: () => Promise<void>;
  cancelRequest: (id: string) => Promise<void>;
  acceptRequest: (id: string) => Promise<void>;
  rejectRequest: (id: string) => Promise<void>;
}

export const useTripRequestStore = create<TripRequestState>((set) => ({
  myRequests: [],
  incomingRequests: [],
  isLoading: false,

  fetchMyRequests: async () => {
    set({ isLoading: true });
    try {
      const res = await tripRequestsApi.getMyRequests();
      const data = Array.isArray(res.data) ? res.data : (res.data as any)?.data ?? [];
      set({ myRequests: data });
    } catch {
      // Network error
    } finally {
      set({ isLoading: false });
    }
  },

  fetchIncoming: async () => {
    set({ isLoading: true });
    try {
      const res = await tripRequestsApi.getIncoming();
      const data = Array.isArray(res.data) ? res.data : (res.data as any)?.data ?? [];
      set({ incomingRequests: data });
    } catch {
      // Network error
    } finally {
      set({ isLoading: false });
    }
  },

  cancelRequest: async (id) => {
    try {
      await tripRequestsApi.cancel(id);
      set((state) => ({
        myRequests: state.myRequests.map((r) =>
          r.id === id ? { ...r, status: 'cancelled' as const } : r,
        ),
      }));
    } catch {
      // Error handled by caller
    }
  },

  acceptRequest: async (id) => {
    try {
      await tripRequestsApi.accept(id);
      set((state) => ({
        incomingRequests: state.incomingRequests.map((r) =>
          r.id === id ? { ...r, status: 'accepted' as const } : r,
        ),
      }));
    } catch {
      // Error handled by caller
    }
  },

  rejectRequest: async (id) => {
    try {
      await tripRequestsApi.reject(id);
      set((state) => ({
        incomingRequests: state.incomingRequests.map((r) =>
          r.id === id ? { ...r, status: 'rejected' as const } : r,
        ),
      }));
    } catch {
      // Error handled by caller
    }
  },
}));
