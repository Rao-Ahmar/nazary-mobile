import { apiClient } from './client';
import type { BikeProfile } from '../types';

export const bikeApi = {
  getTrips: (page = 1) =>
    apiClient.get('/bike/trips', { params: { page } }),

  getRiders: (page = 1, experienceLevel?: string) =>
    apiClient.get('/bike/riders', { params: { page, experience_level: experienceLevel } }),

  getProfile: () =>
    apiClient.get<BikeProfile>('/bike/profile'),

  createProfile: (data: { bikeModel: string; bikeCc: number; experienceLevel: string; bio?: string }) =>
    apiClient.post<BikeProfile>('/bike/profile', {
      bike_model: data.bikeModel,
      bike_cc: data.bikeCc,
      experience_level: data.experienceLevel,
      bio: data.bio,
    }),

  updateProfile: (data: { bikeModel?: string; bikeCc?: number; experienceLevel?: string; bio?: string }) =>
    apiClient.patch<BikeProfile>('/bike/profile', {
      bike_model: data.bikeModel,
      bike_cc: data.bikeCc,
      experience_level: data.experienceLevel,
      bio: data.bio,
    }),
};
