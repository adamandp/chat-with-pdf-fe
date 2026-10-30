"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { FileText, FolderPlus, MessageSquare, Menu, Plus, Search, Settings, Trash2, UserRound, X, MoreHorizontal, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useDeleteSession, useRenameSession, useSessions } from "@/services/sessions/session.query";
import { relativeTime } from "@/lib/format";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data: sessions = [] } = useSessions(false, search);
  const rename = useRenameSession();
  const remove = useDeleteSession();
  const activeSession = pathname.startsWith("/chats/") ? pathname.split("/")[2] : null;

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

  return <>
    {mobileOpen && <button className="fixed inset-0 z-30 bg-black/40 md:hidden" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <button className="mobile-menu neo-button blue items-center justify-center p-3" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={23} /></button>
    <aside className={`sidebar ${mobileOpen ? "mobile-visible" : ""}`} aria-label="Main navigation">
      <div className="sidebar-body">
        <div className="brand">
          <div className="brand-icon"><FileText size={26} strokeWidth={2.5} /></div>
          <span>Chat<br />with PDF</span>
          <button className="ml-auto icon-button mobile-close" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X size={20} /></button>
        </div>
        <Link href="/" onClick={() => setMobileOpen(false)} className="neo-button pink mb-6 flex w-full items-center gap-3 px-4 py-3 text-lg"><Plus size={24} strokeWidth={3} /> New Chat</Link>
        <nav className="flex flex-col gap-1" aria-label="Workspace">
          <Link href="/chats/session-1" onClick={() => setMobileOpen(false)} className={`nav-link ${pathname === "/" || pathname.startsWith("/chats") ? "active" : ""}`}><MessageSquare size={22} /> Chats</Link>
          <Link href="/documents" onClick={() => setMobileOpen(false)} className={`nav-link ${pathname === "/documents" ? "active" : ""}`}><FileText size={22} /> Documents</Link>
          <Link href="/trash" onClick={() => setMobileOpen(false)} className={`nav-link ${pathname === "/trash" ? "active" : ""}`}><Trash2 size={22} /> Trash</Link>
        </nav>
        <div className="sidebar-divider" />
        <div className="mb-3 flex items-center justify-between gap-2 px-1">
          <h2 className="text-sm font-black uppercase">Recent Chats</h2>
          <span className="text-xs text-muted">{sessions.length} chats</span>
        </div>
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-slate-300 px-2 py-1.5 focus-within:border-blue-500"><Search size={16} className="text-muted" />
          <input aria-label="Search recent chats" className="w-full min-w-0 bg-transparent text-sm outline-none" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search chats..." />
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: expanded ? 370 : 265 }}>
          {sessions.slice(0, expanded ? undefined : 4).map((session) => <div key={session.id} className={`sidebar-chat group ${session.id === activeSession ? "active" : ""}`}>
            <MessageSquare size={19} />
            <Link href={`/chats/${session.id}`} onClick={() => setMobileOpen(false)} className="min-w-0 flex-1"><strong className="block truncate text-sm">{session.title}</strong><small className="text-muted">{relativeTime(session.updatedAt)}</small></Link>
            <DropdownMenu>
              <DropdownMenuTrigger aria-label={`Chat actions for ${session.title}`} className="icon-button opacity-0 focus:opacity-100 group-hover:opacity-100"><MoreHorizontal size={16} /></DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="min-w-36 border border-black bg-white">
                <DropdownMenuItem onClick={() => { setRenameId(session.id); setRenameValue(session.title); }}><Pencil size={14} /> Rename</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDeleteId(session.id)}><Trash2 size={14} /> Move to trash</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>)}
          {!sessions.length && <p className="px-2 py-5 text-sm text-muted">No matching chats</p>}
        </div>
        {sessions.length > 4 && <button className="mt-2 flex items-center gap-1 px-2 text-sm font-bold hover:underline" onClick={() => setExpanded(!expanded)}>{expanded ? "See Less" : "See All"} <span aria-hidden>→</span></button>}
        <div className="sidebar-divider" />
        <div className="flex items-center justify-between px-1"><h2 className="text-sm font-black uppercase">Document Library</h2><Link href="/documents" aria-label="Open document library" className="icon-button border-2 border-black"><FolderPlus size={18} /></Link></div>
        <p className="px-1 pt-2 text-xs leading-5 text-muted">Your PDFs, organized and ready to explore.</p>
      </div>
      <div className="sidebar-footer"><span className="avatar"><UserRound size={29} /></span><span className="min-w-0 flex-1 truncate font-bold">Guest User</span><button aria-label="Workspace settings" className="icon-button" onClick={() => toast.info("Demo workspace — settings are not connected yet.")}><Settings size={22} /></button></div>
    </aside>
    <Dialog open={Boolean(renameId)} onOpenChange={(open) => { if (!open) setRenameId(null); }}>
      <DialogContent className="neo-card bg-white p-6"><DialogHeader><DialogTitle>Rename Chat</DialogTitle><DialogDescription>Choose a descriptive title for this conversation.</DialogDescription></DialogHeader>
        <input autoFocus className="rounded-md border-2 border-black px-3 py-2" aria-label="Chat title" value={renameValue} onChange={(event) => setRenameValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") saveRename(); }} />
        <DialogFooter><Button variant="outline" onClick={() => setRenameId(null)}>Cancel</Button><Button disabled={!renameValue.trim() || rename.isPending} onClick={saveRename}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog open={Boolean(deleteId)} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
      <DialogContent className="neo-card bg-white p-6"><DialogHeader><DialogTitle>Move chat to Trash?</DialogTitle><DialogDescription>You can restore it later from the Trash page.</DialogDescription></DialogHeader>
        <DialogFooter><Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button><Button onClick={deleteChat} disabled={remove.isPending} className="bg-[#ff788c]">Move to Trash</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
