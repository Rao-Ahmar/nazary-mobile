import { create } from 'zustand';
import { arrangementApi } from '../api/arrangements';

interface ArrangementRequest {
  id: string;
  preferredDestination?: string;
  preferred_destination?: string;
  travelDates: string;
  travel_dates?: string;
  groupSize: number;
  group_size?: number;
  budgetMin: number;
  budget_min?: number;
  budgetMax: number;
  budget_max?: number;
  specialNotes?: string;
  special_notes?: string;
  status: 'pending' | 'in_review' | 'arranged' | 'rejected';
  linkedTripId?: string;
  linked_trip_id?: string;
  createdAt: string;
  created_at?: string;
}

interface ArrangementState {
  arrangements: ArrangementRequest[];
  isLoading: boolean;
  fetchArrangements: () => Promise<void>;
}

export const useArrangementStore = create<ArrangementState>((set) => ({
  arrangements: [],
  isLoading: false,

  fetchArrangements: async () => {
    set({ isLoading: true });
    try {
      const response = await arrangementApi.getMyRequests();
      set({ arrangements: response.data?.data || response.data || [] });
    } catch {
      set({ arrangements: [] });
    } finally {
      set({ isLoading: false });
    }
  },
}));
