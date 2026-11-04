"use client";

export function WorkspaceAuthGate({ children }: { children: React.ReactNode }) {
  // A workspace visit is public. A guest is created only on first send/upload.
  return <>{children}</>;
}
