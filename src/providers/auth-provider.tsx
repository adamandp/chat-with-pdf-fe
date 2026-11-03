"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { bootstrapAuth, login, logout, register } from "@/features/auth/auth.api";
import type { AuthUser, LoginCredentials, RegisterInput } from "@/interface/auth.interface";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (input: LoginCredentials) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: (all?: boolean) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    bootstrapAuth().then((result) => {
      if (active) {
        setUser(result);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (input) => {
        const profile = await login(input);
        queryClient.clear();
        setUser(profile);
      },
      register: async (input) => {
        const profile = await register(input);
        queryClient.clear();
        setUser(profile);
      },
      logout: async (all) => {
        try {
          await logout(all);
        } finally {
          queryClient.clear();
          setUser(null);
        }
      },
    }),
    [user, loading, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
