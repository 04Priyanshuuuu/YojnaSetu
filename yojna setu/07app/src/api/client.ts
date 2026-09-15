import axios from "axios";
import { getItem } from "../utils/storage";

const ACCESS_TOKEN_KEY = "yojnasetu_access_token";

/**
 * Expo environment variable:
 *
 * EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:8000/api/v1
 *
 * Android Emulator fallback:
 * 10.0.2.2 points to the development computer's localhost.
 *
 * If your backend runs on another port, change the fallback below
 * or preferably define EXPO_PUBLIC_API_URL.
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "http://10.0.2.2:8000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = "An unexpected server error occurred.";

    if (error?.response) {
      const data = error.response.data;

      if (data?.error?.message) {
        message = data.error.message;
      } else if (typeof data?.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data?.detail)) {
        message = data.detail
          .map((item: any) => item?.msg || item?.message)
          .filter(Boolean)
          .join("; ");
      } else if (error?.response?.status === 401) {
        message = "Your session has expired. Please login again.";
      } else if (error?.response?.status) {
        message = `Server error (${error.response.status}).`;
      }
    } else if (error?.request) {
      message =
        "Network Error: Backend service is currently unavailable. Please check your connection and try again.";
    } else if (error?.message) {
      message = error.message;
    }

    error.userFriendlyMessage = message;

    return Promise.reject(error);
  },
);

export default apiClient;
