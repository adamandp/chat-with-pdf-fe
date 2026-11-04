"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import type { AnswerMode, ThinkingMode, Source } from "@/interface/chat.interface";
import type { PdfDocument } from "@/interface/document.interface";
import { useSession } from "@/features/chat-session/chat-session.query";
import { useChatDetail, useMessages } from "@/features/chat/chat.query";
import {
  useActivateVersion,
  useEditMessage,
  useRegenerateAnswer,
  useSendChat,
} from "@/features/chat/chat.mutation";
import { useForkSession } from "@/features/chat-session/chat-session.mutation";
import { useDocuments } from "@/features/document/document.query";
import { useAuth } from "@/providers/auth-provider";
import { ChatHeader } from "./chat-header";
import { ChatMessage } from "./chat-message";
import { ChatComposer } from "./chat-composer";
import { getChatDraft, moveChatDraft, setChatDraft, useSessionDraft } from "@/stores/chat-drafts";
import { PdfViewer } from "@/components/pdf/pdf-viewer";
import { ChatRichText } from "./chat-rich-text";

type Preview = { document: PdfDocument; page: number };
const suggestions = [
  "Summarize the main findings",
  "Compare annual reports",
  "What are the key financial trends?",
];

export function ChatScreen({ sessionId }: { sessionId?: string }) {
  return <ChatScreenContent key={sessionId || "new"} sessionId={sessionId} />;
}

