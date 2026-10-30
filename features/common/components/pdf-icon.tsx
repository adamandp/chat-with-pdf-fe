import { FileText } from "lucide-react";
import type { Accent } from "@/features/common/types";

/** A single consistent document mark for grid, list, citations and the library. */
export function PdfIcon({ accent = "pink", small = false }: { accent?: Accent; small?: boolean }) {
  return <span aria-hidden="true" className={`pdf-icon ${accent} ${small ? "small" : ""}`}>
    <FileText className="pdf-icon-glyph" strokeWidth={1.8} />
    <span className="pdf-icon-label">PDF</span>
  </span>;
}
