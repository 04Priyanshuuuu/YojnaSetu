import { apiClient } from "./client";
import type {
  ApplicationResponse,
  PaginatedApplicationListResponse,
} from "../types/application";

export interface PartnerData {
  partner_id: string;
  name: string;
  code?: string;
  partner_type?: string;
  institution_type?: string;

  address?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;

  phone?: string | null;
  email?: string | null;
  website?: string | null;
  source_url?: string | null;

  latitude?: number | null;
  longitude?: number | null;

  distance_km?: number | null;

  service_type?: string | null;
  supported_schemes?: string[];

  is_active?: boolean;
  is_accepting_applications?: boolean;

  is_scheme_matched?: boolean;
  is_authorized?: boolean;

  last_verified_date?: string | null;

  [key: string]: unknown;
}

export interface NearestPartnerResponse {
  partner: PartnerData;

  distance_km?: number | null;

  is_scheme_matched?: boolean;

  service_type?: string | null;

  [key: string]: unknown;
}

export interface PartnerDirectoryParams {
  district?: string;
  state?: string;
  partner_category?: string;
  scheme_id?: string;
}

export interface NearestPartnerParams {
  latitude: number;
  longitude: number;
  radius_km?: number;
  scheme_id?: string;
  loan_category?: string;
  partner_category?: string;
  district?: string;
  state?: string;
  service_type?: string;
}

export const partnerApi = {
  /**
   * Browse partner directory.
   */
  browseDirectory: async (
    params?: PartnerDirectoryParams,
  ): Promise<NearestPartnerResponse[]> => {
    const response = await apiClient.get<NearestPartnerResponse[]>(
      "/partner/directory",
      {
        params,
      },
    );

    return response.data;
  },

  /**
   * Get nearby channel partners.
   *
   * Backend endpoint:
   * GET /partner/nearest
   */
  getNearestPartners: async (
    latitude: number,
    longitude: number,
    radiusKm: number = 100,
    schemeId?: string,
    loanCategory?: string,
    partnerCategory?: string,
    district?: string,
    state?: string,
    serviceType?: string,
  ): Promise<NearestPartnerResponse[]> => {
    const response = await apiClient.get<NearestPartnerResponse[]>(
      "/partner/nearest",
      {
        params: {
          latitude,
          longitude,
          radius_km: radiusKm,
          scheme_id: schemeId,
          loan_category: loanCategory,
          partner_category: partnerCategory,
          district,
          state,
          service_type: serviceType,
        },
      },
    );

    return response.data;
  },

  /**
   * Get partner applications.
   */
  getPartnerApplications: async (params?: {
    status?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedApplicationListResponse> => {
    const response =
      await apiClient.get<PaginatedApplicationListResponse>(
        "/partner/applications",
        {
          params,
        },
      );

    return response.data;
  },

  /**
   * Get partner application detail.
   */
  getPartnerApplicationDetail: async (
    applicationId: string,
  ): Promise<ApplicationResponse> => {
    const response = await apiClient.get<ApplicationResponse>(
      `/partner/applications/${encodeURIComponent(applicationId)}`,
    );

    return response.data;
  },

  /**
   * Start application review.
   */
  startReview: async (applicationId: string) => {
    const response = await apiClient.post(
      `/partner/applications/${encodeURIComponent(applicationId)}/start-review`,
    );

    return response.data;
  },

  /**
   * Approve application.
   */
  approveApplication: async (applicationId: string) => {
    const response = await apiClient.post(
      `/partner/applications/${encodeURIComponent(applicationId)}/approve`,
    );

    return response.data;
  },

  /**
   * Reject application.
   */
  rejectApplication: async (
    applicationId: string,
    reason: string,
  ) => {
    const response = await apiClient.post(
      `/partner/applications/${encodeURIComponent(applicationId)}/reject`,
      {
        decision: "REJECTED",
        reason,
      },
    );

    return response.data;
  },
};