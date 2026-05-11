import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOUR_KEY = '@nazary_tour_completed';

/** All screen keys that have tours */
const TRAVELER_SCREENS = [
  'traveler_home',
  'traveler_search',
  'traveler_mytrips',
  'traveler_agencies',
  'traveler_profile',
] as const;

const PLANNER_SCREENS = [
  'planner_dashboard',
  'planner_managetrips',
  'planner_requests',
  'planner_profile',
] as const;

interface TourState {
  completedScreens: Record<string, boolean>;
  isScreenDone: (screenKey: string) => boolean;
  completeScreen: (screenKey: string) => void;
  hydrate: () => Promise<void>;
}

export const useTourStore = create<TourState>((set, get) => ({
  completedScreens: {},

  isScreenDone: (screenKey: string) => {
    return !!get().completedScreens[screenKey];
  },

  completeScreen: (screenKey: string) => {
    set((state) => ({
      completedScreens: { ...state.completedScreens, [screenKey]: true },
    }));
    AsyncStorage.setItem(TOUR_KEY, JSON.stringify(get().completedScreens)).catch(() => {});
  },

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(TOUR_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);

        // Migrate legacy format { travelerDone, plannerDone } -> per-screen
        if (parsed.travelerDone !== undefined || parsed.plannerDone !== undefined) {
          const migrated: Record<string, boolean> = {};
          if (parsed.travelerDone) {
            for (const key of TRAVELER_SCREENS) migrated[key] = true;
          }
          if (parsed.plannerDone) {
            for (const key of PLANNER_SCREENS) migrated[key] = true;
          }
          set({ completedScreens: migrated });
          AsyncStorage.setItem(TOUR_KEY, JSON.stringify(migrated)).catch(() => {});
        } else {
          set({ completedScreens: parsed });
        }
      }
    } catch {}
  },
}));
