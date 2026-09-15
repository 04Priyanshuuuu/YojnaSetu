import { apiClient } from "./client";

export type AuthRole =
  | "BENEFICIARY"
  | "PARTNER_USER"
  | "PARTNER_ADMIN"
  | "SYSTEM_ADMIN";

export interface User {
  id?: string | number;
  user_id?: string | number;
  email?: string | null;
  phone?: string | null;
  username?: string | null;
  full_name?: string | null;
  name?: string | null;
  role: AuthRole;
  is_active?: boolean;
  [key: string]: unknown;
}

export interface LoginRequest {
  identifier?: string;
  username?: string;
  password: string;
}

export interface RegisterRequest {
  email?: string;
  phone?: string;
  password: string;
  [key: string]: unknown;
}

export interface TokenResponse {
  access_token: string;
  token_type?: string;
  user: User;
}

export interface CitizenProfileResponse {
  [key: string]: unknown;
}

export interface BeneficiaryProfileInput {
  [key: string]: unknown;
}

export const authApi = {
  login: async (
    credentials: LoginRequest
  ): Promise<TokenResponse> => {
    const payload = {
      identifier:
        credentials.identifier || credentials.username,
      password: credentials.password,
    };

    const response = await apiClient.post<TokenResponse>(
      "/auth/login",
      payload
    );

    return response.data;
  },

  register: async (
    payload: RegisterRequest
  ): Promise<User> => {
    const response = await apiClient.post<User>(
      "/auth/register",
      payload
    );

    return response.data;
  },

  loginWithGoogle: async (
    idToken: string,
    preferredLanguage?: string
  ): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>(
      "/auth/google",
      {
        id_token: idToken,
        preferred_language:
          preferredLanguage || "en",
      }
    );

    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>(
      "/auth/me"
    );

    return response.data;
  },

  getProfile: async (): Promise<CitizenProfileResponse> => {
    const response =
      await apiClient.get<CitizenProfileResponse>(
        "/auth/profile"
      );

    return response.data;
  },

  updateProfile: async (
    profile: BeneficiaryProfileInput
  ): Promise<CitizenProfileResponse> => {
    const response =
      await apiClient.put<CitizenProfileResponse>(
        "/auth/profile",
        profile
      );

    return response.data;
  },
};