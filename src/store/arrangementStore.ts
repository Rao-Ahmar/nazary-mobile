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

// Mock data for development
const mockArrangements: ArrangementRequest[] = [
  {
    id: '1',
    preferredDestination: 'Hunza Valley',
    travelDates: 'Sep 15 - Sep 22, 2026',
    groupSize: 4,
    budgetMin: 20000,
    budgetMax: 60000,
    specialNotes: 'Family trip with hotel stays.',
    status: 'in_review',
    createdAt: '2026-04-01T10:00:00Z',
  },
  {
    id: '2',
    travelDates: 'Oct 1 - Oct 7, 2026',
    groupSize: 2,
    budgetMin: 30000,
    budgetMax: 80000,
    specialNotes: 'Surprise us! Off-the-beaten-path adventure.',
    status: 'pending',
    createdAt: '2026-04-05T14:00:00Z',
  },
];

export const useArrangementStore = create<ArrangementState>((set) => ({
  arrangements: mockArrangements,
  isLoading: false,

  fetchArrangements: async () => {
    set({ isLoading: true });
    try {
      const response = await arrangementApi.getMyRequests();
      set({ arrangements: response.data?.data || response.data || mockArrangements });
    } catch {
      // Use mock data as fallback
      set({ arrangements: mockArrangements });
    } finally {
      set({ isLoading: false });
    }
  },
}));
