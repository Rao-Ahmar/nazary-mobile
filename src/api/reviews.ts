import { apiClient } from './client';
import type { PlannerReview, PlaceReview } from '../types';

export const reviewsApi = {
  // Planner reviews
  getPlannerReviews: (userId: string, page = 1) =>
    apiClient.get(`/users/${userId}/reviews`, { params: { page } }),

  createPlannerReview: (data: { plannerId: string; rating: number; text: string }) =>
    apiClient.post<PlannerReview>('/planner_reviews', {
      planner_id: data.plannerId,
      rating: data.rating,
      text: data.text,
    }),

  // Place reviews
  getPlaceReviews: (placeId: string, page = 1) =>
    apiClient.get(`/places/${placeId}/reviews`, { params: { page } }),

  createPlaceReview: (placeId: string, data: { rating: number; text: string }) =>
    apiClient.post<PlaceReview>(`/places/${placeId}/reviews`, data),
};
