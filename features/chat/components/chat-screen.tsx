"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { AnswerMode, ThinkingMode, PdfDocument, Source } from "@/features/common/types";
import { useSession } from "@/services/sessions/session.query";
import { useMessages } from "@/services/chats/chat.query";
import { useSendChat } from "@/services/chats/chat.mutation";
import { useDocuments } from "@/services/documents/document.query";
import { ChatHeader } from "./chat-header";
import { ChatMessage } from "./chat-message";
import { ChatComposer } from "./chat-composer";
import { PdfViewer } from "@/features/pdf/components/pdf-viewer";

type Preview = { document: PdfDocument; page: number };
const suggestions = ["Summarize the main findings", "Compare annual reports", "What are the key financial trends?"];

export function ChatScreen({ sessionId }: { sessionId?: string }) {
  return <ChatScreenContent key={sessionId || "new"} sessionId={sessionId} />;
}

function ChatScreenContent({ sessionId }: { sessionId?: string }) {
  const router = useRouter();
  const { data: session, isError: sessionError } = useSession(sessionId);
  const { data: messages = [], isPending: messagesPending } = useMessages(sessionId);
  const { data: documentResponse } = useDocuments({ pageSize: 50 });
  const allDocuments = documentResponse?.data || [];
  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState<AnswerMode>("document");
  const [thinking, setThinking] = useState<ThinkingMode>("quick");
  const [selectedOverride, setSelectedOverride] = useState<string[] | null>(null);
  const selectedIds = selectedOverride ?? session?.documentIds ?? [];
  const setSelectedIds = setSelectedOverride;
  const [preview, setPreview] = useState<Preview | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(Boolean(sessionId));
  const [sideWidth, setSideWidth] = useState(35);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const send = useSendChat();

  // Scroll only the chat thread. scrollIntoView() also scrolls outer ancestors on iOS,
  // which caused the banner to overlap messages and shift the viewport.
  useEffect(() => {
    const thread = threadRef.current;
    if (thread) thread.scrollTop = thread.scrollHeight;
  }, [messages.length, send.isPending]);

  function onThreadScroll() {
    const thread = threadRef.current;
    if (!thread || send.isPending) return;
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
    if (!document) { toast.error("This source document is no longer available"); return; }
    setPreview({ document, page: source.page });
  }
  function sendMessage() {
    if (!draft.trim() || send.isPending) return;
    setHeaderCollapsed(true);
    send.mutate({ sessionId, message: draft.trim(), mode, thinkingMode: thinking, documentIds: selectedIds }, {
      onSuccess: (response) => {
        setDraft("");
        if (!sessionId) router.push(`/chats/${response.session.id}`);
      },
      onError: () => toast.error("Could not send message. Your draft is still here."),
    });
  }
  function resize(event: React.PointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const bounds = workspaceRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const rightPercent = (bounds.right - event.clientX) / bounds.width * 100;
    setSideWidth(Math.max(20, Math.min(40, rightPercent)));
  }
  const attachments = (session?.documentIds || selectedIds).map((id) => allDocuments.find((document) => document.id === id)).filter((doc): doc is PdfDocument => Boolean(doc));

  return <div ref={workspaceRef} className={`chat-workspace ${expanded && preview ? "preview-expanded" : ""}`}>
    <div className="chat-main">
      <ChatHeader title={session?.title || (sessionId ? "Conversation" : "New Chat")} createdAt={session?.createdAt} attachments={attachments} collapsed={headerCollapsed} onPreview={(document) => setPreview({ document, page: 1 })} onHidePreview={() => setPreview(null)} hasPreview={Boolean(preview)} />
      <div className="chat-thread" ref={threadRef} onScroll={onThreadScroll} aria-live="polite">
        {sessionError && <p role="alert" className="p-10 text-center text-red-700">Chat not found or was deleted.</p>}
        {sessionId && messagesPending && <p role="status" className="p-10 text-center text-muted">Loading conversation...</p>}
        {!sessionId && <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center gap-5 pb-10 text-center"><span className="neo-card yellow grid size-20 place-items-center shadow-none"><Sparkles size={40} /></span><h2 className="text-3xl font-black">Your documents, explained.</h2><p className="max-w-lg text-muted">Ask questions about your PDFs, compare reports, and jump directly to the pages behind each answer.</p><div className="flex flex-wrap justify-center gap-2">{suggestions.map((suggestion) => <button key={suggestion} className="rounded-lg border-2 border-black bg-white px-3 py-2 text-sm font-bold hover:bg-[#ffe65b]" onClick={() => setDraft(suggestion)}>{suggestion}</button>)}</div><p className="text-xs text-muted">Demo mode: chat answers are simulated. No real AI is connected yet.</p></div>}
        {messages.map((message) => <ChatMessage key={message.id} message={message} documents={allDocuments} onSource={openSource} />)}
        {send.isPending && <div className="message-line"><span className="avatar bot"><Bot size={25} /></span><div className="message-bubble text-muted" role="status">Thinking about your question…</div></div>}
      </div>
      <ChatComposer draft={draft} setDraft={setDraft} mode={mode} setMode={setMode} thinking={thinking} setThinking={setThinking} selectedIds={selectedIds} setSelectedIds={setSelectedIds} onSend={sendMessage} pending={send.isPending} />
    </div>
    {preview && <>
      <div className="resize-handle" role="separator" aria-label="Resize chat and PDF panels" aria-orientation="vertical" tabIndex={0} 
        onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={resize}
        onKeyDown={(event) => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); setSideWidth((value) => Math.max(20, Math.min(40, value + (event.key === "ArrowLeft" ? 2 : -2)))); } }} />
      <PdfViewer key={`${preview.document.id}:${preview.page}`} document={preview.document} initialPage={preview.page} onClose={() => { setPreview(null); setExpanded(false); }} onExpand={() => setExpanded((value) => !value)} expanded={expanded} mobileOpen
        style={{ flex: `0 0 ${sideWidth}%` }} />
    </>}
  </div>;
}
