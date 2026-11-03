"use client";

import { useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { ChevronUp, LogOut, Moon, Sun, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const subscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export function AccountPopover({ collapsed = false }: { collapsed?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const mounted = useMounted();
  const dark = mounted && resolvedTheme === "dark";
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutMode, setLogoutMode] = useState<"current" | "all" | null>(null);
  const [busy, setBusy] = useState(false);

  async function confirmLogout() {
    if (!logoutMode) return;
    setBusy(true);
    try {
      await logout(logoutMode === "all");
      toast.success("Logged out");
    } catch {
      toast.error("Server could not confirm logout. Local session cleared.");
    } finally {
      setBusy(false);
      setLogoutMode(null);
    }
  }

  return (
    <>
      <Popover>
        <PopoverTrigger
          aria-label="Account settings"
          title="Account settings"
          className="sidebar-account-trigger"
        >
          <span className="avatar account-avatar">
            <UserRound size={21} />
          </span>
          <span className="account-summary">
            <strong>{user?.name || user?.username || "Account"}</strong>
            <small>@{user?.username}</small>
          </span>
          <ChevronUp size={16} className="account-chevron" />
        </PopoverTrigger>
        <PopoverContent
          side={collapsed ? "right" : "top"}
          align="start"
          sideOffset={10}
          className="account-popover"
        >
          <button className="account-profile w-full text-left" onClick={() => setProfileOpen(true)}>
            <span className="avatar account-avatar">
              <UserRound size={20} />
            </span>
            <span className="account-profile-info">
              <strong>{user?.name || user?.username}</strong>
              <small>View account</small>
            </span>
          </button>
          <div className="account-setting-row">
            <div className="account-setting-copy">
              <strong>Dark mode</strong>
              <small>Switch your workspace appearance</small>
            </div>
            <button
              type="button"
              role="switch"
              aria-label="Dark mode"
              aria-checked={dark}
              disabled={!mounted}
              onClick={() => setTheme(dark ? "light" : "dark")}
              className={"theme-switch" + (dark ? " is-on" : "")}
            >
              <span className="theme-switch-thumb">
                {dark ? <Moon size={14} /> : <Sun size={14} />}
              </span>
            </button>
          </div>
          <button
            className="account-setting-row w-full text-left"
            onClick={() => setLogoutMode("current")}
          >
            <span className="flex items-center gap-2 font-bold">
              <LogOut size={18} /> Logout
            </span>
          </button>
          <button
            className="account-setting-row w-full text-left"
            onClick={() => setLogoutMode("all")}
          >
            <span className="flex items-center gap-2 font-bold">
              <LogOut size={18} /> Logout all sessions
            </span>
          </button>
        </PopoverContent>
      </Popover>
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="neo-card border-2 border-black bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Account</DialogTitle>
            <DialogDescription>Your account details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <span className="text-xs text-muted">Name</span>
              <p className="border-b py-2 font-bold">{user?.name || "—"}</p>
            </div>
            <div>
              <span className="text-xs text-muted">Username</span>
              <p className="border-b py-2 font-bold">{user?.username}</p>
            </div>
            <div>
              <span className="text-xs text-muted">User ID</span>
              <p className="break-all border-b py-2 font-mono text-xs">{user?.id}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(logoutMode)}
        onOpenChange={(open) => {
          if (!open) setLogoutMode(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="neo-card rounded-3xl border-2 border-black bg-white p-6"
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Log out?</DialogTitle>
            <DialogDescription>
              {logoutMode === "all"
                ? "This also signs out your other devices."
                : "You can log in again anytime."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <button
              className="neo-button px-4 py-2"
              disabled={busy}
              onClick={() => setLogoutMode(null)}
            >
              Cancel
            </button>
            <button className="neo-button pink px-4 py-2" disabled={busy} onClick={confirmLogout}>
              {busy ? "Logging out…" : "Logout"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
