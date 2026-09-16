import axios from "axios";
import { getItem } from "../utils/storage";

const ACCESS_TOKEN_KEY = "yojnasetu_access_token";

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

function normalizeApiBaseUrl(value: string): string {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error(
      `Invalid EXPO_PUBLIC_API_URL: ${value}. Use an absolute http(s) URL.`,
    );
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error(
      `Invalid EXPO_PUBLIC_API_URL protocol: ${parsedUrl.protocol}. Use http or https.`,
    );
  }

  return value.replace(/\/+$/, "");
}

export const API_BASE_URL = configuredApiUrl
  ? normalizeApiBaseUrl(configuredApiUrl)
  : "";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

apiClient.interceptors.request.use(async (config) => {
  if (!API_BASE_URL) {
    throw new Error(
      "API_BASE_URL is not configured. Set EXPO_PUBLIC_API_URL and restart Expo.",
    );
  }

  const token = await getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (__DEV__) {
      console.error("API request failed", {
        baseUrl: API_BASE_URL || "<missing>",
        endpoint: error?.config?.url || "<unknown>",
        method: error?.config?.method?.toUpperCase() || "<unknown>",
        code: error?.code || "<none>",
        hasResponse: Boolean(error?.response),
        status: error?.response?.status,
      });
    }

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
