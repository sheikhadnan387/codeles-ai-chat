import { create } from "zustand";
import type { PublicUser, RegisterPayload } from "@/types";
import {
  getMeRequest,
  loginRequest,
  logoutRequest,
  refreshRequest,
  registerRequest,
} from "@/lib/api/auth";

export type AuthStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "unauthenticated";

interface AuthState {
  user: PublicUser | null;
  accessToken: string | null;
  status: AuthStatus;

  setAccessToken: (token: string | null) => void;
  clearAuth: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  /** Attempts to restore a session from the httpOnly refresh cookie. Call once on app load. */
  initialize: () => Promise<void>;
}

// The access token intentionally lives only in memory (not persisted to
// localStorage) — the httpOnly refresh cookie is the durable session, and
// `initialize()` re-derives a fresh access token from it on every app load.
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  status: "idle",

  setAccessToken: (token) => set({ accessToken: token }),

  clearAuth: () => set({ user: null, accessToken: null, status: "unauthenticated" }),

  login: async (email, password) => {
    const data = await loginRequest({ email, password });
    set({ user: data.user, accessToken: data.accessToken, status: "authenticated" });
  },

  register: async (payload) => {
    const data = await registerRequest(payload);
    set({ user: data.user, accessToken: data.accessToken, status: "authenticated" });
  },

  logout: async () => {
    try {
      await logoutRequest();
    } finally {
      set({ user: null, accessToken: null, status: "unauthenticated" });
    }
  },

  initialize: async () => {
    if (get().status === "authenticated" || get().status === "loading") return;
    set({ status: "loading" });
    try {
      const { accessToken } = await refreshRequest();
      set({ accessToken });
      const user = await getMeRequest();
      set({ user, status: "authenticated" });
    } catch {
      set({ user: null, accessToken: null, status: "unauthenticated" });
    }
  },
}));
