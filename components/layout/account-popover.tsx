"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { ChevronUp, Moon, Sun, UserRound } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const subscribe = () => () => {};
function useMounted() { return useSyncExternalStore(subscribe, () => true, () => false); }

/** Demo identity until authenticated user is connected. */
export function AccountPopover({ collapsed = false }: { collapsed?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const dark = mounted && resolvedTheme === "dark";

  return <Popover>
    <PopoverTrigger aria-label="Account settings" title="Account settings" className="sidebar-account-trigger">
      <span className="avatar account-avatar"><UserRound size={21} /></span>
      <span className="account-summary">
        <strong>Guest workspace</strong>
        <small>Demo account</small>
      </span>
      <ChevronUp size={16} className="account-chevron" />
    </PopoverTrigger>
    <PopoverContent side={collapsed ? "right" : "top"} align="start" sideOffset={10}
      className="account-popover">
      <div className="account-profile">
        <span className="avatar account-avatar"><UserRound size={20} /></span>
        <div className="account-profile-info">
          <strong>Guest workspace</strong>
          <small>Demo account · Local preferences</small>
        </div>
      </div>
      <div className="account-setting-row">
        <div className="account-setting-copy">
          <strong>Dark mode</strong>
          <small>Switch your workspace appearance</small>
        </div>
        <button type="button" role="switch" aria-label="Dark mode" aria-checked={dark}
          disabled={!mounted} onClick={() => setTheme(dark ? "light" : "dark")}
          className={"theme-switch" + (dark ? " is-on" : "")}>
          <span className="theme-switch-thumb">{dark ? <Moon size={14} /> : <Sun size={14} />}</span>
        </button>
      </div>
      <p className="account-hint">Saved on this device</p>
    </PopoverContent>
  </Popover>;
}
