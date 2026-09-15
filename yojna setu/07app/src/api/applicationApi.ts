import { apiClient } from './client';

import type {
  ApplicationResponse,
  PaginatedApplicationListResponse,
  BeneficiaryProfileInput,
  SubmissionValidationResponse,
} from '../types';

export interface ApplicationCreatePayload {
  scheme_id: string;
  profile: BeneficiaryProfileInput;
}

export interface ApplicationUpdatePayload {
  profile: BeneficiaryProfileInput;
}

export interface MobileDocumentFile {
  uri: string;
  name: string;
  type?: string | null;
  size?: number;
}

export const applicationApi = {
  /**
   * Create a new application guidance record.
   */
  createApplication: async (
    payload: ApplicationCreatePayload,
  ): Promise<ApplicationResponse> => {
    const response = await apiClient.post<ApplicationResponse>(
      '/applications',
      payload,
    );

    return response.data;
  },

  /**
   * Get current user's application/guidance records.
   */
  getMyApplications: async (
    status?: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<PaginatedApplicationListResponse> => {
    const response =
      await apiClient.get<PaginatedApplicationListResponse>(
        '/applications',
        {
          params: {
            status: status || undefined,
            page,
            page_size: pageSize,
          },
        },
      );

    return response.data;
  },

  /**
   * Get one application/guidance record by ID.
   */
  getApplicationById: async (
    applicationId: string,
  ): Promise<ApplicationResponse> => {
    const response = await apiClient.get<ApplicationResponse>(
      `/applications/${encodeURIComponent(applicationId)}`,
    );

    return response.data;
  },

  /**
   * Update a draft application.
   */
  updateDraftApplication: async (
    applicationId: string,
    payload: ApplicationUpdatePayload,
  ): Promise<ApplicationResponse> => {
    const response = await apiClient.put<ApplicationResponse>(
      `/applications/${encodeURIComponent(applicationId)}`,
      payload,
    );

    return response.data;
  },

  /**
   * Upload a document from the native mobile document picker.
   *
   * React Native does not use the browser File API.
   * The file is represented using uri/name/type.
   */
  uploadDocument: async (
    applicationId: string,
    appDocumentId: string,
    file: MobileDocumentFile,
  ): Promise<unknown> => {
    const formData = new FormData();

    formData.append(
      'file',
      {
        uri: file.uri,
        name: file.name,
        type: file.type || 'application/octet-stream',
      } as unknown as Blob,
    );

    const response = await apiClient.post(
      `/applications/${encodeURIComponent(
        applicationId,
      )}/documents/${encodeURIComponent(appDocumentId)}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    return response.data;
  },

  /**
   * Validate whether an application is ready for submission.
   */
  validateSubmission: async (
    applicationId: string,
  ): Promise<SubmissionValidationResponse> => {
    const response =
      await apiClient.get<SubmissionValidationResponse>(
        `/applications/${encodeURIComponent(applicationId)}/validate`,
      );

    return response.data;
  },

  /**
   * Submit application to a selected channel partner.
   */
  submitApplication: async (
    applicationId: string,
    partnerId: string,
  ): Promise<ApplicationResponse> => {
    const response = await apiClient.post<ApplicationResponse>(
      `/applications/${encodeURIComponent(applicationId)}/submit`,
      {
        partner_id: partnerId,
      },
    );

    return response.data;
  },

  /**
   * Withdraw an application.
   */
  withdrawApplication: async (
    applicationId: string,
    reason?: string,
  ): Promise<ApplicationResponse> => {
    const response = await apiClient.post<ApplicationResponse>(
      `/applications/${encodeURIComponent(applicationId)}/withdraw`,
      {
        reason: reason?.trim() || undefined,
      },
    );

    return response.data;
  },
};