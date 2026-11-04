"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  bootstrapAuth,
  createGuest,
  getProfile,
  login,
  logout,
  register,
} from "@/features/auth/auth.api";
import { getAccessToken, refreshAccessToken } from "@/lib/axios";
import type { AuthUser, LoginCredentials, RegisterInput } from "@/interface/auth.interface";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  ensureSession: () => Promise<void>;
  login: (input: LoginCredentials) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: (all?: boolean) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const bootstrapRef = useRef<Promise<AuthUser | null> | null>(null);
  const bootstrappedRef = useRef(false);
  const ensuringRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    let active = true;
    const pending = bootstrapAuth();
    bootstrapRef.current = pending;
    void pending
      .then((result) => {
        bootstrappedRef.current = true;
        if (active) setUser(result);
      })
      .catch(() => {
        // Keep browsing possible when the API is temporarily unavailable.
        bootstrappedRef.current = false;
      })
      .finally(() => {
        bootstrapRef.current = null;
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const ensureSession = useCallback(async (): Promise<void> => {
    if (bootstrapRef.current) {
      try {
        await bootstrapRef.current;
      } catch {
        // A failed bootstrap may be retried on the user's first action.
      }
    }
    if (getAccessToken() && bootstrappedRef.current) return;

    ensuringRef.current ??= (async () => {
      // A refresh can succeed while the profile request fails. Retry the
      // profile instead of leaving the UI anonymous behind a valid token.
      if (getAccessToken()) {
        setUser(await getProfile());
        bootstrappedRef.current = true;
        return;
      }
      // Retry a failed initial bootstrap, but don't repeat a known 401 refresh.
      if (!bootstrappedRef.current) {
        const token = await refreshAccessToken();
        if (token) {
          setUser(await getProfile());
          bootstrappedRef.current = true;
          return;
        }
      }
      const profile = await createGuest();
      queryClient.clear();
      setUser(profile);
      bootstrappedRef.current = true;
    })().finally(() => {
      ensuringRef.current = null;
    });

    return ensuringRef.current;
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      ensureSession,
      login: async (input) => {
        if (ensuringRef.current) await ensuringRef.current;
        const profile = await login(input);
        queryClient.clear();
        setUser(profile);
        bootstrappedRef.current = true;
      },
      register: async (input) => {
        if (ensuringRef.current) await ensuringRef.current;
        const profile = await register(input);
        queryClient.clear();
        setUser(profile);
        bootstrappedRef.current = true;
      },
      logout: async (all) => {
        try {
          await logout(all);
        } finally {
          queryClient.clear();
          setUser(null);
          bootstrappedRef.current = true;
        }
      },
    }),
    [user, loading, queryClient, ensureSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
