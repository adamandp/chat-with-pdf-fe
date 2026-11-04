"use client";

import { useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { ChevronUp, LogIn, LogOut, Moon, Sun, UserPlus, UserRound } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import { AuthDialog } from "./auth-dialog";
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
  const reduceMotion = useReducedMotion();
  const isGuest = !user || user.accountType === "GUEST";
  const dark = mounted && resolvedTheme === "dark";
  const [logoutMode, setLogoutMode] = useState<"current" | "all" | null>(null);
  const [busy, setBusy] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  function openAuth(mode: "login" | "register") {
    setPopoverOpen(false);
    setAuthMode(mode);
  }

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
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger
          aria-label="Account settings"
          title="Account settings"
          className="sidebar-account-trigger"
        >
          <span className="avatar account-avatar">
            <UserRound size={21} />
          </span>
          <span className="account-summary">
            <strong>{isGuest ? "Guest User" : user?.name || user?.username}</strong>
            <small>{isGuest ? "Guest workspace" : `@${user?.username}`}</small>
          </span>
          <ChevronUp size={16} className="account-chevron" />
        </PopoverTrigger>
        <PopoverContent
          side={collapsed ? "right" : "top"}
          align="start"
          sideOffset={10}
          className="account-popover"
        >
          <div className="account-profile">
            <span className="avatar account-avatar">
              <UserRound size={22} />
            </span>
            <span className="account-profile-info">
              <strong>{isGuest ? "Guest User" : user?.name || user?.username}</strong>
              <small>{isGuest ? "Explore without signing in" : `@${user?.username}`}</small>
            </span>
            <span className="account-badge">{isGuest ? "GUEST" : "ACCOUNT"}</span>
          </div>
          <div className="account-section">
            <p className="account-section-label">ACCOUNT INFO</p>
            <dl className="account-details">
              <div>
                <dt>Full name</dt>
                <dd>{isGuest ? "Guest" : user?.name || "—"}</dd>
              </div>
              <div>
                <dt>Username</dt>
                <dd>{isGuest ? "Not registered" : user?.username || "—"}</dd>
              </div>
            </dl>
          </div>
          <div className="account-section account-appearance">
            <p className="account-section-label">APPEARANCE</p>
            <div className="account-setting-row">
              <div className="account-setting-copy">
                <Moon size={18} />
                <strong>Dark mode</strong>
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
                <motion.span
                  className="theme-switch-thumb"
                  initial={false}
                  animate={{ x: dark ? 22 : 0 }}
                  transition={
                    reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 450, damping: 30 }
                  }
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={dark ? "moon" : "sun"}
                      className="theme-switch-glyph"
                      initial={reduceMotion ? false : { opacity: 0, rotate: -45, scale: 0.7 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      exit={reduceMotion ? undefined : { opacity: 0, rotate: 45, scale: 0.7 }}
                      transition={{ duration: reduceMotion ? 0 : 0.15 }}
                    >
                      {dark ? <Moon size={14} /> : <Sun size={14} />}
                    </motion.span>
                  </AnimatePresence>
                </motion.span>
              </button>
            </div>
          </div>
          {isGuest ? (
            <div className="grid gap-2">
              <p className="text-xs text-muted">
                Register to keep your chats and PDFs accessible across devices.
              </p>
              <button className="neo-button pink account-logout" onClick={() => openAuth("register")}>
                <UserPlus size={18} /> Create account
              </button>
              <button className="neo-button account-logout" onClick={() => openAuth("login")}>
                <LogIn size={18} /> Log in
              </button>
            </div>
          ) : (
            <>
              <button className="neo-button account-logout" onClick={() => setLogoutMode("current")}>
                <LogOut size={18} /> Log out
              </button>
              <button className="account-logout-all" onClick={() => setLogoutMode("all")}>
                Log out all devices
              </button>
            </>
          )}
        </PopoverContent>
      </Popover>
      <AuthDialog
        key={authMode || "closed"}
        initialView={authMode || "login"}
        open={Boolean(authMode)}
        onOpenChange={(open) => {
          if (!open) setAuthMode(null);
        }}
      />
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
