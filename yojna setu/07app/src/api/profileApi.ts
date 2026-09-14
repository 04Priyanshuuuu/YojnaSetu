import apiClient from './client';
import type { BeneficiaryProfileInput, CitizenProfileResponse, ProfileMatchResponse } from '@/types';

export const profileApi = {
  getProfile: () =>
    apiClient.get<CitizenProfileResponse>('/profile').then((r) => r.data),

  updateProfile: (data: BeneficiaryProfileInput) =>
    apiClient.put<CitizenProfileResponse>('/profile', data).then((r) => r.data),

  matchProfile: () =>
    apiClient.post<ProfileMatchResponse>('/profile/match').then((r) => r.data),
};
