import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, UserRole } from '../types';
import { setAuthToken } from '../api/client';
import { authApi } from '../api/auth';
import { registerForPushNotifications } from '../utils/notifications';
import { profileApi } from '../api/profile';

const AUTH_STORAGE_KEY = '@nazary_auth';

interface PersistedAuth {
  user: User;
  token: string;
  refreshToken: string;
  role: UserRole;
  profileCompleted: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  profileCompleted: boolean;

  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role: UserRole, referralCode?: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => void;
  setProfileCompleted: (completed: boolean) => void;
  setUser: (user: User) => void;

  /** Rehydrate persisted auth state from AsyncStorage */
  hydrate: () => Promise<void>;
}

function persistAuth(data: PersistedAuth) {
  AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data)).catch(() => {});
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
      const profileDone = user.profileCompleted ?? (user as any).profile_completed ?? true;
      set({
        user,
        token,
        refreshToken: refresh_token,
        role: user.role,
        isAuthenticated: true,
        isLoading: false,
        profileCompleted: profileDone,
      });
      persistAuth({ user, token, refreshToken: refresh_token, role: user.role, profileCompleted: profileDone });
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

  signup: async (name, email, password, role, referralCode?) => {
    set({ isLoading: true });
    try {
      const response = await authApi.signup(name, email, password, role, referralCode);
      const { user, token, refresh_token } = response.data;
      setAuthToken(token);
      const profileDone = user.profileCompleted ?? (user as any).profile_completed ?? false;
      set({
        user,
        token,
        refreshToken: refresh_token,
        role: user.role,
        isAuthenticated: true,
        isLoading: false,
        profileCompleted: profileDone,
      });
      persistAuth({ user, token, refreshToken: refresh_token, role: user.role, profileCompleted: profileDone });
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

  googleLogin: async (idToken) => {
    set({ isLoading: true });
    try {
      const response = await authApi.googleLogin(idToken);
      const { user, token, refresh_token } = response.data;
      setAuthToken(token);
      const profileDone = user.profileCompleted ?? (user as any).profile_completed ?? false;
      set({
        user,
        token,
        refreshToken: refresh_token,
        role: user.role,
        isAuthenticated: true,
        isLoading: false,
        profileCompleted: profileDone,
      });
      persistAuth({ user, token, refreshToken: refresh_token, role: user.role, profileCompleted: profileDone });
      registerForPushNotifications().then((pushToken) => {
        if (pushToken) profileApi.registerDeviceToken(pushToken).catch(() => {});
      });
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'Google sign-in failed. Please try again.';
      set({ isLoading: false });
      throw new Error(msg);
    }
  },

  logout: () => {
    authApi.logout().catch(() => {});
    setAuthToken(null);
    AsyncStorage.removeItem(AUTH_STORAGE_KEY).catch(() => {});
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

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return;
      const data: PersistedAuth = JSON.parse(raw);
      if (data.token) {
        setAuthToken(data.token);
        set({
          user: data.user,
          token: data.token,
          refreshToken: data.refreshToken,
          role: data.role,
          isAuthenticated: true,
          profileCompleted: data.profileCompleted,
        });
      }
    } catch {
      // Corrupted storage — ignore and stay logged out
    }
  },
}));
