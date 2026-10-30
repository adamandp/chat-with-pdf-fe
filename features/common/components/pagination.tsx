"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const PAGE_SIZES = [4, 6, 10, 20, 50];

/** Compact reusable pagination, shared by Documents and both Trash lists. */
export function Pagination({ currentPage, totalPages, onChange, pageSize = 10, onPageSizeChange, totalItems, label = "Pagination" }: {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  totalItems?: number;
  selectedItems?: number;
  label?: string;
}) {
  const [sizeOpen, setSizeOpen] = useState(false);
  const pages = Math.max(1, totalPages);
  const current = Math.max(1, Math.min(pages, currentPage));
  const from = (totalItems || 0) === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(totalItems || 0, current * pageSize);

  return <nav aria-label={label} className="neo-pagination">
    <span className="neo-pagination-count">{typeof totalItems === "number" ? `Showing ${from}–${to} of ${totalItems}` : ""}</span>
    <div className="neo-pagination-controls">
      {onPageSizeChange && <div className="neo-pagination-size">
        <span className="neo-pagination-size-label">Rows</span>
        <Popover open={sizeOpen} onOpenChange={setSizeOpen}>
          <PopoverTrigger className="neo-pagination-size-trigger" aria-label="Rows per page" title="Rows per page" aria-expanded={sizeOpen}>
            <strong>{pageSize}</strong><ChevronDown size={15} />
          </PopoverTrigger>
          <PopoverContent side="top" align="end" sideOffset={8} className="neo-pagination-menu">
            <strong className="block px-2 pb-1 text-xs">Rows per page</strong>
            {PAGE_SIZES.map((size) => <button className={`neo-pagination-option ${size === pageSize ? "selected" : ""}`}
              type="button" key={size} aria-label={`Show ${size} rows per page`} aria-pressed={size === pageSize}
              onClick={() => { onPageSizeChange(size); setSizeOpen(false); }}>
              {size} {size === pageSize && <Check size={15} />}
            </button>)}
          </PopoverContent>
        </Popover>
      </div>}
      <span className="neo-pagination-page">Page <strong>{current}</strong> / {pages}</span>
      <div className="neo-pagination-arrows">
        <button type="button" aria-label="First page" disabled={current === 1} onClick={() => onChange(1)}><ChevronsLeft size={17} /></button>
        <button type="button" aria-label="Previous page" disabled={current === 1} onClick={() => onChange(current - 1)}><ChevronLeft size={17} /></button>
        <button type="button" aria-label="Next page" disabled={current === pages} onClick={() => onChange(current + 1)}><ChevronRight size={17} /></button>
        <button type="button" aria-label="Last page" disabled={current === pages} onClick={() => onChange(pages)}><ChevronsRight size={17} /></button>
      </div>
    </div>
  </nav>;
}
