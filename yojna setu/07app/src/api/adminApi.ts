import { apiClient } from "./client";

export interface AdminDashboardSummary {
  total_schemes?: number;
  verified_schemes?: number;
  total_rules?: number;
  total_documents?: number;
  system_health?: Record<string, unknown>;
  [key: string]: unknown;
}
export const adminApi = {
  getDashboardSummary: async () =>
    (await apiClient.get<AdminDashboardSummary>("/admin/dashboard")).data,
  getSchemeAuditList: async (
    params?: Record<string, string | number | undefined>,
  ) => (await apiClient.get("/admin/schemes", { params })).data,
  getApplications: async (
    params?: Record<string, string | number | undefined>,
  ) => (await apiClient.get("/admin/applications", { params })).data,
  getPartners: async (params?: Record<string, string | number | undefined>) =>
    (await apiClient.get("/admin/partners", { params })).data,
};
