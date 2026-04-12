import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, lightShadows, darkShadows, type Colors, type Shadows } from '../theme/tokens';

const THEME_KEY = '@nazary_theme_mode';

interface ThemeState {
  mode: 'light' | 'dark';
  colors: Colors;
  shadows: Shadows;
  isDark: boolean;
  toggleTheme: () => void;
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',
  colors: lightColors,
  shadows: lightShadows,
  isDark: false,

  toggleTheme: () => {
    const next = get().mode === 'light' ? 'dark' : 'light';
    const isDark = next === 'dark';
    set({
      mode: next,
      colors: isDark ? darkColors : lightColors,
      shadows: isDark ? darkShadows : lightShadows,
      isDark,
    });
    AsyncStorage.setItem(THEME_KEY, next).catch(() => {});
  },

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_KEY);
      if (stored === 'dark' || stored === 'light') {
        const isDark = stored === 'dark';
        set({
          mode: stored,
          colors: isDark ? darkColors : lightColors,
          shadows: isDark ? darkShadows : lightShadows,
          isDark,
        });
      }
    } catch {}
  },
}));
