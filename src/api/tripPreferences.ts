import { apiClient } from './client';

export interface TripPreference {
  id: string;
  budget_min: number | null;
  budget_max: number | null;
  preferred_months: number[];
  followed_agency_id: string | null;
  followed_agency_name: string | null;
}

export const tripPreferencesApi = {
  get: () =>
    apiClient.get<{ data: TripPreference | null }>('/trip_preferences'),

  upsert: (data: {
    budget_min?: number | null;
    budget_max?: number | null;
    preferred_months?: number[];
    followed_agency_id?: string | null;
  }) =>
    apiClient.put<TripPreference>('/trip_preferences', data),
};
