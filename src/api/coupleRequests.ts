import { apiClient } from './client';

export const coupleRequestsApi = {
  create: (data: {
    partner_name: string;
    destination_preference: string;
    travel_dates: string;
    budget_range: string;
    special_requests?: string;
  }) => apiClient.post('/couple_requests', data),

  getMyRequests: () => apiClient.get('/couple_requests'),
};
