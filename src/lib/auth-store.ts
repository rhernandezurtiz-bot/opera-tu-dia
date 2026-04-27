import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  email: string;
  name?: string;
}

interface AuthState {
  user: AuthUser | null;
  onboarded: boolean;
  login: (email: string, name?: string) => void;
  logout: () => void;
  completeOnboarding: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      onboarded: false,
      login: (email, name) => set({ user: { email, name } }),
      logout: () => set({ user: null }),
      completeOnboarding: () => set({ onboarded: true }),
    }),
    { name: "operia-auth-v1" },
  ),
);
