import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "@/stores/authStore";

export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

/**
 * Single axios instance every other API module goes through. Attaches the
 * access token from the auth store and transparently refreshes it once on a
 * 401 before retrying the original request, per CONTRACT.md's auth model.
 */
export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;

/**
 * Refreshes the access token via the httpOnly refresh cookie, deduping
 * concurrent callers. Exported so lib/api/messages.ts (which streams over a
 * raw fetch(), outside axios) can apply the same 401-refresh-retry-once
 * behavior CONTRACT.md requires for every protected call.
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ accessToken: string }>(
        `${apiBaseUrl}/auth/refresh`,
        undefined,
        { withCredentials: true },
      )
      .then((response) => {
        useAuthStore.getState().setAccessToken(response.data.accessToken);
        return response.data.accessToken;
      })
      .catch(() => {
        useAuthStore.getState().clearAuth();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableConfig | undefined;
    const status = error.response?.status;
    const isRefreshCall = originalRequest?.url?.includes("/auth/refresh");
    const isAuthCall =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/register");

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isRefreshCall &&
      !isAuthCall
    ) {
      originalRequest._retry = true;
      const newToken = await refreshAccessToken();

      if (newToken) {
        originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
        return apiClient(originalRequest);
      }

      if (typeof window !== "undefined") {
        // This runs outside React (an axios interceptor with no router
        // access), so a hard navigation is the only option here.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

/** Extracts the CONTRACT.md error shape's `message` field (string | string[]). */
export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string | string[] }
      | undefined;
    if (data?.message) {
      return Array.isArray(data.message)
        ? data.message.join(" ")
        : data.message;
    }
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export function isRateLimitError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 429;
}
