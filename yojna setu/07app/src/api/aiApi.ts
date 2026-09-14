import apiClient from './client';
import type { AIChatRequest, AIChatResponse } from '@/types';

export const aiApi = {
  chat: (data: AIChatRequest) =>
    apiClient.post<AIChatResponse>('/ai/chat', data).then((r) => r.data),

  schemeAsk: (schemeId: number, question: string, language?: string) =>
    apiClient
      .post<AIChatResponse>(`/ai/scheme-ask`, { scheme_id: schemeId, message: question, language })
      .then((r) => r.data),

  extractProfile: (text: string) =>
    apiClient.post<{ profile: Record<string, unknown> }>('/ai/extract', { text }).then((r) => r.data),
};
