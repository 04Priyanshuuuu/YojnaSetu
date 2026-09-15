export interface BeneficiaryProfileInput {
  [key: string]: unknown;
}

export interface ApplicationDocument {
  app_document_id: string;
  document_name: string;
  requirement_type: string;
  condition?: string | null;
  is_uploaded: boolean;
  file_name?: string | null;
  file_size_bytes?: number | null;
  file_url?: string | null;
  uploaded_at?: string | null;
}

export interface ApplicationStatusHistoryItem {
  status: string;
  changed_at?: string | null;
  timestamp?: string | null;
  remarks?: string | null;
  reason?: string | null;
  changed_by?: string | null;
}

export interface ApplicationResponse {
  application_id: string;
  scheme_id: string;
  scheme_name?: string | null;

  status: string;

  created_at: string;
  updated_at: string;

  submitted_at?: string | null;

  documents: ApplicationDocument[];

  profile_snapshot?: {
    loan_category?: string | null;
    sector?: string | null;
    [key: string]: unknown;
  } | null;

  correction_reason?: string | null;
  correction_fields?: string | string[] | null;

  status_history: ApplicationStatusHistoryItem[];

  [key: string]: unknown;
}

export interface PaginatedApplicationListResponse {
  items: ApplicationResponse[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface SubmissionValidationResponse {
  valid?: boolean;
  is_valid?: boolean;
  ready_for_submission?: boolean;
  message?: string | null;
  detail?: string | null;

  missing_documents?: string[];
  missing_fields?: string[];
  errors?: string[];

  [key: string]: unknown;
}