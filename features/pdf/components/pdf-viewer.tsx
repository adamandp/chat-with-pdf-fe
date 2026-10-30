"use client";

import dynamic from "next/dynamic";
import { useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight, Download, Expand, Shrink, FileText, List, Minus, MoreVertical, Plus, Printer, Search, ExternalLink, X } from "lucide-react";
import type { PdfDocument } from "@/features/common/types";
import { getUploadedFileUrl } from "@/lib/uploaded-files";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const PdfCanvas = dynamic(() => import("./pdf-canvas").then((module) => module.PdfCanvas), { ssr: false });

export function PdfViewer({ document, initialPage = 1, onClose, onExpand, expanded = false, mobileOpen = false, style }: {
  document: PdfDocument; initialPage?: number; onClose: () => void; onExpand?: () => void; expanded?: boolean; mobileOpen?: boolean; style?: CSSProperties;
}) {
  const [page, setPage] = useState(initialPage);
  const [pages, setPages] = useState(document.pages);
  const [zoom, setZoom] = useState(100);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showRelated, setShowRelated] = useState(false);
  const [localExpanded, setLocalExpanded] = useState(false);
  const isExpanded = expanded || localExpanded;
  const url = document.url || getUploadedFileUrl(document.id);
  const safePage = Math.max(1, Math.min(page, pages));
  const nearby = Array.from({ length: Math.min(5, pages) }, (_, index) => Math.min(pages, Math.max(1, safePage - 2) + index))
    .filter((item, index, array) => array.indexOf(item) === index);
  function toggleExpand() { if (onExpand) onExpand(); else setLocalExpanded((value) => !value); }
  function close() { setLocalExpanded(false); onClose(); }

  return <section className={`pdf-panel ${mobileOpen ? "mobile-open" : ""} ${localExpanded ? "pdf-local-expanded" : ""}`} style={localExpanded ? undefined : style} aria-label={`PDF preview for ${document.name}`}>
    <header className="pdf-panel-header">
      <div className="flex min-w-0 items-center gap-2"><FileText size={23} className="shrink-0" /><div className="min-w-0"><h2 className="truncate text-base font-black">{document.name}</h2><p className="text-xs">Page {safePage} of {pages}</p></div></div>
      <div className="flex shrink-0 items-center gap-2">
        <button className="neo-button pdf-header-action pdf-expand-button" onClick={toggleExpand} title={isExpanded ? "Exit expanded PDF preview" : "Expand PDF preview"} aria-label={isExpanded ? "Exit expanded PDF preview" : "Expand PDF preview"}>{isExpanded ? <Shrink size={18} /> : <Expand size={18} />}</button>
        <button className="neo-button pdf-header-action" onClick={close} aria-label="Close PDF preview"><X size={19} /></button>
      </div>
    </header>
    <div className="pdf-toolbar">
      <div className="pdf-page-controls">
        <input aria-label="PDF page number" type="number" min={1} max={pages} value={safePage} onChange={(event) => setPage(Math.min(pages, Math.max(1, Number(event.target.value) || 1)))} className="pdf-page-number w-9 rounded-md border border-black bg-[#ffe65b] px-0.5 py-1 text-center text-sm font-bold" />
        <span className="whitespace-nowrap text-xs">/ {pages}</span>
        <button className="icon-button" aria-label="Previous page" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}><ChevronLeft size={18} /></button>
        <button className="icon-button" aria-label="Next page" disabled={safePage >= pages} onClick={() => setPage(safePage + 1)}><ChevronRight size={18} /></button>
      </div>
      <div className="pdf-zoom-controls">
        <button className="icon-button" aria-label="Zoom out" disabled={zoom <= 50} onClick={() => setZoom(Math.max(50, zoom - 25))}><Minus size={17} /></button>
        <span className="whitespace-nowrap text-xs font-bold">{zoom}%</span>
        <button className="icon-button" aria-label="Zoom in" disabled={zoom >= 200} onClick={() => setZoom(Math.min(200, zoom + 25))}><Plus size={17} /></button>
      </div>
      <span className="flex-1" />
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="PDF more options" className="neo-button pdf-more"><MoreVertical size={18} /></DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44 border-2 border-black bg-white p-1">
          <DropdownMenuItem onClick={() => setSearchOpen(true)}><Search size={16} /> Search in PDF</DropdownMenuItem>
          {url && <><DropdownMenuItem onClick={() => window.open(url, "_blank", "noopener,noreferrer")}><ExternalLink size={16} /> Open original</DropdownMenuItem>
          <DropdownMenuItem onClick={() => { const link = window.document.createElement("a"); link.href = url; link.download = document.name; link.click(); }}><Download size={16} /> Download</DropdownMenuItem>
          <DropdownMenuItem onClick={() => window.open(url, "_blank", "noopener,noreferrer")}><Printer size={16} /> Print / open PDF</DropdownMenuItem></>}
          <DropdownMenuItem onClick={() => setShowRelated((value) => !value)}><List size={16} /> {showRelated ? "Hide related pages" : "Related pages"}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    {searchOpen && <label className="flex items-center gap-2 border-b p-2"><Search size={17} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 w-full outline-none" aria-label="Highlight text on the active page" placeholder="Find on current page..." /><button aria-label="Close PDF search" onClick={() => { setSearchOpen(false); setQuery(""); }}><X size={17} /></button></label>}
    {url ? <PdfCanvas url={url} page={safePage} zoom={zoom} query={query} onPages={setPages} />
      : <div className="pdf-canvas"><div className="rounded-md bg-white p-8 text-center text-muted">This demo upload has metadata only. Connect object storage to preview uploaded PDFs after reload.</div></div>}
    {showRelated && <div className="pdf-related border-t border-slate-300 bg-white px-3 py-3">
      <div className="mb-2 flex items-center justify-between"><strong className="text-sm">Related Pages</strong><button aria-label="Hide related pages" className="icon-button" onClick={() => setShowRelated(false)}><X size={16} /></button></div>
      <div className="flex gap-2 overflow-x-auto pb-2">{nearby.map((number) => <button key={number} className={`flex w-14 shrink-0 flex-col items-center gap-1 rounded-md border px-2 py-2 ${number === safePage ? "border-black bg-[#ffe65b]" : "border-slate-300 bg-slate-50"}`} onClick={() => setPage(number)} aria-label={`Go to page ${number}`}><FileText size={22} className="text-slate-500" /><span className="text-xs font-bold">{number}</span></button>)}</div>
    </div>}
  </section>;
}
