import { create } from 'zustand';
import type { User, UserRole } from '../types';
import { setAuthToken } from '../api/client';
import { authApi } from '../api/auth';
import { registerForPushNotifications } from '../utils/notifications';
import { profileApi } from '../api/profile';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  profileCompleted: boolean;

  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  setProfileCompleted: (completed: boolean) => void;
  setUser: (user: User) => void;

  /** Dev helpers — login with seed accounts */
  devLoginAsTraveler: () => Promise<void>;
  devLoginAsPlanner: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  role: null,
  isAuthenticated: false,
  isLoading: false,
  profileCompleted: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login(email, password);
      const { user, token, refresh_token } = response.data;
      setAuthToken(token);
      set({
        user,
        token,
        refreshToken: refresh_token,
        role: user.role,
        isAuthenticated: true,
        isLoading: false,
        profileCompleted: true,
      });
      // Register push token (fire-and-forget)
      registerForPushNotifications().then((pushToken) => {
        if (pushToken) profileApi.registerDeviceToken(pushToken).catch(() => {});
      });
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'Login failed. Please check your credentials.';
      set({ isLoading: false });
      throw new Error(msg);
    }
  },

  signup: async (name, email, password, role) => {
    set({ isLoading: true });
    try {
      const response = await authApi.signup(name, email, password, role);
      const { user, token, refresh_token } = response.data;
      setAuthToken(token);
      set({
        user,
        token,
        refreshToken: refresh_token,
        role: user.role,
        isAuthenticated: true,
        isLoading: false,
        profileCompleted: user.profileCompleted ?? (user as any).profile_completed ?? false,
      });
      // Register push token (fire-and-forget)
      registerForPushNotifications().then((pushToken) => {
        if (pushToken) profileApi.registerDeviceToken(pushToken).catch(() => {});
      });
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'Signup failed. Please try again.';
      set({ isLoading: false });
      throw new Error(msg);
    }
  },

  logout: () => {
    authApi.logout().catch(() => {});
    setAuthToken(null);
    set({
      user: null,
      token: null,
      refreshToken: null,
      role: null,
      isAuthenticated: false,
      isLoading: false,
      profileCompleted: false,
    });
  },

  setProfileCompleted: (completed) => {
    set((state) => ({
      profileCompleted: completed,
      user: state.user ? { ...state.user, profileCompleted: completed } : null,
    }));
  },

  setUser: (user) => {
    set({ user, role: user.role, profileCompleted: user.profileCompleted });
  },

  devLoginAsTraveler: async () => {
    const { login } = useAuthStore.getState();
    await login('zainab@nazary.com', 'password123');
  },

  devLoginAsPlanner: async () => {
    const { login } = useAuthStore.getState();
    await login('usman@nazary.com', 'password123');
  },
}));
