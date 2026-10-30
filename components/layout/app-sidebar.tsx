"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FileText, MessageSquare, Menu, Plus, Search, Settings, Trash2, UserRound, X } from "lucide-react";
import { ChatPdfLogo } from "@/components/brand/chat-pdf-logo";
import { SidebarSessionRow } from "./sidebar-session-row";
import { useChatDrafts } from "@/features/chat/store/chat-drafts";
import { usePinnedSessions } from "@/features/sessions/hooks/use-pinned-sessions";
import { toast } from "sonner";
import { useSessions } from "@/services/sessions/session.query";
import { useDeleteSession, useRenameSession } from "@/services/sessions/session.mutation";
import type { Session } from "@/features/common/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
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
    />;
  }
  return <>
    <div className="mobile-topbar">
      <button className="neo-button mobile-nav-trigger" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={21} /></button>
      <span className="mobile-title"><ChatPdfLogo size={29} /> Chat with PDF</span>
      <Link className="neo-button mobile-new-chat" href="/" aria-label="New Chat"><Plus size={21} /></Link>
    </div>
    {mobileOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <aside className={`sidebar ${mobileOpen ? "mobile-visible" : ""}`} aria-label="Main navigation"
      onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => { if (touchStart.current !== null && touchStart.current - (event.changedTouches[0]?.clientX ?? touchStart.current) > 70) setMobileOpen(false); touchStart.current = null; }}>
      <div className="sidebar-body">
        <div className="brand">
          <ChatPdfLogo size={46} className="sidebar-brand-logo" />
          <span>Chat with PDF</span>
          <button className="ml-auto icon-button mobile-close" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X size={20} /></button>
        </div>
        <Link href="/" onClick={() => setMobileOpen(false)} className="neo-button pink sidebar-create-chat"><Plus size={21} strokeWidth={3} /> New Chat{drafts.new && <span className="sidebar-draft-dot ml-auto" role="img" aria-label="New chat has unsent draft" />}</Link>
        <nav className="flex flex-col gap-1" aria-label="Workspace">
          <Link href="/" onClick={() => setMobileOpen(false)} className={`nav-link ${pathname === "/" || pathname.startsWith("/chats") ? "active" : ""}`}><MessageSquare size={21} /> Chats</Link>
          <Link href="/documents" onClick={() => setMobileOpen(false)} className={`nav-link ${pathname === "/documents" ? "active" : ""}`}><FileText size={21} /> Documents</Link>
          <Link href="/trash" onClick={() => setMobileOpen(false)} className={`nav-link ${pathname === "/trash" ? "active" : ""}`}><Trash2 size={21} /> Trash</Link>
        </nav>
        <div className="sidebar-divider" />
        <label className="sidebar-search"><Search size={18} className="text-muted" />
          <input ref={searchRef} aria-label="Search recent chats" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search chats..." />
        </label>
        {pinned.length > 0 && <section aria-label="Pinned chats" className="mt-4">
          <h2 className="sidebar-section-title">Pinned</h2>
          {pinned.map(renderSession)}
        </section>}
        <section aria-label="Recent chats" className="mt-4">
          <h2 className="sidebar-section-title">Recents</h2>
          {recent.slice(0, expanded ? undefined : 6).map(renderSession)}
          {!recent.length && <p className="px-2 py-4 text-sm text-muted">No matching chats</p>}
          {recent.length > 6 && <button className="mt-2 px-2 text-sm font-bold hover:underline" onClick={() => setExpanded(!expanded)}>{expanded ? "See Less" : "See All"}</button>}
        </section>
      </div>
      <div className="sidebar-footer"><span className="avatar"><UserRound size={24} /></span><span className="min-w-0 flex-1 truncate font-bold">Guest workspace</span><button aria-label="Workspace settings" className="icon-button" onClick={() => toast.info("Demo workspace — settings are not connected yet.")}><Settings size={21} /></button></div>
    </aside>
    <Dialog open={Boolean(renameId)} onOpenChange={(open) => { if (!open) setRenameId(null); }}>
      <DialogContent className="neo-card bg-white p-5"><DialogHeader><DialogTitle>Rename Chat</DialogTitle><DialogDescription>Choose a descriptive title for this conversation.</DialogDescription></DialogHeader>
        <input autoFocus className="rounded-md border-2 border-black px-3 py-2" aria-label="Chat title" value={renameValue} onChange={(event) => setRenameValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") saveRename(); }} />
        <DialogFooter><Button variant="outline" onClick={() => setRenameId(null)}>Cancel</Button><Button disabled={!renameValue.trim() || rename.isPending} onClick={saveRename}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog open={Boolean(deleteId)} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
      <DialogContent className="neo-card bg-white p-5"><DialogHeader><DialogTitle>Move chat to Trash?</DialogTitle><DialogDescription>You can restore it later from the Trash page.</DialogDescription></DialogHeader>
        <DialogFooter><Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button><Button onClick={deleteChat} disabled={remove.isPending} className="bg-[#ff788c]">Move to Trash</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
