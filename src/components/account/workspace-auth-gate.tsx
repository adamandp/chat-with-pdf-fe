"use client";

import { useAuth } from "@/providers/auth-provider";
import { AuthDialog } from "./auth-dialog";

export function WorkspaceAuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="grid min-h-dvh place-items-center font-bold">Checking your session…</div>
    );
  if (!user) return <AuthDialog />;
  return <>{children}</>;
}
