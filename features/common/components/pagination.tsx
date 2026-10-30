"use client";

import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";

export function Pagination({ currentPage, totalPages, onChange, pageSize = 10, onPageSizeChange, totalItems, selectedItems = 0, label = "Pagination" }: {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  totalItems?: number;
  selectedItems?: number;
  label?: string;
}) {
  const pages = Math.max(1, totalPages);
  const current = Math.max(1, Math.min(pages, currentPage));
  return <nav aria-label={label} className="pagination pagination-full">
    <div className="pagination-count">{typeof totalItems === "number" ? `${selectedItems} of ${totalItems} row(s) selected.` : " "}</div>
    <div className="pagination-controls">
      {onPageSizeChange && <label className="pagination-size">Rows per page
        <select aria-label="Rows per page" value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
          {[4, 6, 10, 20, 50].map((size) => <option value={size} key={size}>{size}</option>)}
        </select>
      </label>}
      <span className="pagination-indicator">Page {current} of {pages}</span>
      <div className="pagination-arrows">
        <button aria-label="First page" disabled={current === 1} onClick={() => onChange(1)}><ChevronsLeft size={17} /></button>
        <button aria-label="Previous page" disabled={current === 1} onClick={() => onChange(current - 1)}><ChevronLeft size={17} /></button>
        <button aria-label="Next page" disabled={current === pages} onClick={() => onChange(current + 1)}><ChevronRight size={17} /></button>
        <button aria-label="Last page" disabled={current === pages} onClick={() => onChange(pages)}><ChevronsRight size={17} /></button>
      </div>
    </div>
  </nav>;
}
