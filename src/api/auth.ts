import { apiClient } from './client';
import type { User, UserRole } from '../types';

interface AuthResponse {
  user: User;
  token: string;
  refresh_token: string;
}

export const authApi = {
  login(email: string, password: string) {
    return apiClient.post<AuthResponse>('/auth/login', { email, password });
  },

  signup(name: string, email: string, password: string, role: UserRole) {
    return apiClient.post<AuthResponse>('/auth/signup', { name, email, password, role });
  },

  logout() {
    return apiClient.delete('/auth/logout');
  },

  getCurrentUser() {
    return apiClient.get<User>('/auth/me');
  },

  forgotPassword(email: string) {
    return apiClient.post('/auth/forgot_password', { email });
  },

  resetPassword(token: string, password: string) {
    return apiClient.post('/auth/reset_password', { token, password });
  },

  refresh(refreshToken: string) {
    return apiClient.post<{ token: string; refresh_token: string }>('/auth/refresh', { refresh_token: refreshToken });
  },

  googleLogin(idToken: string) {
    return apiClient.post<AuthResponse>('/auth/google', { id_token: idToken });
  },
};
