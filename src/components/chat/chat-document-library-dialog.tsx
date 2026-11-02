import { Search } from "lucide-react";
import type { PdfDocument } from "@/interface/document.interface";
import { PdfIcon } from "@/components/common/pdf-icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ChatDocumentLibraryDialog({
  open,
  onOpenChange,
  search,
  onSearchChange,
  documents,
  selectedIds,
  onSelectedIdsChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  search: string;
  onSearchChange: (search: string) => void;
  documents: PdfDocument[] | undefined;
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neo-card max-w-[min(94vw,520px)]! bg-white p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Choose from Library</DialogTitle>
          <DialogDescription>Select one or more PDFs to use in the conversation.</DialogDescription>
        </DialogHeader>
        <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label="Search documents in library"
            placeholder="Search documents..."
            className="min-w-0 w-full outline-none"
          />
        </label>
        <div className="max-h-[45dvh] overflow-y-auto">
          {documents?.map((doc) => (
            <label
              key={doc.id}
              className="flex cursor-pointer items-center gap-3 border-b px-1 py-3 hover:bg-blue-50"
            >
              <PdfIcon accent={doc.accent} small />
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-sm">{doc.name}</strong>
                <small className="text-muted">
                  {doc.size} • {doc.pages} pages
                </small>
              </span>
              <input
                type="checkbox"
                checked={selectedIds.includes(doc.id)}
                onChange={(event) =>
                  onSelectedIdsChange(
                    event.target.checked
                      ? [...selectedIds, doc.id]
                      : selectedIds.filter((id) => id !== doc.id),
                  )
                }
                className="size-5 accent-blue-500"
              />
            </label>
          ))}
          {!documents?.length && (
            <p className="py-8 text-center text-muted">No matching documents.</p>
          )}
        </div>
        <DialogFooter>
          <span className="mr-auto self-center text-sm text-muted">
            {selectedIds.length} selected
          </span>
          <Button className="bg-[#52b1ff]" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
