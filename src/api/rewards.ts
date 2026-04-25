import { apiClient } from './client';
import type { UserPointsInfo } from '../types';

export const rewardsApi = {
  getMyPoints: () => apiClient.get<UserPointsInfo>('/points/me'),
};
