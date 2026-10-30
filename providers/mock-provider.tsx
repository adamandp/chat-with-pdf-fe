"use client";

import { useEffect, useState } from "react";
import { initMocks } from "@/mocks";

export function MockProvider({ children, enabled }: { children: React.ReactNode; enabled: boolean }) {
  const [ready, setReady] = useState(!enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let mounted = true;
    initMocks().then(() => { if (mounted) setReady(true); }).catch((cause: unknown) => {
      if (mounted) setError(cause instanceof Error ? cause.message : "Unknown mock error");
    });
    return () => { mounted = false; };
  }, [enabled]);

  if (error) return <div className="p-10 text-red-700" role="alert">Failed to start demo API: {error}</div>;
  if (!ready) return <div className="grid h-dvh place-items-center font-bold">Preparing your workspace…</div>;
  return <>{children}</>;
}
