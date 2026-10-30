"use client";

import { useState } from "react";
import { CalendarDays, Check, FileText, Grid2X2, List, MoreVertical, Search, ArrowDownUp, Download, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { PdfDocument } from "@/features/common/types";
import { formattedDate } from "@/lib/format";
import { useDocuments } from "@/services/documents/document.query";
import { useDeleteDocument } from "@/services/documents/document.mutation";
import { PdfIcon } from "@/features/common/components/pdf-icon";
import { Pagination } from "@/features/common/components/pagination";
import { PdfPreviewDialog } from "@/features/pdf/components/pdf-preview-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function DocumentActions({ document, onPreview, onDelete }: { document: PdfDocument; onPreview: () => void; onDelete: () => void }) {
  return <DropdownMenu><DropdownMenuTrigger aria-label={`Actions for ${document.name}`} className="icon-button"><MoreVertical size={21} /></DropdownMenuTrigger>
    <DropdownMenuContent align="end" sideOffset={8} className="min-w-40 border border-black bg-white">
      <DropdownMenuItem onClick={onPreview}><Eye size={16} /> Preview</DropdownMenuItem>
      {document.url && <DropdownMenuItem onClick={() => window.open(document.url, "_blank", "noopener,noreferrer")}><Download size={16} /> Open PDF</DropdownMenuItem>}
      <DropdownMenuItem onClick={onDelete}><Trash2 size={16} /> Move to Trash</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}

