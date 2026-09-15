import { apiClient } from './client';

/**
 * Smart Match / Recommendation API
 *
 * Backend contract:
 * POST /recommend
 *
 * The backend evaluates the supplied citizen profile against
 * the verified government schemes and returns ranked results.
 */

export interface BeneficiaryProfileInput {
  age?: number;
  gender?: string;
  state?: string;
  social_category?: string;
  is_sc?: boolean;
  annual_income?: number;
  applicant_type?: string;
  education_level?: string;
  sector?: string;
  activity_type?: string;
  business_stage?: string;
  is_new_unit?: boolean;
  project_cost?: number;
  requested_loan_amount?: number;

  [key: string]: unknown;
}

export interface MissingFieldDetail {
  field: string;
  label: string;
  [key: string]: unknown;
}

export interface ScoreBreakdownItem {
  dimension: string;
  result:
    | 'MATCH'
    | 'NO_MATCH'
    | 'PARTIAL_MATCH'
    | 'NOT_EVALUATED'
    | string;
  reason?: string;
  score: number;
  max_weight: number;
  [key: string]: unknown;
}

export interface RecommendationItem {
  scheme_id: string;
  scheme_name: string;

  rank?: number;
  score?: number;

  eligibility_status:
    | 'ELIGIBLE'
    | 'INSUFFICIENT_INFORMATION'
    | 'INELIGIBLE'
    | string;

  eligibility_reasons?: string[];
  matched_rules?: string[];
  failed_rules?: string[];
  missing_information?: string[];
  recommendation_reasons?: string[];

  score_breakdown?: ScoreBreakdownItem[];

  ministry?: string;
  application_url?: string | null;
  official_portal?: string | null;
  official_source_url?: string | null;

  is_direct_portal_scheme?: boolean;

  is_credit_scheme?: boolean;
  max_loan_amount?: number | null;
  interest_rate?: number | null;

  financial_category?: string;

  source_document?: string | null;

  [key: string]: unknown;
}

export interface RecommendationResponse {
  evaluated_scheme_count: number;

  eligible_scheme_count: number;
  insufficient_info_scheme_count: number;
  excluded_scheme_count: number;

  recommendations: RecommendationItem[];
  insufficient_info_schemes: RecommendationItem[];
  ineligible_schemes: RecommendationItem[];

  [key: string]: unknown;
}

export const recommendationApi = {
  getRecommendations: async (
    profile: BeneficiaryProfileInput,
    topK: number = 10
  ): Promise<RecommendationResponse> => {
    const response =
      await apiClient.post<RecommendationResponse>(
        '/recommend',
        {
          profile,
          top_k: topK,
        }
      );

    return response.data;
  },
};

export default recommendationApi;