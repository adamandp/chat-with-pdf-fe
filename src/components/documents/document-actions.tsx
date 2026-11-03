import { Download, Eye, MoreVertical, Trash2 } from "lucide-react";
import type { PdfDocument } from "@/interface/document.interface";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={`Actions for ${document.name}`} className="icon-button">
        <MoreVertical size={21} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="min-w-40 border border-black bg-white"
      >
        <DropdownMenuItem onClick={onPreview}>
          <Eye size={16} /> Preview
        </DropdownMenuItem>
        {document.url && (
          <DropdownMenuItem
            onClick={() => window.open(document.url, "_blank", "noopener,noreferrer")}
          >
            <Download size={16} /> Open PDF
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onDelete}>
          <Trash2 size={16} /> Move to Trash
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
