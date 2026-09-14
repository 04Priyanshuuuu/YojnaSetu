import apiClient from './client';
import type {
  Scheme,
  PaginatedSchemeListResponse,
  FilterOptionsResponse,
  SchemeFilters,
} from '@/types';

export const schemeApi = {
  getSchemes: (filters: SchemeFilters = {}) => {
    const params: Record<string, unknown> = { ...filters };
    if (filters.tags && filters.tags.length > 0) {
      params.tags = filters.tags.join(',');
    }
    return apiClient
      .get<PaginatedSchemeListResponse>('/schemes', { params })
      .then((r) => r.data);
  },

  getScheme: (idOrSlug: string | number) =>
    apiClient.get<Scheme>(`/schemes/${idOrSlug}`).then((r) => r.data),

  getFilterOptions: () =>
    apiClient.get<FilterOptionsResponse>('/schemes/filter-options').then((r) => r.data),

  compareSchemes: (ids: number[]) =>
    apiClient.post<Scheme[]>('/schemes/compare', { ids }).then((r) => r.data),

  emailScheme: (schemeId: number) =>
    apiClient.post(`/schemes/${schemeId}/email`).then((r) => r.data),
};
