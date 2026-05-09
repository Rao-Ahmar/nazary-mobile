import { create } from 'zustand';
import type { BikeProfile, BikeRider, Trip } from '../types';
import { bikeApi } from '../api/bikeTrips';

interface BikeState {
  bikeTrips: Trip[];
  bikeRiders: BikeRider[];
  bikeProfile: BikeProfile | null;
  isPremiumUnlocked: boolean;
  isLoading: boolean;

  fetchBikeTrips: () => Promise<void>;
  fetchRiders: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  setPremium: (value: boolean) => void;
  setBikeProfile: (profile: BikeProfile) => void;
}

export const useBikeStore = create<BikeState>((set) => ({
  bikeTrips: [],
  bikeRiders: [],
  bikeProfile: null,
  isPremiumUnlocked: false,
  isLoading: false,

  fetchBikeTrips: async () => {
    set({ isLoading: true });
    try {
      const response = await bikeApi.getTrips();
      set({ bikeTrips: response.data?.data || response.data || [] });
    } catch {
      set({ bikeTrips: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchRiders: async () => {
    set({ isLoading: true });
    try {
      const response = await bikeApi.getRiders();
      set({ bikeRiders: response.data?.data || response.data || [] });
    } catch {
      set({ bikeRiders: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const response = await bikeApi.getProfile();
      set({ bikeProfile: response.data || null });
    } catch {
      set({ bikeProfile: null });
    } finally {
      set({ isLoading: false });
    }
  },

  setPremium: (value) => set({ isPremiumUnlocked: value }),
  setBikeProfile: (profile) => set({ bikeProfile: profile }),
}));
