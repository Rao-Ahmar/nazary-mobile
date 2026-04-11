import { apiClient } from './client';

interface ArrangementRequestPayload {
  preferred_destination?: string;
  travel_dates: string;
  group_size: number;
  budget_min: number;
  budget_max: number;
  special_notes?: string;
}

export const arrangementApi = {
  create(data: ArrangementRequestPayload) {
    return apiClient.post('/arrangement_requests', data);
  },

  getMyRequests() {
    return apiClient.get('/my/arrangement_requests');
  },
};
