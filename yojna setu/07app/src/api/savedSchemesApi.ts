import apiClient from './client';
import type { SavedScheme } from '@/types';

export const savedSchemesApi = {
  getSaved: () =>
    apiClient.get<SavedScheme[]>('/saved-schemes').then((r) => r.data),

  saveScheme: (schemeId: number) =>
    apiClient.post<SavedScheme>(`/saved-schemes/${schemeId}`).then((r) => r.data),

  unsaveScheme: (schemeId: number) =>
    apiClient.delete(`/saved-schemes/${schemeId}`).then((r) => r.data),

  isSchemesSaved: (schemeId: number) =>
    apiClient.get<{ is_saved: boolean }>(`/saved-schemes/${schemeId}/check`).then((r) => r.data),
};
