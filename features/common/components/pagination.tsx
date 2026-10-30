import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ currentPage, totalPages, onChange, label = "Pagination" }: {
  currentPage: number; totalPages: number; onChange: (page: number) => void; label?: string;
}) {
  if (totalPages <= 1) return null;
  return <nav aria-label={label} className="pagination">
    <button aria-label="Previous page" disabled={currentPage <= 1} onClick={() => onChange(currentPage - 1)}><ChevronLeft size={17} className="mx-auto" /></button>
    {Array.from({ length: totalPages }, (_, index) => index + 1).filter((page) => totalPages <= 7 || page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1).map((page, index, list) => <span key={page} className="flex items-center gap-2">
      {index > 0 && page - list[index - 1] > 1 && <span aria-hidden className="px-1">…</span>}
      <button aria-current={page === currentPage ? "page" : undefined} onClick={() => onChange(page)}>{page}</button>
    </span>)}
    <button aria-label="Next page" disabled={currentPage >= totalPages} onClick={() => onChange(currentPage + 1)}><ChevronRight size={17} className="mx-auto" /></button>
  </nav>;
}
