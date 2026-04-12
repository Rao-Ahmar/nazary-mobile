import { useThemeStore } from '../store/themeStore';

export function useTheme() {
  const colors = useThemeStore((s) => s.colors);
  const shadows = useThemeStore((s) => s.shadows);
  const isDark = useThemeStore((s) => s.isDark);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  return { colors, shadows, isDark, toggleTheme };
}
