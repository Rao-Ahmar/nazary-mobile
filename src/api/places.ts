import { apiClient } from './client';
import type { Place } from '../types';

export const placesApi = {
  getAll: (page = 1, region?: string) =>
    apiClient.get('/places', { params: { page, region } }),

  getById: (id: string) =>
    apiClient.get<Place>(`/places/${id}`),
};
