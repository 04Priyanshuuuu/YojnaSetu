import { apiClient } from './client';

export interface FinancialCalculationResult {
  emi?: number | null;
  monthly_emi?: number | null;

  total_interest?: number | null;
  total_repayment?: number | null;

  subsidy_amount?: number | null;
  beneficiary_contribution_amount?: number | null;

  principal_amount?: number | null;
  interest_amount?: number | null;

  [key: string]: unknown;
}

export interface FinancialCalculateRequest {
  scheme_id: string;
  project_cost?: number | null;
  requested_loan_amount?: number | null;
  interest_rate?: number | null;
  repayment_period_months?: number | null;
  repayment_frequency?: string | null;
}

export const financialApi = {
  calculate: async (
    payload: FinancialCalculateRequest
  ): Promise<FinancialCalculationResult> => {
    const response =
      await apiClient.post<FinancialCalculationResult>(
        '/calculator/calculate',
        payload
      );

    return response.data;
  },
};