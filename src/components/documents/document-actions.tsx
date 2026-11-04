import { Download, Eye, Trash2 } from "lucide-react";
import type { PdfDocument } from "@/interface/document.interface";
import { NeoActionMenu } from "@/components/common/neo-action-menu";

export function DocumentActions({
  document,
  onPreview,
  onDelete,
}: {
  document: PdfDocument;
  onPreview: () => void;
  onDelete: () => void;
}) {
  return (
    <NeoActionMenu
      label={`Actions for ${document.name}`}
      actions={[
        { label: "Preview", icon: Eye, tone: "blue", onSelect: onPreview },
        ...(document.url
          ? [
              {
                label: "Open PDF",
                icon: Download,
                tone: "neutral" as const,
                onSelect: () => window.open(document.url, "_blank", "noopener,noreferrer"),
              },
            ]
          : []),
        { label: "Move to Trash", icon: Trash2, tone: "pink", onSelect: onDelete },
      ]}
    />
  );
}
