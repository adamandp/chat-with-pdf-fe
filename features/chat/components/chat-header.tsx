"use client";

import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import type { PdfDocument } from "@/features/common/types";
import { relativeTime } from "@/lib/format";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function ChatHeader({ title, createdAt, attachments, collapsed, onToggle, onPreview, onHidePreview, hasPreview }: {
  title: string;
  createdAt?: string;
  attachments: PdfDocument[];
  collapsed: boolean;
  onToggle: () => void;
  onPreview: (document: PdfDocument) => void;
  onHidePreview: () => void;
  hasPreview: boolean;
}) {
  return <header className={`banner chat-banner shrink-0 ${collapsed ? "is-collapsed" : ""}`}>
    <div className="chat-banner-title min-w-0">
      <h1 className="truncate">{title}</h1>
      {!collapsed && <p>{createdAt ? `${attachments.length} documents • Created ${relativeTime(createdAt)}` : "Upload a PDF and start exploring"}</p>}
    </div>
    <div className="chat-banner-actions">
      <button type="button" className="neo-button chat-collapse-toggle" aria-label={collapsed ? "Expand chat header" : "Collapse chat header"} aria-expanded={!collapsed} onClick={onToggle}>
        {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger className="neo-button flex items-center gap-2 bg-white px-3 py-2 text-sm" aria-label="Chat documents">
          <FileText size={19} /><span className="hidden sm:inline">Documents</span><ChevronDown size={16} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={10} className="min-w-64 border-2 border-black bg-white p-2 shadow-lg">
          <div className="px-2 py-2 font-bold">Choose a document</div>
          {attachments.map((doc) => <DropdownMenuItem key={doc.id} onClick={() => onPreview(doc)}><FileText size={17} /><span className="max-w-56 truncate">{doc.name}</span></DropdownMenuItem>)}
          {!attachments.length && <p className="px-2 py-4 text-sm text-muted">Attach a document in the composer below.</p>}
          {hasPreview && <DropdownMenuItem onClick={onHidePreview}>Hide PDF viewer</DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </header>;
}
