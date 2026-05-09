import axios from 'axios';
import Constants from 'expo-constants';

function getBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // In development, auto-detect the dev machine IP from Expo
  if (__DEV__) {
    const debuggerHost =
      Constants.expoConfig?.hostUri ??
      (Constants as any).manifest?.debuggerHost ??
      Constants.manifest2?.extra?.expoGo?.debuggerHost ??
      (Constants as any).manifest?.packagerOpts?.dev;

    if (debuggerHost) {
      const ip = debuggerHost.split(':')[0];
      if (ip && ip !== 'undefined') {
        return `http://${ip}:3000/api/v1`;
      }
    }

    // Dev fallback: localhost (only works on simulators)
    return 'http://localhost:3000/api/v1';
  }

  // Production: MUST be set via EXPO_PUBLIC_API_URL env variable
  // Falling back to localhost will not work in production builds
  return 'http://localhost:3000/api/v1';
}

const BASE_URL = getBaseUrl();

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

/** Attach bearer token to every request when available. */
export function setAuthToken(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
}

/**
 * 401 interceptor: attempt to refresh the token once, then retry.
 * If refresh also fails, log the user out.
 */
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

function processQueue(error: any, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh for auth endpoints to avoid loops
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/signup')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Dynamically import to avoid circular deps
      const { useAuthStore } = require('../store/authStore');
      const { refreshToken } = useAuthStore.getState();

      if (!refreshToken) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      const { authApi } = require('./auth');
      const response = await authApi.refresh(refreshToken);
      const { token: newToken, refresh_token: newRefresh } = response.data;

      setAuthToken(newToken);
      useAuthStore.setState({
        token: newToken,
        refreshToken: newRefresh,
      });

      processQueue(null, newToken);
      originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      const { useAuthStore } = require('../store/authStore');
      useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
