"use client";

import type { PdfDocument } from "@/features/common/types";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PdfViewer } from "./pdf-viewer";

export function PdfPreviewDialog({ document, onClose }: { document: PdfDocument | null; onClose: () => void }) {
  return <Dialog open={Boolean(document)} onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent showCloseButton={false} className="pdf-dialog-shell h-[min(92dvh,1000px)] max-w-[min(96vw,920px)]! border-0 bg-white p-0 shadow-none">
      <DialogTitle className="sr-only">PDF preview</DialogTitle>
      {document && <PdfViewer key={document.id} document={document} onClose={onClose} />}
    </DialogContent>
  </Dialog>;
}
