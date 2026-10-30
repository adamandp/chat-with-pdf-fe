import { FileText } from "lucide-react";
import type { Accent } from "@/features/common/types";

export function PdfIcon({ accent = "pink", small = false }: { accent?: Accent; small?: boolean }) {
  return <div aria-hidden="true" className={`pdf-icon ${accent} ${small ? "small" : ""}`}>
    <span>PDF</span><FileText size={12} className="absolute bottom-1 right-1 opacity-60" />
  </div>;
}
