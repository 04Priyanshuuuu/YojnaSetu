import apiClient from './client';
import type { ApplicationResponse, PaginatedApplicationResponse } from '@/types';

export const applicationApi = {
  getApplications: (page = 1, size = 20) =>
    apiClient
      .get<PaginatedApplicationResponse>('/applications', { params: { page, size } })
      .then((r) => r.data),

  getApplication: (id: number) =>
    apiClient.get<ApplicationResponse>(`/applications/${id}`).then((r) => r.data),

  createApplication: (schemeId: number) =>
    apiClient.post<ApplicationResponse>('/applications', { scheme_id: schemeId }).then((r) => r.data),

  submitApplication: (id: number) =>
    apiClient.post<ApplicationResponse>(`/applications/${id}/submit`).then((r) => r.data),

  withdrawApplication: (id: number) =>
    apiClient.post<ApplicationResponse>(`/applications/${id}/withdraw`).then((r) => r.data),
};
