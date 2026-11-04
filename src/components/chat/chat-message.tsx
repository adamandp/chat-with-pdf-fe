"use client";

import { useState } from "react";
import {
  Bot,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  GitFork,
  Pencil,
  RefreshCcw,
  ThumbsDown,
  ThumbsUp,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { ChatMessage as Message, Source } from "@/interface/chat.interface";
import type { PdfDocument } from "@/interface/document.interface";
import { shortTime } from "@/lib/format";
import { useFeedback } from "@/features/chat/chat.mutation";
import { PdfIcon } from "@/components/common/pdf-icon";
import { ChatRichText } from "./chat-rich-text";

export function ChatMessage({
  message,
  documents,
  onSource,
  onFork,
  onRegenerate,
  onEdit,
  onActivateVersion,
  forking = false,
  regenerating = false,
  editingPending = false,
}: {
  message: Message;
  documents: PdfDocument[];
  onSource: (source: Source) => void;
  onFork?: () => void;
  onRegenerate?: () => void;
  onEdit?: (content: string, onSuccess: () => void) => void;
  onActivateVersion?: (id: string) => void;
  forking?: boolean;
  regenerating?: boolean;
  editingPending?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const feedback = useFeedback();
  const isUser = message.role === "user";
  function saveEdit() {
    onEdit?.(draft.trim(), () => setEditing(false));
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(message.content);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Clipboard access failed");
    }
  }

  return (
    <div className={`message-line ${isUser ? "user" : ""}`}>
      {!isUser && (
        <span className="avatar bot">
          <Bot size={27} />
        </span>
      )}
      <div className="flex max-w-full flex-col gap-2" style={{ minWidth: 0 }}>
        <div className="message-bubble" style={{ maxWidth: "100%" }}>
          {editing ? (
            <div className="message-editor space-y-2">
              <textarea
                autoFocus
                aria-label="Edit message"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={Math.min(5, Math.max(2, draft.split("\n").length))}
                className="edit-textarea w-full rounded-md border-2 border-black bg-white p-2 outline-none focus:ring-2 focus:ring-blue-200"
              />
              <div className="flex justify-end gap-2">
                <button
                  className="neo-button flex items-center gap-1 bg-white px-3 py-2 text-sm font-bold"
                  onClick={() => {
                    setEditing(false);
                    setDraft(message.content);
                  }}
                >
                  <X size={14} /> Cancel
                </button>
                <button
                  disabled={!draft.trim() || editingPending}
                  className="neo-button flex items-center gap-1 bg-[#8acaff] px-3 py-2 text-sm font-bold"
                  onClick={saveEdit}
                >
                  <Check size={14} /> Save
                </button>
              </div>
            </div>
          ) : (
            <ChatRichText
              content={message.content}
              onCitation={(index) => {
                const source = message.sources[index];
                if (source) onSource(source);
              }}
            />
          )}
          {!isUser && message.sources.length > 0 && (
            <div className="mt-4">
              <strong className="mb-2 block text-sm">Sources:</strong>
              <div className="source-grid">
                {message.sources.map((source) => {
                  const doc = documents.find((item) => item.id === source.documentId);
                  if (!doc) return null;
                  return (
                    <button
                      key={`${source.documentId}-${source.page}`}
                      className={`source-card flex min-w-0 items-center gap-2 rounded-lg border-2 px-2 py-1.5 text-left text-xs hover:brightness-95 ${doc.accent}`}
                      onClick={() => onSource(source)}
                    >
                      <PdfIcon accent={doc.accent} small />
                      <span className="min-w-0">
                        <strong className="block max-w-36 truncate">{doc.name}</strong>
                        <span>Page {source.page}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="mt-2 text-right text-xs text-muted">
            {(message.versionCount || 0) > 1 ? `${message.versionCount} versions · ` : ""}
            {shortTime(message.createdAt)}
          </div>
        </div>
        {!editing && (
          <div className="flex items-center gap-2 px-1">
            {isUser ? (
              <button
                title="Edit message"
                aria-label="Edit message"
                className="icon-button"
                onClick={() => {
                  setDraft(message.content);
                  setEditing(true);
                }}
              >
                <Pencil size={17} />
              </button>
            ) : (
              <>
                <button
                  aria-label="Good response"
                  title="Good response"
                  className={`icon-button ${message.feedback === "up" ? "bg-blue-200" : ""}`}
                  onClick={() =>
                    feedback.mutate({ id: message.id, sessionId: message.sessionId, rating: "up" })
                  }
                >
                  <ThumbsUp size={17} />
                </button>
                <button
                  aria-label="Poor response"
                  title="Poor response"
                  className={`icon-button ${message.feedback === "down" ? "bg-blue-200" : ""}`}
                  onClick={() =>
                    feedback.mutate({
                      id: message.id,
                      sessionId: message.sessionId,
                      rating: "down",
                    })
                  }
                >
                  <ThumbsDown size={17} />
                </button>
              </>
            )}
            <button
              aria-label="Copy message"
              title="Copy message"
              className="icon-button"
              onClick={copy}
            >
              <Copy size={17} />
            </button>
            {onFork && (
              <button
                aria-label="Fork chat from this message"
                title="Fork from here"
                disabled={forking}
                className="icon-button"
                onClick={onFork}
              >
                <GitFork size={17} />
              </button>
            )}
            {onRegenerate && (
              <button
                aria-label="Regenerate answer"
                title="Regenerate answer"
                disabled={regenerating}
                className="icon-button"
                onClick={onRegenerate}
              >
                <RefreshCcw size={17} className={regenerating ? "animate-spin" : ""} />
              </button>
            )}
            {(message.versions?.length || 0) > 1 && onActivateVersion && (
              <div
                className="ml-1 flex items-center gap-1 text-xs font-bold"
                aria-label="Message versions"
              >
                <button
                  className="icon-button"
                  aria-label="Previous version"
                  disabled={message.versions!.findIndex((item) => item.id === message.id) <= 0}
                  onClick={() => {
                    const index = message.versions!.findIndex((item) => item.id === message.id);
                    if (index > 0) onActivateVersion(message.versions![index - 1].id);
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                {message.versions!.findIndex((item) => item.id === message.id) + 1}/
                {message.versions!.length}
                <button
                  className="icon-button"
                  aria-label="Next version"
                  disabled={
                    message.versions!.findIndex((item) => item.id === message.id) >=
                    message.versions!.length - 1
                  }
                  onClick={() => {
                    const index = message.versions!.findIndex((item) => item.id === message.id);
                    if (index < message.versions!.length - 1)
                      onActivateVersion(message.versions![index + 1].id);
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {isUser && (
        <span className="avatar">
          <UserRound size={27} />
        </span>
      )}
    </div>
  );
}