export function DocumentsScreen() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"modified" | "name" | "pages">("modified");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [preview, setPreview] = useState<PdfDocument | null>(null);
  const [toDelete, setToDelete] = useState<PdfDocument | null>(null);
  const { data, isPending, isError, refetch } = useDocuments({ q: query, sort, direction, page, pageSize });
  const { data: all } = useDocuments({ pageSize: 1 });
  const remove = useDeleteDocument();
  const count = all?.paging?.totalItems ?? data?.paging?.totalItems ?? 0;
  const options = [
    { value: "modified", label: "Last modified" },
    { value: "name", label: "Name" },
    { value: "pages", label: "Page count" },
  ] as const;
  const currentSort = options.find((item) => item.value === sort)?.label;

  function confirmDelete() {
    if (!toDelete) return;
    remove.mutate({ id: toDelete.id, permanent: false }, {
      onSuccess: () => { setToDelete(null); setPage(1); toast.success("Document moved to Trash"); },
      onError: () => toast.error("Unable to delete document"),
    });
  }

  return <div className="screen">
    <header className="banner mb-7">
      <div><h1>Documents</h1><p>{count} documents • Updated today</p></div>
      <div className="neo-card flex overflow-hidden bg-white p-1">
        <button aria-pressed={view === "grid"} className={`flex items-center gap-2 rounded-md px-4 py-3 text-sm font-bold ${view === "grid" ? "blue" : ""}`} onClick={() => setView("grid")}><Grid2X2 size={20} /> <span className="hidden sm:inline">Grid View</span></button>
        <button aria-pressed={view === "list"} className={`flex items-center gap-2 rounded-md px-4 py-3 text-sm font-bold ${view === "list" ? "blue" : ""}`} onClick={() => setView("list")}><List size={20} /> <span className="hidden sm:inline">List View</span></button>
      </div>
    </header>
    <div className="mb-6 flex flex-wrap gap-4">
      <label className="toolbar-field min-w-50 flex-1"><Search size={25} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search documents..." aria-label="Search documents" /></label>
      <DropdownMenu><DropdownMenuTrigger className="toolbar-field min-w-45 justify-between text-sm font-bold"><ArrowDownUp size={20} /> {currentSort} {direction === "asc" ? "↑" : "↓"}</DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={9} className="min-w-52 border-2 border-black bg-white p-2 shadow-lg">
          {options.map((option) => <DropdownMenuItem key={option.value} onClick={() => { setSort(option.value); setPage(1); }}>{option.label}{sort === option.value && <Check size={16} className="ml-auto" />}</DropdownMenuItem>)}
          <div className="my-1 border-t" />
          <DropdownMenuItem onClick={() => { setDirection("desc"); setPage(1); }}>Descending {direction === "desc" && <Check size={16} className="ml-auto" />}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setDirection("asc"); setPage(1); }}>Ascending {direction === "asc" && <Check size={16} className="ml-auto" />}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    {isPending && <div className="grid min-h-64 place-items-center text-muted" role="status">Loading documents...</div>}
    {isError && <div role="alert" className="neo-card p-8">Could not load documents. <button className="font-bold underline" onClick={() => refetch()}>Retry</button></div>}
    {data && !data.data.length && <div className="neo-card grid min-h-64 place-items-center p-10 text-center"><div><FileText className="mx-auto mb-3 text-muted" size={42} /><h2 className="text-xl font-bold">No documents found</h2><p className="text-muted">Try another search or upload a PDF from chat.</p></div></div>}
    {data && data.data.length > 0 && (view === "grid"
      ? <div className="document-grid">{data.data.map((document) => <article key={document.id} className="neo-card document-card">
          <div className="absolute right-3 top-3"><DocumentActions document={document} onPreview={() => setPreview(document)} onDelete={() => setToDelete(document)} /></div>
          <button className="mx-auto mb-6 mt-17" onClick={() => setPreview(document)} aria-label={`Preview ${document.name}`}><PdfIcon accent={document.accent} /></button>
          <button className="line-clamp-2 text-left text-lg font-black hover:underline" onClick={() => setPreview(document)}>{document.name}</button>
          <p className="mt-1 line-clamp-1 text-sm text-muted">{document.description}</p>
          <div className="mt-4"><span className={`pill ${document.analyzed ? "analyzed" : "pending"}`}>{document.analyzed ? "Analyzed" : "Not analyzed"}</span></div>
          <div className="mt-auto flex items-center justify-between gap-2 pt-6 text-xs text-muted"><span className="flex items-center gap-1.5"><FileText size={16} /> {document.pages} pages</span><span className="flex items-center gap-1.5"><CalendarDays size={16} /> {formattedDate(document.updatedAt)}</span></div>
        </article>)}</div>
      : <div className="document-list">{data.data.map((document) => <article key={document.id} className="neo-card document-row">
          <button onClick={() => setPreview(document)} aria-label={`Preview ${document.name}`}><PdfIcon accent={document.accent} small /></button>
          <div className="min-w-0"><button className="max-w-full truncate text-left text-base font-black hover:underline" onClick={() => setPreview(document)}>{document.name}</button><p className="mt-1 truncate text-sm text-muted">{document.description}</p></div>
          <div className="doc-status"><span className={`pill ${document.analyzed ? "analyzed" : "pending"}`}>{document.analyzed ? "Analyzed" : "Not analyzed"}</span></div>
          <span className="doc-pages flex items-center gap-2 text-sm text-muted"><FileText size={17} /> {document.pages} pages</span>
          <span className="doc-date flex items-center gap-2 text-sm text-muted"><CalendarDays size={17} /> {formattedDate(document.updatedAt)}</span>
          <DocumentActions document={document} onPreview={() => setPreview(document)} onDelete={() => setToDelete(document)} />
        </article>)}</div>)}
    {data?.paging && <Pagination currentPage={data.paging.currentPage} totalPages={data.paging.totalPages} totalItems={data.paging.totalItems} pageSize={pageSize} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} onChange={setPage} label="Document pages" />}
    <PdfPreviewDialog document={preview} onClose={() => setPreview(null)} />
    <Dialog open={Boolean(toDelete)} onOpenChange={(open) => { if (!open) setToDelete(null); }}>
      <DialogContent className="neo-card bg-white p-6"><DialogHeader><DialogTitle>Move document to Trash?</DialogTitle><DialogDescription>{toDelete?.name} will be available to restore later.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setToDelete(null)}>Cancel</Button><Button onClick={confirmDelete} disabled={remove.isPending} className="bg-[#ff788c]">Move to Trash</Button></DialogFooter></DialogContent>
    </Dialog>
  </div>;
}
