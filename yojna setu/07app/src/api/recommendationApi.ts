import apiClient from './client';
import type { RecommendationResponse, BeneficiaryProfileInput } from '@/types';

export interface RecommendationRequest {
  query?: string;
  profile?: BeneficiaryProfileInput;
  type?: 'PROFILE' | 'TEXT';
}

export const recommendationApi = {
  getRecommendations: (data: RecommendationRequest) =>
    apiClient.post<RecommendationResponse>('/recommendations', data).then((r) => r.data),
};
