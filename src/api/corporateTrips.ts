import { apiClient } from './client';

export const corporateTripsApi = {
  create: (data: {
    company_name: string;
    estimated_people: number;
    contact_email?: string;
    contact_phone?: string;
    special_notes?: string;
    preferred_planner_id?: string;
  }) => apiClient.post('/corporate_trip_requests', data),

  getMyRequests: () => apiClient.get('/corporate_trip_requests'),
};
