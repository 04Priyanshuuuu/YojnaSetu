import { apiClient } from "./client";
import type { BeneficiaryProfileInput } from "./authApi";
import type { RecommendationResponse } from "./recommendationApi";

export type CitizenProfileResponse = Record<string, unknown>;

export const profileApi = {
  getProfile: async (): Promise<CitizenProfileResponse> =>
    (await apiClient.get<CitizenProfileResponse>("/profile")).data,
  updateProfile: async (
    profile: BeneficiaryProfileInput,
  ): Promise<CitizenProfileResponse> =>
    (await apiClient.put<CitizenProfileResponse>("/profile", profile)).data,
  smartMatch: async (
    profileOverride?: BeneficiaryProfileInput,
    topK = 10,
  ): Promise<RecommendationResponse> =>
    (
      await apiClient.post<RecommendationResponse>(
        "/profile/match",
        profileOverride || null,
        { params: { top_k: topK } },
      )
    ).data,
};
