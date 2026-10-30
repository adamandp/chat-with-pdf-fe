"use client";

import { useRef, useState } from "react";
import { Bot, Check, ChevronDown, FileText, Folder, Paperclip, Search, Send, Upload, X } from "lucide-react";
import { toast } from "sonner";
import type { AnswerMode } from "@/features/common/types";
import { PdfIcon } from "@/features/common/components/pdf-icon";
import { rememberUploadedFile } from "@/lib/uploaded-files";
import { useDocuments, useUploadDocument } from "@/services/documents/document.query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ChatComposer({ draft, setDraft, mode, setMode, selectedIds, setSelectedIds, onSend, pending }: {
  draft: string; setDraft: (value: string) => void;
  mode: AnswerMode; setMode: (mode: AnswerMode) => void;
  selectedIds: string[]; setSelectedIds: (ids: string[]) => void;
  onSend: () => void; pending: boolean;
}) {
  const [attachOpen, setAttachOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [librarySearch, setLibrarySearch] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const upload = useUploadDocument();
  const { data: library } = useDocuments({ q: librarySearch, pageSize: 50 });
  const { data: selectedDocuments } = useDocuments({ pageSize: 50 });

  async function onFile(file?: File) {
    if (!file) return;
    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Choose a PDF file"); return;
    }
    if (file.size > 20 * 1024 * 1024) { toast.error("PDF must be under 20 MB"); return; }
    upload.mutate(file, {
      onSuccess: (doc) => {
        rememberUploadedFile(doc.id, file);
        setSelectedIds([...new Set([...selectedIds, doc.id])]);
        toast.success("PDF added to your library");
      },
      onError: () => toast.error("Upload failed"),
    });
    if (fileInput.current) fileInput.current.value = "";
  }

  return <div className="composer">
    {selectedIds.length > 0 && <div className="mb-2 flex flex-wrap gap-2">{selectedIds.map((id) => {
      const doc = selectedDocuments?.data.find((item) => item.id === id);
      return <span key={id} className="flex items-center gap-1 rounded-md border border-blue-300 bg-blue-50 px-2 py-1 text-xs"><FileText size={13} /><span className="max-w-32 truncate">{doc?.name || "Selected PDF"}</span><button aria-label={`Remove ${doc?.name || "PDF"}`} onClick={() => setSelectedIds(selectedIds.filter((item) => item !== id))}><X size={13} /></button></span>;
    })}</div>}
    <textarea aria-label="Your message" placeholder="Ask a question about your documents..." value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); if (draft.trim() && !pending) onSend(); } }} rows={2} />
    <div className="flex flex-wrap items-center gap-2">
      <input ref={fileInput} type="file" className="hidden" accept="application/pdf,.pdf" aria-label="Upload a PDF" onChange={(event) => onFile(event.target.files?.[0])} />
      <Popover open={attachOpen} onOpenChange={setAttachOpen}>
        <PopoverTrigger aria-label="Attach a document" className="neo-button pink flex size-10 items-center justify-center"><Paperclip size={19} /></PopoverTrigger>
        <PopoverContent side="top" align="start" sideOffset={12} className="w-72 border-2 border-black bg-white p-2 shadow-[4px_5px_0_#111]">
          <button className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-blue-50" onClick={() => { setAttachOpen(false); fileInput.current?.click(); }}><span className="rounded-lg bg-[#ff8ba0] p-3"><Upload size={22} /></span><span><strong className="block text-sm">Upload New PDF</strong><small className="text-muted">Upload from your device</small></span></button>
          <div className="my-1 border-t" />
          <button className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-blue-50" onClick={() => { setAttachOpen(false); setLibraryOpen(true); }}><span className="rounded-lg bg-[#ffe65b] p-3"><Folder size={22} /></span><span><strong className="block text-sm">Choose from Library</strong><small className="text-muted">Use existing documents</small></span></button>
        </PopoverContent>
      </Popover>
      {upload.isPending && <span className="text-xs text-muted">Uploading…</span>}
      <span className="flex-1" />
      <Popover open={modeOpen} onOpenChange={setModeOpen}>
        <PopoverTrigger className="neo-button flex min-h-10 items-center gap-2 bg-white px-3 text-xs sm:text-sm"><FileText size={18} /> {mode === "document" ? "Document Only" : "General Knowledge"}<ChevronDown size={16} /></PopoverTrigger>
        <PopoverContent side="top" align="end" sideOffset={13} className="w-[min(330px,90vw)] border-2 border-black bg-white p-3 shadow-[4px_5px_0_#111]">
          <h3 className="mb-3 font-black">Answer Mode</h3>
          <button className={`mb-2 flex w-full items-start gap-3 rounded-lg border p-3 text-left ${mode === "document" ? "border-blue-500 bg-blue-100" : "border-slate-200"}`} onClick={() => { setMode("document"); setModeOpen(false); }}><FileText size={25} className="shrink-0" /><span className="flex-1"><strong className="block">Document Only</strong><small className="text-muted">Answers from selected PDF documents.</small></span>{mode === "document" && <Check size={18} />}</button>
          <button className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left ${mode === "general" ? "border-blue-500 bg-blue-100" : "border-slate-200"}`} onClick={() => { setMode("general"); setModeOpen(false); }}><Bot size={25} className="shrink-0" /><span className="flex-1"><strong className="block">General Knowledge</strong><small className="text-muted">Use general knowledge with other sources.</small></span>{mode === "general" && <Check size={18} />}</button>
        </PopoverContent>
      </Popover>
      <button className="neo-button blue flex size-10 items-center justify-center" disabled={pending || !draft.trim()} aria-label="Send message" onClick={onSend}><Send size={19} fill="white" /> </button>
    </div>
    <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
      <DialogContent className="neo-card max-w-[min(94vw,520px)]! bg-white p-6">
        <DialogHeader><DialogTitle className="text-xl font-black">Choose from Library</DialogTitle><DialogDescription>Select one or more PDFs to use in the conversation.</DialogDescription></DialogHeader>
        <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2"><Search size={18} /><input value={librarySearch} onChange={(event) => setLibrarySearch(event.target.value)} aria-label="Search documents in library" placeholder="Search documents..." className="w-full outline-none" /></label>
        <div className="max-h-72 overflow-y-auto">{library?.data.map((doc) => <label key={doc.id} className="flex cursor-pointer items-center gap-3 border-b px-1 py-3 hover:bg-blue-50"><PdfIcon accent={doc.accent} small /><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{doc.name}</strong><small className="text-muted">{doc.size} • {doc.pages} pages</small></span><input type="checkbox" checked={selectedIds.includes(doc.id)} onChange={(event) => setSelectedIds(event.target.checked ? [...selectedIds, doc.id] : selectedIds.filter((id) => id !== doc.id))} className="size-5 accent-blue-500" /></label>)}
          {!library?.data.length && <p className="py-8 text-center text-muted">No matching documents.</p>}
        </div>
        <DialogFooter><span className="mr-auto self-center text-sm text-muted">{selectedIds.length} selected</span><Button className="bg-[#52b1ff]" onClick={() => setLibraryOpen(false)}>Done</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
