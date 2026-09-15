import { apiClient } from './client';

import {
  BeneficiaryProfileInput,
} from './recommendationApi';

export interface NaturalLanguageExtractResponse {
  extracted_profile: BeneficiaryProfileInput;

  [key: string]: unknown;
}

export interface AIRecommendationRequest {
  user_text: string;
  profile: BeneficiaryProfileInput;
  top_k?: number;
}

export interface AIExplainableRecommendationResponse {
  [key: string]: unknown;
}

export const aiApi = {
  /**
   * Converts natural-language citizen requirements
   * into a structured beneficiary profile.
   *
   * Backend contract:
   * POST /profile/extract
   */
  extractProfile: async (
    userText: string
  ): Promise<NaturalLanguageExtractResponse> => {
    const response =
      await apiClient.post<NaturalLanguageExtractResponse>(
        '/profile/extract',
        {
          text: userText,
        }
      );

    return response.data;
  },

  /**
   * AI-enhanced recommendation explanation.
   *
   * This is kept separate from the deterministic recommendation
   * engine. The deterministic /recommend endpoint remains the
   * primary eligibility source.
   */
  getAIRecommendations: async (
    payload: AIRecommendationRequest
  ): Promise<AIExplainableRecommendationResponse> => {
    const response =
      await apiClient.post<AIExplainableRecommendationResponse>(
        '/recommend/ai',
        payload
      );

    return response.data;
  },
};

export default aiApi;