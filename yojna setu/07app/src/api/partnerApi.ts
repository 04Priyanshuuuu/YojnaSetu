import { apiClient } from "./client";

import type {
  ApplicationResponse,
  PaginatedApplicationListResponse,
} from "../types/application";

export interface PartnerData {
  partner_id: string;
  name: string;

  code?: string | null;

  partner_type?: string | null;
  partner_sub_type?: string | null;

  institution_type?: string | null;

  partner_category?: string | null;

  address?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;

  phone?: string | null;
  email?: string | null;
  website?: string | null;

  service_type?: string | null;

  last_verified_date?: string | null;

  scheme_authorization_level?: string | null;
  coordinates_status?: string | null;

  source_url?: string | null;

  latitude?: number | null;
  longitude?: number | null;

  npa_percentage?: number | null;
  overdue_percentage?: number | null;

  is_accepting_applications?: boolean;
  is_active?: boolean;

  is_scheme_matched?: boolean;
  is_authorized?: boolean;

  verification_status?: string | null;

  supported_schemes?: string[];

  created_at?: string | null;

  [key: string]: unknown;
}

export interface NearestPartnerResponse {
  partner: PartnerData;

  distance_km?: number | null;

  is_scheme_matched?: boolean;

  partner_category?: string | null;

  supported_schemes?: string[];

  service_type?: string | null;

  authorization_level?: string | null;

  scheme_authorized_category?: string | null;

  scheme_mapping_notes?: string | null;

  suitability_reason?: string | null;

  lending_capacity_status?: string | null;

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
  browseDirectory: async (
    params?: PartnerDirectoryParams,
  ): Promise<NearestPartnerResponse[]> => {
    const response =
      await apiClient.get<NearestPartnerResponse[]>(
        "/partner/directory",
        {
          params,
        },
      );

    return response.data;
  },

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
    const response =
      await apiClient.get<NearestPartnerResponse[]>(
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

  getPartnerApplicationDetail: async (
    applicationId: string,
  ): Promise<ApplicationResponse> => {
    const response =
      await apiClient.get<ApplicationResponse>(
        `/partner/applications/${encodeURIComponent(
          applicationId,
        )}`,
      );

    return response.data;
  },

  startReview: async (
    applicationId: string,
  ) => {
    const response = await apiClient.post(
      `/partner/applications/${encodeURIComponent(
        applicationId,
      )}/start-review`,
    );

    return response.data;
  },

  approveApplication: async (
    applicationId: string,
  ) => {
    const response = await apiClient.post(
      `/partner/applications/${encodeURIComponent(
        applicationId,
      )}/approve`,
    );

    return response.data;
  },

  checkApprovalReadiness: async (
    applicationId: string,
  ) => {
    const response = await apiClient.get(
      `/partner/applications/${encodeURIComponent(
        applicationId,
      )}/approval-readiness`,
    );

    return response.data;
  },

  reviewDocument: async (
    applicationId: string,
    documentId: string,
    payload: {
      verification_status:
        | "VERIFIED"
        | "REJECTED";
      reason?: string;
    },
  ) => {
    const response = await apiClient.post(
      `/partner/applications/${encodeURIComponent(
        applicationId,
      )}/documents/${encodeURIComponent(
        documentId,
      )}/review`,
      payload,
    );

    return response.data;
  },

  addReviewNote: async (
    applicationId: string,
    content: string,
  ) => {
    const response = await apiClient.post(
      `/partner/applications/${encodeURIComponent(
        applicationId,
      )}/notes`,
      {
        content,
      },
    );

    return response.data;
  },

  processReviewDecision: async (
    applicationId: string,
    payload: {
      decision: "APPROVED" | "REJECTED";
      reason?: string;
    },
  ) => {
    const response =
      await apiClient.post<ApplicationResponse>(
        `/partner/applications/${encodeURIComponent(
          applicationId,
        )}/review`,
        payload,
      );

    return response.data;
  },

  requestCorrection: async (
    applicationId: string,
    payload: {
      reason: string;
      correction_fields?: string[];
    },
  ) => {
    const response =
      await apiClient.post<ApplicationResponse>(
        `/partner/applications/${encodeURIComponent(
          applicationId,
        )}/request-correction`,
        payload,
      );

    return response.data;
  },

  completeApplication: async (
    applicationId: string,
    notes?: string,
  ): Promise<ApplicationResponse> => {
    const response =
      await apiClient.post<ApplicationResponse>(
        `/partner/applications/${encodeURIComponent(
          applicationId,
        )}/complete`,
        null,
        {
          params: {
            notes,
          },
        },
      );

    return response.data;
  },

  rejectApplication: async (
    applicationId: string,
    reason: string,
  ): Promise<ApplicationResponse> => {
    const response =
      await apiClient.post<ApplicationResponse>(
        `/partner/applications/${encodeURIComponent(
          applicationId,
        )}/reject`,
        {
          decision: "REJECTED",
          reason,
        },
      );

    return response.data;
  },
};