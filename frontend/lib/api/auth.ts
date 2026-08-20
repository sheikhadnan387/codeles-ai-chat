import { apiClient } from "./client";
import type {
  AuthResponse,
  ForgotPasswordPayload,
  LoginPayload,
  PublicUser,
  RegisterPayload,
  ResetPasswordPayload,
} from "@/types";

export async function registerRequest(
  payload: RegisterPayload,
): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>(
    "/auth/register",
    payload,
  );
  return data;
}

export async function loginRequest(
  payload: LoginPayload,
): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function refreshRequest(): Promise<{ accessToken: string }> {
  const { data } = await apiClient.post<{ accessToken: string }>(
    "/auth/refresh",
  );
  return data;
}

export async function logoutRequest(): Promise<void> {
  await apiClient.post("/auth/logout");
}

export async function forgotPasswordRequest(
  payload: ForgotPasswordPayload,
): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>(
    "/auth/forgot-password",
    payload,
  );
  return data;
}

export async function resetPasswordRequest(
  payload: ResetPasswordPayload,
): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>(
    "/auth/reset-password",
    payload,
  );
  return data;
}

export async function getMeRequest(): Promise<PublicUser> {
  const { data } = await apiClient.get<PublicUser>("/auth/me");
  return data;
}
