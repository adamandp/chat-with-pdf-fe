import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function SidebarSessionDialogs({ renameId, renameValue, onRenameValueChange, onCancelRename, onSaveRename, renamePending, deleteId, onCancelDelete, onDelete, deletePending }: {
  renameId: string | null;
  renameValue: string;
  onRenameValueChange: (value: string) => void;
  onCancelRename: () => void;
  onSaveRename: () => void;
  renamePending: boolean;
  deleteId: string | null;
  onCancelDelete: () => void;
  onDelete: () => void;
  deletePending: boolean;
}) {
  return <>
    <Dialog open={Boolean(renameId)} onOpenChange={(open) => { if (!open) onCancelRename(); }}>
      <DialogContent className="neo-card neo-dialog-compact bg-white p-5"><DialogHeader><DialogTitle>Rename Chat</DialogTitle><DialogDescription>Choose a descriptive title for this conversation.</DialogDescription></DialogHeader>
        <input autoFocus className="neo-dialog-input rounded-md border-2 border-black px-3 py-2" aria-label="Chat title" value={renameValue} onChange={(event) => onRenameValueChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") onSaveRename(); }} />
        <DialogFooter><button className="neo-button bg-white px-4 py-2 text-sm" onClick={onCancelRename}>Cancel</button><button className="neo-button blue px-4 py-2 text-sm" disabled={!renameValue.trim() || renamePending} onClick={onSaveRename}>Save</button></DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog open={Boolean(deleteId)} onOpenChange={(open) => { if (!open) onCancelDelete(); }}>
      <DialogContent className="neo-card neo-dialog-compact bg-white p-5"><DialogHeader><DialogTitle>Move chat to Trash?</DialogTitle><DialogDescription>You can restore it later from the Trash page.</DialogDescription></DialogHeader>
        <DialogFooter><button className="neo-button bg-white px-4 py-2 text-sm" onClick={onCancelDelete}>Cancel</button><button onClick={onDelete} disabled={deletePending} className="neo-button pink px-4 py-2 text-sm">Move to Trash</button></DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
