import apiClient from './client';
import type { FinancialCalculationResult } from '@/types';

export interface CalculationRequest {
  loan_amount: number;
  interest_rate: number;
  tenure_months: number;
  scheme_id?: number;
}

export const financialApi = {
  calculate: (data: CalculationRequest) =>
    apiClient.post<FinancialCalculationResult>('/calculator/calculate', data).then((r) => r.data),
};
