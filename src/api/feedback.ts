import { apiClient } from './client';

interface FeedbackPayload {
  subject: string;
  message: string;
}

export const feedbackApi = {
  submit(data: FeedbackPayload) {
    return apiClient.post('/feedback_submissions', data);
  },
};
