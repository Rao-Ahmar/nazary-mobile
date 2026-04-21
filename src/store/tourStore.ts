import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOUR_KEY = '@nazary_tour_completed';

interface TourState {
  travelerDone: boolean;
  plannerDone: boolean;
  completeTour: (role: 'traveler' | 'planner') => void;
  hydrate: () => Promise<void>;
}

export const useTourStore = create<TourState>((set, get) => ({
  travelerDone: false,
  plannerDone: false,

  completeTour: (role) => {
    const key = role === 'traveler' ? 'travelerDone' : 'plannerDone';
    set({ [key]: true });
    const state = get();
    const persisted = JSON.stringify({
      travelerDone: state.travelerDone,
      plannerDone: state.plannerDone,
    });
    AsyncStorage.setItem(TOUR_KEY, persisted).catch(() => {});
  },

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(TOUR_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({
          travelerDone: !!parsed.travelerDone,
          plannerDone: !!parsed.plannerDone,
        });
      }
    } catch {}
  },
}));
