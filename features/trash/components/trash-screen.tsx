"use client";

import { useState } from "react";
import { FileText, MessageSquare, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { relativeTime } from "@/lib/format";
import { useDeleteSession, useRestoreSession, useSessions } from "@/services/sessions/session.query";
import { useDeleteDocument, useDocuments, useRestoreDocument } from "@/services/documents/document.query";
import { PdfIcon } from "@/features/common/components/pdf-icon";
import { Pagination } from "@/features/common/components/pagination";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type DeleteTarget = { type: "chat" | "document"; id: string; title: string };


export function TrashScreen() {
  const [chatPage, setChatPage] = useState(1);
  const [chatPageSize, setChatPageSize] = useState(4);
  const [documentPageSize, setDocumentPageSize] = useState(4);
  const [documentPage, setDocumentPage] = useState(1);
  const [toDelete, setToDelete] = useState<DeleteTarget | null>(null);
  const { data: chats = [], isPending: chatsPending } = useSessions(true);
  const { data: documents, isPending: documentsPending } = useDocuments({ deleted: true, page: documentPage, pageSize: documentPageSize });
  const restoreChat = useRestoreSession();
  const restoreDoc = useRestoreDocument();
  const deleteChat = useDeleteSession();
  const deleteDoc = useDeleteDocument();
  const chatTotalPages = Math.max(1, Math.ceil(chats.length / chatPageSize));

  function onRestore(type: "chat" | "document", id: string) {
    const mutation = type === "chat" ? restoreChat : restoreDoc;
    mutation.mutate(id, {
      onSuccess: () => { toast.success("Item restored"); setChatPage(1); setDocumentPage(1); },
      onError: () => toast.error("Unable to restore item"),
    });
  }
  function onPermanentDelete() {
    if (!toDelete) return;
    const mutation = toDelete.type === "chat" ? deleteChat : deleteDoc;
    mutation.mutate({ id: toDelete.id, permanent: true }, {
      onSuccess: () => { toast.success("Item permanently deleted"); setToDelete(null); setChatPage(1); setDocumentPage(1); },
      onError: () => toast.error("Unable to permanently delete item"),
    });
  }

  return <div className="screen">
    <header className="banner"><div><h1>Trash</h1><p>Recently deleted items</p></div></header>
    <section className="neo-card history-section" aria-labelledby="deleted-chats-heading">
      <div className="mb-2 flex items-center gap-4 border-b pb-4"><span className="neo-card pink grid size-14 place-items-center shadow-none"><MessageSquare size={29} /></span><div><h2 id="deleted-chats-heading" className="text-2xl font-black">Chat History</h2><p className="text-muted">Deleted chats are stored here</p></div></div>
      {chatsPending && <p className="py-10 text-center text-muted">Loading deleted chats…</p>}
      {!chatsPending && chats.length === 0 && <p className="py-10 text-center text-muted">No deleted chats.</p>}
      {chats.slice((chatPage - 1) * chatPageSize, chatPage * chatPageSize).map((chat, index) => <div className="history-row" key={chat.id}>
        <span className={`neo-card grid size-12 shrink-0 place-items-center shadow-none ${["yellow", "blue", "mint", "purple"][index % 4]}`}><MessageSquare size={22} /></span>
        <div className="min-w-0 flex-1"><strong className="block truncate">{chat.title}</strong><p className="text-sm text-muted">Deleted {relativeTime(chat.deletedAt!)}</p></div>
        <div className="flex gap-2"><button aria-label={`Restore ${chat.title}`} title="Restore" className="icon-button border border-black hover:bg-green-100" onClick={() => onRestore("chat", chat.id)}><RotateCcw size={18} /></button><button className="neo-button pink flex items-center gap-2 px-3 py-2 text-sm" onClick={() => setToDelete({ type: "chat", id: chat.id, title: chat.title })}><Trash2 size={17} /><span className="hidden sm:inline">Delete</span></button></div>
      </div>)}
      <Pagination currentPage={Math.min(chatPage, chatTotalPages)} totalPages={chatTotalPages} totalItems={chats.length} pageSize={chatPageSize} onPageSizeChange={(size) => { setChatPageSize(size); setChatPage(1); }} onChange={setChatPage} label="Deleted chat pages" />
    </section>
    <section className="neo-card history-section" aria-labelledby="deleted-docs-heading">
      <div className="mb-2 flex items-center gap-4 border-b pb-4"><span className="neo-card pink grid size-14 place-items-center shadow-none"><FileText size={29} /></span><div><h2 id="deleted-docs-heading" className="text-2xl font-black">Documents History</h2><p className="text-muted">Deleted documents are stored here</p></div></div>
      {documentsPending && <p className="py-10 text-center text-muted">Loading deleted documents…</p>}
      {documents && !documents.data.length && <p className="py-10 text-center text-muted">No deleted documents.</p>}
      {documents?.data.map((doc) => <div className="history-row" key={doc.id}>
        <PdfIcon accent={doc.accent} small />
        <div className="min-w-0 flex-1"><strong className="block truncate">{doc.name}</strong><p className="text-sm text-muted">{doc.pages} pages • Deleted {relativeTime(doc.deletedAt!)}</p></div>
        <div className="flex gap-2"><button aria-label={`Restore ${doc.name}`} title="Restore" className="icon-button border border-black hover:bg-green-100" onClick={() => onRestore("document", doc.id)}><RotateCcw size={18} /></button><button className="neo-button pink flex items-center gap-2 px-3 py-2 text-sm" onClick={() => setToDelete({ type: "document", id: doc.id, title: doc.name })}><Trash2 size={17} /><span className="hidden sm:inline">Delete</span></button></div>
      </div>)}
      <Pagination currentPage={documents?.paging?.currentPage || 1} totalPages={documents?.paging?.totalPages || 1} totalItems={documents?.paging?.totalItems || 0} pageSize={documentPageSize} onPageSizeChange={(size) => { setDocumentPageSize(size); setDocumentPage(1); }} onChange={setDocumentPage} label="Deleted document pages" />
    </section>
    <Dialog open={Boolean(toDelete)} onOpenChange={(open) => { if (!open) setToDelete(null); }}>
      <DialogContent className="neo-card bg-white p-6"><DialogHeader><DialogTitle>Delete permanently?</DialogTitle><DialogDescription>This will permanently remove “{toDelete?.title}”. This action cannot be undone.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setToDelete(null)}>Cancel</Button><Button className="bg-[#ff788c]" onClick={onPermanentDelete} disabled={deleteChat.isPending || deleteDoc.isPending}>Delete permanently</Button></DialogFooter></DialogContent>
    </Dialog>
  </div>;
}
