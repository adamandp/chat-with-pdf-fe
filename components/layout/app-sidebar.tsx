"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FileText, MessageSquare, Menu, PanelLeftClose, PanelLeftOpen, Plus, Search, Trash2, X } from "lucide-react";
import { AccountPopover } from "./account-popover";
import { ChatPdfLogo } from "@/components/brand/chat-pdf-logo";
import { SidebarSessionRow } from "./sidebar-session-row";
import { useChatDrafts } from "@/features/chat/store/chat-drafts";
import { usePinnedSessions } from "@/features/sessions/hooks/use-pinned-sessions";
import { toast } from "sonner";
import { useSessions } from "@/services/sessions/session.query";
import { useDeleteSession, useRenameSession, useForkSession } from "@/services/sessions/session.mutation";
import type { Session } from "@/features/common/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  useEffect(() => {
    try { setDesktopCollapsed(window.localStorage.getItem("chat-with-pdf:sidebar-collapsed") === "true"); } catch { /* disabled storage */ }
  }, []);
  function toggleDesktopSidebar() {
    setDesktopCollapsed((current) => {
      try { window.localStorage.setItem("chat-with-pdf:sidebar-collapsed", String(!current)); } catch { /* disabled storage */ }
      return !current;
    });
  }
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(false);
  const { pinnedIds, togglePinned } = usePinnedSessions();
  const drafts = useChatDrafts();
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const touchStart = useRef<number | null>(null);
  const { data: sessions = [] } = useSessions(false, search);
  const rename = useRenameSession();
  const remove = useDeleteSession();
  const fork = useForkSession();
  const activeSession = pathname.startsWith("/chats/") ? pathname.split("/")[2] : null;
  const pinned = sessions.filter((session) => pinnedIds.includes(session.id));
  const recent = sessions.filter((session) => !pinnedIds.includes(session.id));

  function saveRename() {
    if (!renameId || !renameValue.trim()) return;
    rename.mutate({ id: renameId, title: renameValue.trim() }, {
      onSuccess: () => { toast.success("Chat renamed"); setRenameId(null); },
      onError: () => toast.error("Unable to rename chat"),
    });
  }
  function deleteChat() {
    if (!deleteId) return;
    remove.mutate({ id: deleteId, permanent: false }, {
      onSuccess: () => {
        toast.success("Chat moved to Trash");
        if (activeSession === deleteId) router.push("/");
        setDeleteId(null);
      },
      onError: () => toast.error("Unable to delete chat"),
    });
  }
  function renderSession(session: Session) {
    return <SidebarSessionRow key={session.id} session={session}
      pinned={pinnedIds.includes(session.id)} active={session.id === activeSession}
      hasDraft={Boolean(drafts[session.id])} onNavigate={() => setMobileOpen(false)}
      onPin={() => togglePinned(session.id)}
      onRename={() => { setRenameId(session.id); setRenameValue(session.title); }}
      onDelete={() => setDeleteId(session.id)}
      onFork={() => fork.mutate({ id: session.id }, {
        onSuccess: (created) => { toast.success("Chat forked"); setMobileOpen(false); router.push(`/chats/${created.id}`); },
        onError: () => toast.error("Could not fork chat"),
      })}
    />;
  }
  return <>
    <div className="mobile-topbar">
      <button className="neo-button mobile-nav-trigger" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={21} /></button>
      <span className="mobile-title"><ChatPdfLogo size={29} /> Chat with PDF</span>
      <Link className="neo-button mobile-new-chat" href="/" aria-label="New Chat"><Plus size={21} /></Link>
    </div>
    {mobileOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <aside className={`sidebar ${mobileOpen ? "mobile-visible" : ""} ${desktopCollapsed ? "desktop-collapsed" : ""}`} aria-label="Main navigation"
      onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => { if (touchStart.current !== null && touchStart.current - (event.changedTouches[0]?.clientX ?? touchStart.current) > 70) setMobileOpen(false); touchStart.current = null; }}>
      <div className="sidebar-body">
        <div className="brand">
          <ChatPdfLogo size={46} className="sidebar-brand-logo" />
          <span className="sidebar-brand-title">Chat with PDF</span>
          <button className="sidebar-desktop-toggle" type="button" onClick={toggleDesktopSidebar}
            aria-label={desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {desktopCollapsed ? <PanelLeftOpen size={21} /> : <PanelLeftClose size={21} />}
          </button>
          <button className="ml-auto icon-button mobile-close" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X size={20} /></button>
        </div>
        <Link href="/" title="New Chat" onClick={() => setMobileOpen(false)} className="neo-button pink sidebar-create-chat"><Plus size={21} strokeWidth={3} /><span className="sidebar-text">New Chat</span>{drafts.new && <span className="sidebar-draft-dot ml-auto" role="img" aria-label="New chat has unsent draft" />}</Link>
        <nav className="flex flex-col gap-1" aria-label="Workspace">
          <Link href="/" onClick={() => setMobileOpen(false)} className={`nav-link ${pathname === "/" || pathname.startsWith("/chats") ? "active" : ""}`}><MessageSquare size={21} /><span className="sidebar-text">Chats</span></Link>
          <Link href="/documents" onClick={() => setMobileOpen(false)} className={`nav-link ${pathname === "/documents" ? "active" : ""}`}><FileText size={21} /><span className="sidebar-text">Documents</span></Link>
          <Link href="/trash" onClick={() => setMobileOpen(false)} className={`nav-link ${pathname === "/trash" ? "active" : ""}`}><Trash2 size={21} /><span className="sidebar-text">Trash</span></Link>
        </nav>
        <div className="sidebar-divider sidebar-collapse-hide" />
        <label className="sidebar-search sidebar-collapse-hide"><Search size={18} className="text-muted" />
          <input ref={searchRef} aria-label="Search recent chats" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search chats..." />
        </label>
        {pinned.length > 0 && <section aria-label="Pinned chats" className="mt-4 sidebar-collapse-hide">
          <h2 className="sidebar-section-title">Pinned</h2>
          {pinned.map(renderSession)}
        </section>}
        <section aria-label="Recent chats" className="mt-4 sidebar-collapse-hide">
          <h2 className="sidebar-section-title">Recents</h2>
          {recent.slice(0, expanded ? undefined : 6).map(renderSession)}
          {!recent.length && <p className="px-2 py-4 text-sm text-muted">No matching chats</p>}
          {recent.length > 6 && <button className="mt-2 px-2 text-sm font-bold hover:underline" onClick={() => setExpanded(!expanded)}>{expanded ? "See Less" : "See All"}</button>}
        </section>
      </div>
      <div className="sidebar-footer"><AccountPopover collapsed={desktopCollapsed} /></div>
    </aside>
    <Dialog open={Boolean(renameId)} onOpenChange={(open) => { if (!open) setRenameId(null); }}>
      <DialogContent className="neo-card neo-dialog-compact bg-white p-5"><DialogHeader><DialogTitle>Rename Chat</DialogTitle><DialogDescription>Choose a descriptive title for this conversation.</DialogDescription></DialogHeader>
        <input autoFocus className="neo-dialog-input rounded-md border-2 border-black px-3 py-2" aria-label="Chat title" value={renameValue} onChange={(event) => setRenameValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") saveRename(); }} />
        <DialogFooter><button className="neo-button bg-white px-4 py-2 text-sm" onClick={() => setRenameId(null)}>Cancel</button><button className="neo-button blue px-4 py-2 text-sm" disabled={!renameValue.trim() || rename.isPending} onClick={saveRename}>Save</button></DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog open={Boolean(deleteId)} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
      <DialogContent className="neo-card neo-dialog-compact bg-white p-5"><DialogHeader><DialogTitle>Move chat to Trash?</DialogTitle><DialogDescription>You can restore it later from the Trash page.</DialogDescription></DialogHeader>
        <DialogFooter><button className="neo-button bg-white px-4 py-2 text-sm" onClick={() => setDeleteId(null)}>Cancel</button><button onClick={deleteChat} disabled={remove.isPending} className="neo-button pink px-4 py-2 text-sm">Move to Trash</button></DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
