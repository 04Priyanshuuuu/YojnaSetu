import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';

export const TOKEN_KEY = 'yojnasetu_access_token';
export const USER_KEY = 'yojnasetu_user';
export const LANGUAGE_KEY = 'yojnasetu_language';
export const COMPARE_KEY = 'yojnasetu_compare_ids';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Request interceptor: attach JWT ─────────────────────────────────────────
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // SecureStore unavailable (web/simulator without native) - continue without token
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor: handle 401 ────────────────────────────────────────
// We use a simple event emitter pattern so AuthContext can subscribe
const authListeners: Array<() => void> = [];
export function onAuthExpired(cb: () => void) {
  authListeners.push(cb);
  return () => {
    const i = authListeners.indexOf(cb);
    if (i !== -1) authListeners.splice(i, 1);
  };
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      authListeners.forEach((cb) => cb());
    }
    return Promise.reject(error);
  },
);

export default apiClient;
