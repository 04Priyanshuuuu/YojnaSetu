import apiClient from './client';
import type { PaginatedPartnerResponse, Partner } from '@/types';

export const partnerApi = {
  getPartners: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedPartnerResponse>('/partners', { params }).then((r) => r.data),

  getNearestPartners: (lat: number, lng: number, radius = 50) =>
    apiClient
      .get<Partner[]>('/partners/nearest', { params: { lat, lng, radius_km: radius } })
      .then((r) => r.data),
};
