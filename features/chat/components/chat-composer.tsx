"use client";

import { useRef, useState } from "react";
import { ArrowUp, Bot, Check, ChevronDown, FileText, Folder, Paperclip, Search, Sparkles, Upload, X, Zap } from "lucide-react";
import { toast } from "sonner";
import type { AnswerMode, ThinkingMode } from "@/features/common/types";
import { PdfIcon } from "@/features/common/components/pdf-icon";
import { rememberUploadedFile } from "@/lib/uploaded-files";
import { useDocuments } from "@/services/documents/document.query";
import { useUploadDocument } from "@/services/documents/document.mutation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const thinkingOptions: { value: ThinkingMode; name: string; description: string }[] = [
  { value: "quick", name: "Quick", description: "Faster responses" },
  { value: "pro", name: "Pro", description: "More detailed analysis" },
  { value: "ultra", name: "Ultra", description: "Deep reasoning" },
];

export function ChatComposer({ draft, setDraft, mode, setMode, thinking, setThinking, selectedIds, setSelectedIds, onSend, pending }: {
  draft: string; setDraft: (value: string) => void;
  mode: AnswerMode; setMode: (mode: AnswerMode) => void;
  thinking: ThinkingMode; setThinking: (mode: ThinkingMode) => void;
  selectedIds: string[]; setSelectedIds: (ids: string[]) => void;
  onSend: () => void; pending: boolean;
}) {
  const [attachOpen, setAttachOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [thinkingOpen, setThinkingOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [librarySearch, setLibrarySearch] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const upload = useUploadDocument();
  const { data: library } = useDocuments({ q: librarySearch, pageSize: 50 });
  const { data: selectedDocuments } = useDocuments({ pageSize: 50 });

  function onFile(file?: File) {
    if (!file) return;
    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) { toast.error("Choose a PDF file"); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error("PDF must be under 20 MB"); return; }
    upload.mutate(file, {
      onSuccess: (doc) => { rememberUploadedFile(doc.id, file); setSelectedIds([...new Set([...selectedIds, doc.id])]); toast.success("PDF added to your library"); },
      onError: () => toast.error("Upload failed"),
    });
    if (fileInput.current) fileInput.current.value = "";
  }

  return <div className="composer" role="group" aria-label="Chat composer">
    {selectedIds.length > 0 && <div className="composer-documents" aria-label="Attached documents">{selectedIds.map((id) => {
      const doc = selectedDocuments?.data.find((item) => item.id === id);
      return <span key={id} className="composer-chip"><FileText size={14} /><span className="truncate">{doc?.name || "Selected PDF"}</span><button type="button" aria-label={`Remove ${doc?.name || "PDF"}`} onClick={() => setSelectedIds(selectedIds.filter((item) => item !== id))}><X size={14} /></button></span>;
    })}</div>}
    <textarea aria-label="Your message" placeholder="Ask a question about your documents..." value={draft}
      onChange={(event) => { setDraft(event.target.value); event.target.style.height = "auto"; event.target.style.height = Math.min(event.target.scrollHeight, 130) + "px"; }}
      onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && !window.matchMedia("(pointer: coarse)").matches) { event.preventDefault(); if (draft.trim() && !pending) onSend(); } }} rows={1} />
    <div className="composer-actions">
      <input ref={fileInput} type="file" className="hidden" accept="application/pdf,.pdf" aria-label="Upload a PDF" onChange={(event) => onFile(event.target.files?.[0])} />
      <Popover open={attachOpen} onOpenChange={setAttachOpen}>
        <PopoverTrigger aria-label="Attach a document" className="neo-button pink composer-attach"><Paperclip size={19} /></PopoverTrigger>
        <PopoverContent side="top" align="start" sideOffset={10} className="w-[min(288px,calc(100vw-24px))] border-2 border-black bg-white p-2 shadow-[3px_4px_0_#111]">
          <button className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-blue-50" onClick={() => { setAttachOpen(false); fileInput.current?.click(); }}><span className="rounded-lg bg-[#ff8ba0] p-2"><Upload size={19} /></span><span><strong className="block text-sm">Upload New PDF</strong><small className="text-muted">Choose a PDF from your device</small></span></button>
          <div className="my-1 border-t" />
          <button className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-blue-50" onClick={() => { setAttachOpen(false); setLibraryOpen(true); }}><span className="rounded-lg bg-[#ffe65b] p-2"><Folder size={19} /></span><span><strong className="block text-sm">Choose from Library</strong><small className="text-muted">Use an existing document</small></span></button>
        </PopoverContent>
      </Popover>
      <span className="composer-spacer" />
      {upload.isPending && <span className="text-xs text-muted">Uploading…</span>}
      <Popover open={modeOpen} onOpenChange={setModeOpen}>
        <PopoverTrigger aria-label="Answer Mode" className="neo-button composer-mode"><FileText size={17} /><span className="truncate">{mode === "document" ? "Document Only" : "General"}</span><ChevronDown size={15} className="shrink-0" /></PopoverTrigger>
        <PopoverContent side="top" align="end" sideOffset={10} className="w-[min(250px,calc(100vw-24px))] border-2 border-black bg-white p-2 shadow-[3px_4px_0_#111]">
          <h3 className="mb-1 px-2 text-sm font-black">Answer Mode</h3>
          {([{ value: "document", name: "Document Only", description: "Selected PDFs", icon: FileText }, { value: "general", name: "General Knowledge", description: "General information", icon: Bot }] as const).map((option) => <button key={option.value} className={`composer-option ${mode === option.value ? "selected" : ""}`} onClick={() => { setMode(option.value); setModeOpen(false); }}>
            <option.icon size={18} /><span className="flex-1"><strong className="block text-sm">{option.name}</strong><small className="text-muted">{option.description}</small></span>{mode === option.value && <Check size={16} />}
          </button>)}
        </PopoverContent>
      </Popover>
      <Popover open={thinkingOpen} onOpenChange={setThinkingOpen}>
        <PopoverTrigger aria-label="Thinking Mode" className="neo-button composer-thinking"><Zap size={16} /><span className="capitalize">{thinking}</span><ChevronDown size={14} /></PopoverTrigger>
        <PopoverContent side="top" align="end" sideOffset={10} className="w-[min(226px,calc(100vw-24px))] border-2 border-black bg-white p-2 shadow-[3px_4px_0_#111]">
          <h3 className="mb-1 px-2 text-sm font-black">Thinking Mode</h3>
          {thinkingOptions.map((option) => <button key={option.value} className={`composer-option ${thinking === option.value ? "selected" : ""}`} onClick={() => { setThinking(option.value); setThinkingOpen(false); }}>
            {option.value === "ultra" ? <Sparkles size={18} /> : <Zap size={18} />}<span className="flex-1"><strong className="block text-sm">{option.name}</strong><small className="text-muted">{option.description}</small></span>{thinking === option.value && <Check size={16} />}
          </button>)}
          <p className="px-2 pt-2 text-xs text-muted">Demo only: backend reasoning is not connected yet.</p>
        </PopoverContent>
      </Popover>
      <button type="button" className="neo-button blue composer-send" disabled={pending || !draft.trim()} aria-label="Send message" title="Send message" onClick={onSend}><ArrowUp size={22} strokeWidth={3} /></button>
    </div>
    <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
      <DialogContent className="neo-card max-w-[min(94vw,520px)]! bg-white p-4 sm:p-6">
        <DialogHeader><DialogTitle className="text-xl font-black">Choose from Library</DialogTitle><DialogDescription>Select one or more PDFs to use in the conversation.</DialogDescription></DialogHeader>
        <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2"><Search size={18} /><input value={librarySearch} onChange={(event) => setLibrarySearch(event.target.value)} aria-label="Search documents in library" placeholder="Search documents..." className="min-w-0 w-full outline-none" /></label>
        <div className="max-h-[45dvh] overflow-y-auto">{library?.data.map((doc) => <label key={doc.id} className="flex cursor-pointer items-center gap-3 border-b px-1 py-3 hover:bg-blue-50"><PdfIcon accent={doc.accent} small /><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{doc.name}</strong><small className="text-muted">{doc.size} • {doc.pages} pages</small></span><input type="checkbox" checked={selectedIds.includes(doc.id)} onChange={(event) => setSelectedIds(event.target.checked ? [...selectedIds, doc.id] : selectedIds.filter((id) => id !== doc.id))} className="size-5 accent-blue-500" /></label>)}
          {!library?.data.length && <p className="py-8 text-center text-muted">No matching documents.</p>}
        </div>
        <DialogFooter><span className="mr-auto self-center text-sm text-muted">{selectedIds.length} selected</span><Button className="bg-[#52b1ff]" onClick={() => setLibraryOpen(false)}>Done</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
