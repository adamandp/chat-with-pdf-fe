"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Check, ChevronUp, Monitor, Moon, Sun, UserRound } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const subscribe = () => () => {};
function useMounted() { return useSyncExternalStore(subscribe, () => true, () => false); }

const themes = [
  { value: "light", name: "Light", icon: Sun },
  { value: "dark", name: "Dark", icon: Moon },
  { value: "system", name: "System", icon: Monitor },
] as const;

/** Demo identity only: no authenticated user profile has been connected yet. */
export function AccountPopover() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  return <Popover>
    <PopoverTrigger aria-label="Account settings" className="sidebar-account-trigger">
      <span className="avatar"><UserRound size={22} /></span>
      <span className="min-w-0 flex-1 truncate text-left"><strong className="block truncate text-sm">Guest workspace</strong><small className="text-muted">Demo account</small></span>
      <ChevronUp size={17} className="shrink-0" />
    </PopoverTrigger>
    <PopoverContent side="top" align="start" sideOffset={10} className="account-popover w-[min(290px,calc(100vw-24px))] border-2 border-black bg-popover p-3 shadow-[4px_5px_0_#111]">
      <div className="flex items-center gap-3">
        <span className="avatar"><UserRound size={22} /></span>
        <div className="min-w-0">
          <strong className="block text-sm">Guest workspace</strong>
          <small className="text-muted">Demo account · Local preferences</small>
        </div>
      </div>
      <div className="my-1 border-t border-border" />
      <strong className="text-sm">Appearance</strong>
      <div role="radiogroup" aria-label="Appearance" className="flex flex-col gap-1">
        {themes.map(({ value, name, icon: Icon }) => <button key={value}
          type="button" role="radio" aria-checked={mounted && theme === value}
          onClick={() => setTheme(value)}
          className={`account-theme-option ${mounted && theme === value ? "selected" : ""}`}>
          <Icon size={17} />
          <span className="flex-1 text-left text-sm font-semibold">{name}</span>
          {mounted && theme === value && <Check size={17} />}
        </button>)}
      </div>
      <small className="text-muted">Theme choice is saved on this device.</small>
    </PopoverContent>
  </Popover>;
}
