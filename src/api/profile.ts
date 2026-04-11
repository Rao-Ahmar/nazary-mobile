import { apiClient } from './client';
import type { User } from '../types';

export const profileApi = {
  updateProfile: (data: Record<string, any>) =>
    apiClient.patch<User>('/users/me', data),

  uploadAvatar: (formData: FormData) =>
    apiClient.patch<User>('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  uploadAgencyLogo: (formData: FormData) =>
    apiClient.patch<User>('/users/me/agency_logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  uploadCoverPhoto: (formData: FormData) =>
    apiClient.patch<User>('/users/me/cover_photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  registerDeviceToken: (deviceToken: string) =>
    apiClient.post('/users/me/device_token', { device_token: deviceToken }),

  getUser: (userId: string) =>
    apiClient.get<User>(`/users/${userId}`),
};
