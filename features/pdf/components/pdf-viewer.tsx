"use client";

import dynamic from "next/dynamic";
import { useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight, Download, Expand, FileText, List, Minus, Plus, Printer, Search, X } from "lucide-react";
import type { PdfDocument } from "@/features/common/types";
import { getUploadedFileUrl } from "@/lib/uploaded-files";

const PdfCanvas = dynamic(() => import("./pdf-canvas").then((module) => module.PdfCanvas), { ssr: false });

export function PdfViewer({ document, initialPage = 1, onClose, onExpand, mobileOpen = false, style }: {
  document: PdfDocument; initialPage?: number; onClose: () => void; onExpand?: () => void; mobileOpen?: boolean; style?: CSSProperties;
}) {
  const [page, setPage] = useState(initialPage);
  const [pages, setPages] = useState(document.pages);
  const [zoom, setZoom] = useState(100);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showRelated, setShowRelated] = useState(true);
  const url = document.url || getUploadedFileUrl(document.id);
  const safePage = Math.max(1, Math.min(page, pages));
  const nearby = Array.from({ length: Math.min(5, pages) }, (_, index) => Math.min(pages, Math.max(1, safePage - 2) + index))
    .filter((item, index, array) => array.indexOf(item) === index);

  return <section className={`pdf-panel ${mobileOpen ? "mobile-open" : ""}`} style={style} aria-label={`PDF preview for ${document.name}`}>
    <header className="pdf-panel-header"><div className="flex min-w-0 items-center gap-3"><FileText size={27} className="shrink-0" /><div className="min-w-0"><h2 className="truncate text-lg font-black">{document.name}</h2><p className="text-sm">Page {safePage} of {pages}</p></div></div>
      <div className="flex gap-1">{onExpand && <button className="neo-button bg-white p-2" onClick={onExpand} title="Swap panel positions" aria-label="Swap chat and PDF panel"><Expand size={19} /></button>}<button className="icon-button bg-white" onClick={onClose} aria-label="Close PDF preview"><X size={20} /></button></div>
    </header>
    <div className="pdf-toolbar">
      <input aria-label="PDF page number" type="number" min={1} max={pages} value={safePage} onChange={(event) => setPage(Math.min(pages, Math.max(1, Number(event.target.value) || 1)))} className="w-12 rounded-md border border-black bg-[#ffe65b] px-2 py-1.5 text-center font-bold" />
      <span className="mr-1 whitespace-nowrap text-sm">/ {pages}</span>
      <div className="flex overflow-hidden rounded-md border border-black"><button className="icon-button rounded-none border-r border-black" aria-label="Previous page" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}><ChevronLeft size={18} /></button><button className="icon-button rounded-none" aria-label="Next page" disabled={safePage >= pages} onClick={() => setPage(safePage + 1)}><ChevronRight size={18} /></button></div>
      <div className="flex overflow-hidden rounded-md border border-black"><button className="icon-button rounded-none border-r border-black" aria-label="Zoom out" onClick={() => setZoom(Math.max(50, zoom - 25))}><Minus size={18} /></button><span className="px-2 py-1.5 text-sm font-bold">{zoom}%</span><button className="icon-button rounded-none border-l border-black" aria-label="Zoom in" onClick={() => setZoom(Math.min(200, zoom + 25))}><Plus size={18} /></button></div>
      <button className="icon-button" aria-label="Search within page" aria-expanded={searchOpen} onClick={() => setSearchOpen(!searchOpen)}><Search size={19} /></button>
      <span className="flex-1" />
      {url && <><a className="icon-button" href={url} download={document.name} title="Download PDF" aria-label="Download PDF"><Download size={19} /></a><button className="icon-button" title="Print PDF" aria-label="Print PDF" onClick={() => window.open(url, "_blank", "noopener,noreferrer")}><Printer size={19} /></button></>}
    </div>
    {searchOpen && <label className="flex items-center gap-2 border-b p-2"><Search size={17} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} className="w-full outline-none" aria-label="Highlight text on the active page" placeholder="Highlight text on this page..." /></label>}
    {url ? <PdfCanvas url={url} page={safePage} zoom={zoom} query={query} onPages={setPages} />
      : <div className="pdf-canvas"><div className="rounded-md bg-white p-8 text-center text-muted">This demo upload has metadata only. Connect object storage to preview uploaded PDFs after reload.</div></div>}
    {showRelated && <div className="border-t border-slate-300 bg-white px-3 py-3"><div className="mb-2 flex items-center justify-between"><strong className="text-sm">Related Pages</strong><button aria-label="Hide related pages" className="icon-button" onClick={() => setShowRelated(false)}><List size={18} /></button></div>
      <div className="flex gap-2 overflow-x-auto pb-2">{nearby.map((number) => <button key={number} className={`flex w-16 shrink-0 flex-col items-center gap-1 rounded-md border px-2 py-2 ${number === safePage ? "border-black bg-[#ffe65b]" : "border-slate-300 bg-slate-50"}`} onClick={() => setPage(number)} aria-label={`Go to page ${number}`}><FileText size={30} className="text-slate-500" /><span className="text-xs font-bold">{number}</span></button>)}</div>
    </div>}
    {!showRelated && <button className="border-t bg-white p-2 text-sm font-bold" onClick={() => setShowRelated(true)}>Show related pages</button>}
  </section>;
}
