import { create } from 'zustand';
import type { CustomTripRequest } from '../types';

const mockMyRequests: CustomTripRequest[] = [
  {
    id: '1',
    travelerId: 'dev-traveler',
    travelerName: 'Alex Traveler',
    travelerPhone: '+923005551234',
    plannerId: '1',
    plannerName: 'Alex Romanov',
    plannerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    plannerPhone: '+923001234567',
    destination: 'Hunza Valley',
    startDate: '2026-09-01',
    endDate: '2026-09-07',
    seats: 2,
    category: 'Adventure',
    budget: 50000,
    note: 'Private tour with photography focus.',
    status: 'accepted',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: '3',
    travelerId: 'dev-traveler',
    travelerName: 'Alex Traveler',
    plannerId: '2',
    plannerName: 'Fatima Khan',
    plannerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    destination: 'Fairy Meadows',
    startDate: '2026-07-10',
    endDate: '2026-07-14',
    seats: 2,
    category: 'Wellness',
    budget: 35000,
    note: 'Relaxing trip with Nanga Parbat views.',
    status: 'pending',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

const mockIncoming: CustomTripRequest[] = [
  {
    id: '2',
    travelerId: '3',
    travelerName: 'Ahmed Raza',
    travelerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
    plannerId: 'dev-planner',
    plannerName: 'Sam Planner',
    destination: 'Skardu',
    startDate: '2026-08-15',
    endDate: '2026-08-22',
    seats: 4,
    category: 'Adventure',
    budget: 80000,
    note: 'Group trip for trekking and lake visits.',
    status: 'pending',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

interface TripRequestState {
  myRequests: CustomTripRequest[];
  incomingRequests: CustomTripRequest[];
  isLoading: boolean;

  fetchMyRequests: () => Promise<void>;
  fetchIncoming: () => Promise<void>;
  cancelRequest: (id: string) => void;
  acceptRequest: (id: string) => void;
  rejectRequest: (id: string) => void;
  addRequest: (request: CustomTripRequest) => void;
}

export const useTripRequestStore = create<TripRequestState>((set) => ({
  myRequests: mockMyRequests,
  incomingRequests: mockIncoming,
  isLoading: false,

  fetchMyRequests: async () => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 300));
    set({ isLoading: false });
  },

  fetchIncoming: async () => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 300));
    set({ isLoading: false });
  },

  cancelRequest: (id) => {
    set((state) => ({
      myRequests: state.myRequests.map((r) =>
        r.id === id ? { ...r, status: 'cancelled' as const } : r,
      ),
    }));
  },

  acceptRequest: (id) => {
    set((state) => ({
      incomingRequests: state.incomingRequests.map((r) =>
        r.id === id ? { ...r, status: 'accepted' as const } : r,
      ),
    }));
  },

  rejectRequest: (id) => {
    set((state) => ({
      incomingRequests: state.incomingRequests.map((r) =>
        r.id === id ? { ...r, status: 'rejected' as const } : r,
      ),
    }));
  },

  addRequest: (request) => {
    set((state) => ({
      myRequests: [request, ...state.myRequests],
    }));
  },
}));
