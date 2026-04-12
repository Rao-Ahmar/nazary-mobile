import { apiClient } from './client';
import { ItineraryPreset } from '../types/models';

export const itineraryPresetsApi = {
  getAll: () =>
    apiClient.get<ItineraryPreset[]>('/planner/itinerary_presets'),

  create: (data: { name: string; days: { day: number; title: string; desc: string }[] }) =>
    apiClient.post<ItineraryPreset>('/planner/itinerary_presets', data),

  destroy: (id: string) =>
    apiClient.delete(`/planner/itinerary_presets/${id}`),
};
