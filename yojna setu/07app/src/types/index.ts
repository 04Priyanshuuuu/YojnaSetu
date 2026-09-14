// ─── Auth & User ─────────────────────────────────────────────────────────────
export type UserRole = 'BENEFICIARY' | 'PARTNER_USER' | 'PARTNER_ADMIN' | 'SYSTEM_ADMIN';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  profile_complete: boolean;
  preferred_language?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  preferred_language?: string;
}

// ─── Scheme ───────────────────────────────────────────────────────────────────
export interface SchemeRule {
  id: number;
  field_name: string;
  operator: string;
  value: string;
  description?: string;
}

export interface SchemeDocument {
  id: number;
  name: string;
  description: string;
  is_required: boolean;
  file_type?: string;
}

export interface Scheme {
  id: number;
  name: string;
  slug: string;
  description: string;
  ministry: string;
  category: string;
  sub_category?: string;
  benefit_type: string;
  benefit_amount?: number;
  benefit_description: string;
  eligibility_summary: string;
  application_process: string;
  official_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  rules?: SchemeRule[];
  documents?: SchemeDocument[];
  tags?: string[];
}

export interface PaginatedSchemeListResponse {
  items: Scheme[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface FilterOptionsResponse {
  ministries: string[];
  categories: string[];
  benefit_types: string[];
  tags: string[];
}

export interface SchemeFilters {
  q?: string;
  ministry?: string;
  category?: string;
  benefit_type?: string;
  tags?: string[];
  page?: number;
  size?: number;
}

// ─── Profile ──────────────────────────────────────────────────────────────────
export interface BeneficiaryProfileInput {
  age?: number;
  gender?: string;
  state?: string;
  district?: string;
  annual_income?: number;
  occupation?: string;
  education_level?: string;
  caste_category?: string;
  disability_status?: boolean;
  is_minority?: boolean;
  is_bpl?: boolean;
  family_size?: number;
  land_holding_acres?: number;
  has_bank_account?: boolean;
  preferred_language?: string;
  [key: string]: unknown;
}

export interface CitizenProfileResponse {
  id: number;
  user_id: number;
  profile_data: BeneficiaryProfileInput;
  created_at: string;
  updated_at: string;
}

export interface MissingFieldDetail {
  field: string;
  label: string;
  description?: string;
}

export interface ProfileMatchResponse {
  eligible_schemes: RecommendationItem[];
  missing_fields: MissingFieldDetail[];
  profile_completeness: number;
}

// ─── Recommendations ─────────────────────────────────────────────────────────
export interface RecommendationItem {
  scheme: Scheme;
  confidence_score: number;
  match_reasons: string[];
  missing_criteria?: string[];
}

export interface RecommendationResponse {
  recommendations: RecommendationItem[];
  profile_used: BeneficiaryProfileInput;
  query_used?: string;
}

// ─── Financial Calculator ────────────────────────────────────────────────────
export interface AmortizationEntry {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface FinancialCalculationResult {
  loan_amount: number;
  interest_rate: number;
  tenure_months: number;
  emi: number;
  total_payment: number;
  total_interest: number;
  amortization_schedule: AmortizationEntry[];
  subsidy_amount?: number;
  effective_loan_amount?: number;
  scheme_name?: string;
}

// ─── Applications ─────────────────────────────────────────────────────────────
export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'MORE_INFO_NEEDED';

export interface ApplicationDocument {
  id: number;
  document_type_id: number;
  document_name: string;
  file_name: string;
  file_url: string;
  status: string;
  notes?: string;
  uploaded_at: string;
}

export interface StatusHistory {
  id: number;
  status: ApplicationStatus;
  notes?: string;
  changed_at: string;
  changed_by_name?: string;
}

export interface ApplicationResponse {
  id: number;
  application_number: string;
  scheme_id: number;
  scheme_name: string;
  user_id: number;
  status: ApplicationStatus;
  submitted_at?: string;
  updated_at: string;
  created_at: string;
  notes?: string;
  documents?: ApplicationDocument[];
  status_history?: StatusHistory[];
}

export interface PaginatedApplicationResponse {
  items: ApplicationResponse[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// ─── AI ───────────────────────────────────────────────────────────────────────
export interface SourceCitation {
  scheme_id?: number;
  scheme_name?: string;
  snippet?: string;
}

export interface RichCard {
  type: 'scheme_card' | 'info_card';
  title: string;
  body: string;
  action_label?: string;
  action_url?: string;
  scheme_id?: number;
}

export interface AIChatRequest {
  message: string;
  conversation_history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  scheme_id?: number;
  language?: string;
}

export interface AIChatResponse {
  reply: string;
  sources?: SourceCitation[];
  rich_cards?: RichCard[];
  suggested_questions?: string[];
}

// ─── Notifications ────────────────────────────────────────────────────────────
export interface NotificationItem {
  id: number;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationPreference {
  scheme_updates: boolean;
  application_status: boolean;
  new_schemes: boolean;
  system_announcements: boolean;
}

// ─── Saved Schemes ────────────────────────────────────────────────────────────
export interface SavedScheme {
  id: number;
  scheme: Scheme;
  saved_at: string;
  notes?: string;
}

// ─── Partners ─────────────────────────────────────────────────────────────────
export interface Partner {
  id: number;
  name: string;
  organization: string;
  type: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  distance_km?: number;
  schemes_handled?: string[];
  is_verified: boolean;
}

export interface PaginatedPartnerResponse {
  items: Partner[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export interface AdminDashboardStats {
  total_users: number;
  total_schemes: number;
  total_applications: number;
  total_partners: number;
  pending_applications: number;
  approved_applications: number;
}

// ─── API Error ───────────────────────────────────────────────────────────────
export interface APIError {
  detail: string | { msg: string; type: string }[];
  status_code?: number;
}