function ChatScreenContent({ sessionId }: { sessionId?: string }) {
  const { user, loading: authLoading } = useAuth();
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const { data: session, isError: sessionError } = useSession(sessionId);
  const { data: detail } = useChatDetail(sessionId);
  const { data: messages = [], isLoading: messagesLoading } = useMessages(sessionId);
  const { data: documentResponse } = useDocuments({ pageSize: 100 });
  const allDocuments = [
    ...(documentResponse?.data || []),
    ...(detail?.documents || []).filter(
      (document) => !(documentResponse?.data || []).some((item) => item.id === document.id),
    ),
  ];
  const [draft, setDraft] = useSessionDraft(sessionId);
  const [modeOverride, setMode] = useState<AnswerMode | null>(null);
  const [thinking, setThinking] = useState<ThinkingMode>("quick");
  const [selectedOverride, setSelectedOverride] = useState<string[] | null>(null);
  const selectedIds =
    selectedOverride ??
    (session?.documentIds || []).filter((id) => {
      const document = detail?.documents.find((item) => item.id === id);
      return document && document.status === "READY" && !document.deletedAt;
    });
  const setSelectedIds = (ids: string[]) => {
    if (ids.length === 0) setMode("general");
    setSelectedOverride(ids);
  };
  // Document-only answers require an attached, ready PDF. Preserve the saved mode
  // for existing chats that still have documents; new/empty chats use general.
  const mode: AnswerMode =
    selectedIds.length === 0
      ? "general"
      : (modeOverride ?? (session?.answerMode === "document_only" ? "document" : "general"));
  const [preview, setPreview] = useState<Preview | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(Boolean(sessionId));
  const [sideWidth, setSideWidth] = useState(35);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const send = useSendChat();
  const fork = useForkSession();
  const regenerate = useRegenerateAnswer();
  const edit = useEditMessage();
  const activate = useActivateVersion();
  const [streamed, setStreamed] = useState("");
  const streaming = send.isPending || edit.isPending || regenerate.isPending;
  const historyNeedsSession = Boolean(sessionId) && !authLoading && !user;

  // Scroll only the chat thread. scrollIntoView() also scrolls outer ancestors on iOS,
  // which caused the banner to overlap messages and shift the viewport.
  useEffect(() => {
    const thread = threadRef.current;
    if (thread) thread.scrollTop = thread.scrollHeight;
  }, [messages.length, streaming, streamed]);

  function onThreadScroll() {
    const thread = threadRef.current;
    if (!thread || streaming) return;
    const maxScroll = thread.scrollHeight - thread.clientHeight;
    // A short conversation cannot scroll: keep its header compact once chatting.
    if (maxScroll <= 12) {
      if (messages.length > 0) setHeaderCollapsed(true);
      return;
    }
    // Hysteresis avoids a collapse/expand loop as the header changes height.
    if (thread.scrollTop >= 72) setHeaderCollapsed(true);
    else if (thread.scrollTop <= 8) setHeaderCollapsed(false);
  }

  function openSource(source: Source) {
    const document = allDocuments.find((item) => item.id === source.documentId);
    if (
      !document ||
      document.status === "DELETED" ||
      document.status === "DELETING" ||
      document.deletedAt
    ) {
      toast.error("This source document is no longer available");
      return;
    }
    setPreview({ document, page: source.page });
  }
  function sendMessage() {
    if (!draft.trim() || streaming) return;
    setHeaderCollapsed(true);
    setStreamed("");
    const sentDraft = draft;
    send.mutate(
      {
        sessionId,
        message: draft.trim(),
        mode,
        thinkingMode: thinking,
        documentIds: selectedIds,
        onEvent: (event) => {
          if (event.type === "token") setStreamed((value) => value + event.data.content);
        },
      },
      {
        onSuccess: (response) => {
          // Never delete a newer draft the user typed while the request was pending.
          if (!sessionId) {
            if (getChatDraft("new") !== sentDraft) moveChatDraft("new", response.session.id);
            else setChatDraft("new", "");
            router.push(`/chats/${response.session.id}`);
          } else if (getChatDraft(sessionId) === sentDraft) {
            setChatDraft(sessionId, "");
          }
        },
        onError: () => toast.error("Could not send message. Your draft is still here."),
        onSettled: () => setStreamed(""),
      },
    );
  }
  function forkAt(messageId: string) {
    if (!sessionId || fork.isPending) return;
    fork.mutate(
      { id: sessionId, messageId },
      {
        onSuccess: (created) => {
          toast.success("Forked into a new conversation");
          router.push(`/chats/${created.id}`);
        },
        onError: () => toast.error("Could not fork chat"),
      },
    );
  }
  function regenerateAt(messageId: string) {
    if (!sessionId || regenerate.isPending) return;
    regenerate.mutate(
      {
        messageId,
        thinkingMode: thinking,
        onEvent: (event) => {
          if (event.type === "token") setStreamed((value) => value + event.data.content);
        },
      },
      {
        onSuccess: () => toast.success("Response regenerated"),
        onError: () => toast.error("Could not regenerate response"),
        onSettled: () => setStreamed(""),
      },
    );
  }
  function editAt(messageId: string, content: string, onSuccess: () => void) {
    if (!sessionId || edit.isPending) return;
    setStreamed("");
    edit.mutate(
      {
        id: messageId,
        input: {
          sessionId,
          message: content,
          mode,
          thinkingMode: thinking,
          documentIds: selectedIds,
          onEvent: (event) => {
            if (event.type === "token") setStreamed((value) => value + event.data.content);
          },
        },
      },
      {
        onSuccess: () => {
          onSuccess();
          toast.success("Message edited; a new branch was created");
        },
        onError: () => toast.error("Could not edit message"),
        onSettled: () => setStreamed(""),
      },
    );
  }
  function resize(event: React.PointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const bounds = workspaceRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const rightPercent = ((bounds.right - event.clientX) / bounds.width) * 100;
    setSideWidth(Math.max(20, Math.min(40, rightPercent)));
  }
  const attachments = (session?.documentIds || selectedIds)
    .map((id) => allDocuments.find((document) => document.id === id))
    .filter((doc): doc is PdfDocument => Boolean(doc));

  return (
    <div
      ref={workspaceRef}
      className={`chat-workspace ${expanded && preview ? "preview-expanded" : ""}`}
    >
      <div className="chat-main">
        <ChatHeader
          title={session?.title || (sessionId ? "Conversation" : "New Chat")}
          createdAt={session?.createdAt}
          attachments={attachments}
          collapsed={headerCollapsed}
          onPreview={(document) => {
            if (document.status === "DELETED" || document.deletedAt) {
              toast.error("This PDF has been deleted");
              return;
            }
            setPreview({ document, page: 1 });
          }}
          onHidePreview={() => setPreview(null)}
          hasPreview={Boolean(preview)}
        />
        <div className="chat-thread" ref={threadRef} onScroll={onThreadScroll} aria-live="polite">
          {sessionError && (
            <p role="alert" className="p-10 text-center text-red-700">
              Chat not found or was deleted.
            </p>
          )}
          {sessionId && (authLoading || messagesLoading) && (
            <p role="status" className="p-10 text-center text-muted">
              Loading conversation...
            </p>
          )}
          {historyNeedsSession && (
            <p role="status" className="p-10 text-center text-muted">
              Sign in from Account settings to view this conversation, or start a new chat.
            </p>
          )}
          {!sessionId && (
            <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center gap-5 pb-10 text-center">
              <motion.span
                className="neo-card yellow grid size-20 place-items-center shadow-none"
                initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 240, damping: 22 }}
              >
                <Sparkles size={40} />
              </motion.span>
              <h2 className="text-3xl font-black">Your documents, explained.</h2>
              <p className="max-w-lg text-muted">
                Ask questions about your PDFs, compare reports, and jump directly to the pages
                behind each answer.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((suggestion, index) => (
                  <motion.button
                    key={suggestion}
                    type="button"
                    className="chat-suggestion rounded-lg border-2 border-black bg-white px-3 py-2 text-sm font-bold"
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={reduceMotion ? undefined : { y: -2 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                    transition={{ duration: 0.2, delay: reduceMotion ? 0 : index * 0.06 }}
                    onClick={() => setDraft(suggestion)}
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
              {process.env.NEXT_PUBLIC_API_MOCKING !== "disabled" && (
                <p className="text-xs text-muted">
                  Demo mode: answers are simulated. Local mode connects to your backend.
                </p>
              )}
            </div>
          )}
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              documents={allDocuments}
              onSource={openSource}
              onFork={() => forkAt(message.id)}
              forking={fork.isPending && fork.variables?.messageId === message.id}
              onRegenerate={
                message.role === "assistant" ? () => regenerateAt(message.id) : undefined
              }
              regenerating={regenerate.isPending && regenerate.variables?.messageId === message.id}
              onEdit={
                message.role === "user"
                  ? (content, done) => editAt(message.id, content, done)
                  : undefined
              }
              editingPending={edit.isPending && edit.variables?.id === message.id}
              onActivateVersion={(id) =>
                activate.mutate(
                  { messageId: id, sessionId: message.sessionId },
                  { onError: () => toast.error("Could not activate version") },
                )
              }
            />
          ))}
          {streaming && (
            <div className="message-line">
              <span className="avatar bot">
                <Bot size={25} />
              </span>
              <div className="message-bubble" role="status">
                {streamed ? (
                  <ChatRichText content={streamed} onCitation={() => {}} />
                ) : (
                  "Thinking about your question…"
                )}
              </div>
            </div>
          )}
        </div>
        {(!sessionId || (!authLoading && user)) && (
          <ChatComposer
            draft={draft}
            setDraft={setDraft}
            mode={mode}
            setMode={setMode}
            thinking={thinking}
            setThinking={setThinking}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            uploadScope={sessionId || "new"}
            onSend={sendMessage}
            pending={streaming}
          />
        )}
      </div>
      {preview && (
        <>
          <div
            className="resize-handle"
            role="separator"
            aria-label="Resize chat and PDF panels"
            aria-orientation="vertical"
            tabIndex={0}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={resize}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                setSideWidth((value) =>
                  Math.max(20, Math.min(40, value + (event.key === "ArrowLeft" ? 2 : -2))),
                );
              }
            }}
          />
          <PdfViewer
            key={`${preview.document.id}:${preview.page}`}
            document={preview.document}
            initialPage={preview.page}
            onClose={() => {
              setPreview(null);
              setExpanded(false);
            }}
            onExpand={() => setExpanded((value) => !value)}
            expanded={expanded}
            mobileOpen
            style={{ flex: `0 0 ${sideWidth}%` }}
          />
        </>
      )}
    </div>
  );
}
