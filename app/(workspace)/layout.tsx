import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileViewportSync } from "@/components/layout/mobile-viewport-sync";

/** Persistent application shell: every workspace route shares this one sidebar. */
export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <MobileViewportSync />
      <AppSidebar />
      <main className="workspace-main" id="main-content">{children}</main>
    </div>
  );
}
