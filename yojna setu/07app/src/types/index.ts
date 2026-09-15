import type { ApplicationStatusHistoryItem } from "./application";

export interface SchemeRule {
  rule_id: string;
  scheme_id: string;
  field: string;
  operator: string;
  value: string;
  value_type: string;
  rule_type: string;
  priority: number;
  condition_group?: string | null;
  error_message?: string | null;
  description?: string | null;
}

export interface SchemeDocument {
  document_id: string;
  scheme_id: string;
  document_name: string;
  requirement_type: string;
  condition?: string | null;
  applicant_type?: string | null;
  source_document?: string | null;
  source_page?: string | null;
  source_section?: string | null;
  active: boolean;
}

export interface SchemeVerification {
  verification_id: string;
  scheme_id: string;
  source_name: string;
  source_url?: string | null;
  verified_by?: string | null;
  status: string;
}

export interface Scheme {
  scheme_id: string;
  scheme_name: string;
  scheme_code?: string | null;
  ministry?: string | null;
  implementing_agency?: string | null;
  scheme_type?: string | null;
  sector?: string | null;
  objective?: string | null;
  target_groups?: string | null;
  applicant_types?: string | null;
  marginalized_group?: string | null;
  sc_required?: string | null;
  business_stage?: string | null;
  activity_type?: string | null;
  support_type?: string | null;
  new_business_allowed?: string | null;
  existing_business_allowed?: string | null;
  state_restriction?: string | null;
  state_coverage?: string | null;
  min_age?: number | null;
  max_age?: number | null;
  loan_available?: string | null;
  min_loan_amount?: number | null;
  max_loan_amount?: number | null;
  max_project_cost?: number | null;
  max_subsidy_amount?: number | null;
  subsidy_percentage?: number | null;
  financing_percentage?: number | null;
  interest_rate?: number | null;
  interest_rate_min?: number | null;
  interest_rate_max?: number | null;
  benefit_description?: string | null;
  repayment_period_months?: number | null;
  moratorium_period_months?: number | null;
  collateral_required?: string | null;
  application_mode?: string | null;
  application_route?: string | null;
  partner_count?: number | null;
  application_steps?: string | null;
  required_documents?: string | null;
  application_url?: string | null;
  official_portal?: string | null;
  official_source_url?: string | null;
  short_description?: string | null;
  purpose?: string | null;
  target_beneficiary?: string | null;
  max_loan_amount_raw?: string | null;
  financial_category?: string | null;
  is_credit_scheme?: boolean;
  calculator_applicable?: boolean;
  financial_assistance_summary?: string | null;
  grant_amount?: number | null;
  repayment_period_max_months?: number | null;
  verification_status: string;
  documents?: SchemeDocument[];
}

export interface PaginatedSchemeListResponse {
  items: Scheme[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface FilterOptionItem {
  label: string;
  value: string;
  count: number;
}

export interface FilterOptionsResponse {
  ministries: FilterOptionItem[];
  sectors: FilterOptionItem[];
  financial_types: FilterOptionItem[];
  beneficiary_categories: FilterOptionItem[];
  states: FilterOptionItem[];
  application_routes: FilterOptionItem[];
  total_schemes: number;
}

export type {
  BeneficiaryProfileInput,
  ApplicationDocument,
  ApplicationStatusHistoryItem,
  ApplicationResponse,
  PaginatedApplicationListResponse,
  SubmissionValidationResponse,
} from "./application";

export type ApplicationStatus = string;

export type StatusHistory = ApplicationStatusHistoryItem & {
  new_status?: string | null;
  created_at?: string | null;
};

export interface ScoreDimensionBreakdown {
  dimension: string;
  result: "MATCH" | "NO_MATCH" | "PARTIAL_MATCH" | "NOT_EVALUATED" | string;
  reason?: string;
  score: number;
  max_weight: number;
  [key: string]: unknown;
}

export interface NotificationItem {
  notification_id: string;
  user_id?: string | null;

  title: string;
  message: string;

  notification_type?: string | null;

  priority: string;

  is_read: boolean;

  channel: string;

  application_id?: string | null;

  metadata_json?: string | null;

  created_at: string;

  updated_at?: string | null;
}

export interface PaginatedNotificationListResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
  unread_count: number;
}

export interface NotificationPreference {
  user_id?: string | null;

  in_app_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  push_enabled: boolean;

  updated_at?: string | null;
}

export interface SchemePersonalizedEligibility {
  status: "ELIGIBLE" | "INSUFFICIENT_INFORMATION" | "INELIGIBLE";
  reasons: string[];
  missing_fields: string[];
}

export interface SchemeComparisonItem {
  scheme: Scheme;
  personalized_eligibility?: SchemePersonalizedEligibility | null;
}

export interface SchemeComparisonResponse {
  compared_schemes: SchemeComparisonItem[];
  invalid_ids: string[];
}
