"use client";

import { useState } from "react";
import { FileText, MessageSquare, RotateCcw, Trash2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { relativeTime } from "@/lib/format";
import { useSessions } from "@/features/chat-session/chat-session.query";
import { useDeleteSession, useRestoreSession } from "@/features/chat-session/chat-session.mutation";
import { useDocuments } from "@/features/document/document.query";
import { useDeleteDocument, useRestoreDocument } from "@/features/document/document.mutation";
import { PdfIcon } from "@/components/common/pdf-icon";
import { NeoActionMenu } from "@/components/common/neo-action-menu";
import { Pagination } from "@/components/common/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type DeleteTarget = { type: "chat" | "document"; id: string; title: string };

export function TrashScreen() {
  const reduceMotion = useReducedMotion();
  const [chatPage, setChatPage] = useState(1);
  const [chatPageSize, setChatPageSize] = useState(4);
  const [documentPageSize, setDocumentPageSize] = useState(4);
  const [documentPage, setDocumentPage] = useState(1);
  const [toDelete, setToDelete] = useState<DeleteTarget | null>(null);
  const { data: chatResponse, isPending: chatsPending } = useSessions(
    true,
    "",
    chatPage,
    chatPageSize,
  );
  const chats = chatResponse?.data || [];
  const { data: documents, isPending: documentsPending } = useDocuments({
    deleted: true,
    page: documentPage,
    pageSize: documentPageSize,
  });
  const restoreChat = useRestoreSession();
  const restoreDoc = useRestoreDocument();
  const deleteChat = useDeleteSession();
  const deleteDoc = useDeleteDocument();
  const chatTotalPages = Math.max(1, chatResponse?.paging?.totalPages || 1);

  function onRestore(type: "chat" | "document", id: string) {
    const mutation = type === "chat" ? restoreChat : restoreDoc;
    mutation.mutate(id, {
      onSuccess: () => {
        toast.success("Item restored");
        setChatPage(1);
        setDocumentPage(1);
      },
      onError: () => toast.error("Unable to restore item"),
    });
  }
  function onPermanentDelete() {
    if (!toDelete) return;
    const mutation = toDelete.type === "chat" ? deleteChat : deleteDoc;
    mutation.mutate(
      { id: toDelete.id, permanent: true },
      {
        onSuccess: () => {
          toast.success("Item permanently deleted");
          setToDelete(null);
          setChatPage(1);
          setDocumentPage(1);
        },
        onError: () => toast.error("Unable to permanently delete item"),
      },
    );
  }

  return (
    <div className="screen">
      <header className="banner">
        <div>
          <h1>Trash</h1>
          <p>Recently deleted items</p>
        </div>
      </header>
      <section className="neo-card history-section" aria-labelledby="deleted-chats-heading">
        <div className="mb-2 flex items-center gap-4 border-b pb-4">
          <span className="neo-card pink grid size-14 place-items-center shadow-none">
            <MessageSquare size={29} />
          </span>
          <div>
            <h2 id="deleted-chats-heading" className="text-2xl font-black">
              Chat History
            </h2>
            <p className="text-muted">Deleted chats are stored here</p>
          </div>
        </div>
        {chatsPending && <p className="py-10 text-center text-muted">Loading deleted chats…</p>}
        {!chatsPending && chats.length === 0 && (
          <p className="py-10 text-center text-muted">No deleted chats.</p>
        )}
        {chats.map((chat, index) => (
          <motion.div
            className="history-row"
            key={chat.id}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: reduceMotion ? 0 : Math.min(index * 0.035, 0.14) }}
          >
            <span
              className={`neo-card grid size-12 shrink-0 place-items-center shadow-none ${["yellow", "blue", "mint", "purple"][index % 4]}`}
            >
              <MessageSquare size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <strong className="block truncate">{chat.title}</strong>
              <p className="text-sm text-muted">Last updated {relativeTime(chat.updatedAt)}</p>
            </div>
            <NeoActionMenu
              label={`Actions for ${chat.title}`}
              actions={[
                {
                  label: "Restore",
                  icon: RotateCcw,
                  tone: "mint",
                  onSelect: () => onRestore("chat", chat.id),
                },
                {
                  label: "Delete",
                  icon: Trash2,
                  tone: "pink",
                  onSelect: () => setToDelete({ type: "chat", id: chat.id, title: chat.title }),
                },
              ]}
            />
          </motion.div>
        ))}
        <Pagination
          currentPage={Math.min(chatPage, chatTotalPages)}
          totalPages={chatTotalPages}
          totalItems={chatResponse?.paging?.totalItems || 0}
          pageSize={chatPageSize}
          onPageSizeChange={(size) => {
            setChatPageSize(size);
            setChatPage(1);
          }}
          onChange={setChatPage}
          label="Deleted chat pages"
        />
      </section>
      <section className="neo-card history-section" aria-labelledby="deleted-docs-heading">
        <div className="mb-2 flex items-center gap-4 border-b pb-4">
          <span className="neo-card pink grid size-14 place-items-center shadow-none">
            <FileText size={29} />
          </span>
          <div>
            <h2 id="deleted-docs-heading" className="text-2xl font-black">
              Documents History
            </h2>
            <p className="text-muted">Deleted documents are stored here</p>
          </div>
        </div>
        {documentsPending && (
          <p className="py-10 text-center text-muted">Loading deleted documents…</p>
        )}
        {documents && !documents.data.length && (
          <p className="py-10 text-center text-muted">No deleted documents.</p>
        )}
        {documents?.data.map((doc, index) => (
          <motion.div
            className="history-row"
            key={doc.id}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: reduceMotion ? 0 : Math.min(index * 0.035, 0.14) }}
          >
            <PdfIcon accent={doc.accent} small />
            <div className="min-w-0 flex-1">
              <strong className="block truncate">{doc.name}</strong>
              <p className="text-sm text-muted">
                {doc.pages} pages • Deleted {relativeTime(doc.deletedAt!)}
              </p>
            </div>
            <NeoActionMenu
              label={`Actions for ${doc.name}`}
              actions={[
                {
                  label: "Restore",
                  icon: RotateCcw,
                  tone: "mint",
                  onSelect: () => onRestore("document", doc.id),
                },
                {
                  label: "Delete",
                  icon: Trash2,
                  tone: "pink",
                  onSelect: () => setToDelete({ type: "document", id: doc.id, title: doc.name }),
                },
              ]}
            />
          </motion.div>
        ))}
        <Pagination
          currentPage={documents?.paging?.currentPage || 1}
          totalPages={documents?.paging?.totalPages || 1}
          totalItems={documents?.paging?.totalItems || 0}
          pageSize={documentPageSize}
          onPageSizeChange={(size) => {
            setDocumentPageSize(size);
            setDocumentPage(1);
          }}
          onChange={setDocumentPage}
          label="Deleted document pages"
        />
      </section>
      <Dialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
      >
        <DialogContent className="neo-card bg-white p-6">
          <DialogHeader>
            <DialogTitle>Delete permanently?</DialogTitle>
            <DialogDescription>
              This will permanently remove “{toDelete?.title}”. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>
              Cancel
            </Button>
            <Button
              className="bg-[#ff788c]"
              onClick={onPermanentDelete}
              disabled={deleteChat.isPending || deleteDoc.isPending}
            >
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
