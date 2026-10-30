"use client";

import Link from "next/link";
import { GitFork, MessageSquare, MoreHorizontal, Pencil, Pin, PinOff, Trash2 } from "lucide-react";
import type { Session } from "@/features/common/types";
import { relativeTime } from "@/lib/format";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function SidebarSessionRow({ session, pinned, active, hasDraft, onNavigate, onPin, onRename, onDelete, onFork }: {
  session: Session;
  pinned: boolean;
  active: boolean;
  hasDraft: boolean;
  onNavigate: () => void;
  onPin: () => void;
  onRename: () => void;
  onDelete: () => void;
  onFork: () => void;
}) {
  return <div className={`sidebar-session-row ${pinned ? "is-pinned" : "is-recent"} ${active ? "active" : ""}`}>
    {pinned ? <Pin className="sidebar-session-icon" size={18} /> : <MessageSquare className="sidebar-session-icon" size={18} />}
    <Link href={`/chats/${session.id}`} onClick={onNavigate} className="sidebar-session-link">
      <strong className="block truncate text-sm">{session.title}</strong>
      <small className="text-muted">{relativeTime(session.updatedAt)}</small>
    </Link>
    {hasDraft && <span className="sidebar-draft-dot" role="img" aria-label="Unsent draft" title="Unsent draft" />}
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={`Chat actions for ${session.title}`} className="sidebar-session-more" title="Chat options"><MoreHorizontal size={19} /></DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-40 border-2 border-black bg-popover">
        <DropdownMenuItem onClick={onPin}>{pinned ? <PinOff size={16} /> : <Pin size={16} />}{pinned ? "Unpin" : "Pin"}</DropdownMenuItem>
        <DropdownMenuItem onClick={onRename}><Pencil size={16} /> Rename</DropdownMenuItem>
        <DropdownMenuItem onClick={onFork}><GitFork size={16} /> Fork chat</DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete}><Trash2 size={16} /> Move to Trash</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>;
}
