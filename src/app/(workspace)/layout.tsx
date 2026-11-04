import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { MobileViewportSync } from "@/components/layout/mobile-viewport-sync";
import { WorkspaceAuthGate } from "@/components/account/workspace-auth-gate";

/** Persistent application shell: every workspace route shares this one sidebar. */
export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceAuthGate>
      <div className="app-shell">
        <MobileViewportSync />
        <AppSidebar />
        <main className="workspace-main" id="main-content">
          {children}
        </main>
      </div>
    </WorkspaceAuthGate>
  );
}
