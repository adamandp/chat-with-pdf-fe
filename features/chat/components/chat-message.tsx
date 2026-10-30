"use client";

import { useState } from "react";
import { Bot, Check, Copy, Pencil, ThumbsDown, ThumbsUp, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import type { ChatMessage as Message, PdfDocument, Source } from "@/features/common/types";
import { shortTime } from "@/lib/format";
import { useEditMessage, useFeedback } from "@/services/chats/chat.query";
import { PdfIcon } from "@/features/common/components/pdf-icon";

function RichText({ content, onCitation }: { content: string; onCitation: (index: number) => void }) {
  const blocks = content.split(/\n\n+/).filter(Boolean);
  return <div className="space-y-3">{blocks.map((block, blockIndex) => {
    const lines = block.split("\n");
    return <div key={blockIndex} className="space-y-1">{lines.map((line, index) => {
      const match = /^(\d+)\.\s+(.*)$/.exec(line);
      const text = match?.[2] || line;
      const tokens = text.split(/(\*\*[^*]+\*\*|\[\d+\])/g).filter(Boolean);
      return <p key={index} className={match ? "flex gap-3" : ""}>
        {match && <strong className="w-5 shrink-0">{match[1]}.</strong>}
        <span>{tokens.map((token, tokenIndex) => {
          if (token.startsWith("**") && token.endsWith("**")) return <strong key={tokenIndex}>{token.slice(2, -2)}</strong>;
          if (/^\[\d+\]$/.test(token)) return <button key={tokenIndex} type="button" className="font-bold text-blue-600 hover:underline" onClick={() => onCitation(Number(token.slice(1, -1)) - 1)}>{token}</button>;
          return <span key={tokenIndex}>{token}</span>;
        })}</span>
      </p>;
    })}</div>;
  })}</div>;
}

export function ChatMessage({ message, documents, onSource }: {
  message: Message; documents: PdfDocument[]; onSource: (source: Source) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const edit = useEditMessage();
  const feedback = useFeedback();
  const isUser = message.role === "user";
  function saveEdit() {
    edit.mutate({ id: message.id, content: draft.trim() }, {
      onSuccess: () => { toast.success("Message updated"); setEditing(false); },
      onError: () => toast.error("Could not update message"),
    });
  }
  async function copy() {
    try { await navigator.clipboard.writeText(message.content); toast.success("Copied to clipboard"); }
    catch { toast.error("Clipboard access failed"); }
  }

  return <div className={`message-line ${isUser ? "user" : ""}`}>
    {!isUser && <span className="avatar bot"><Bot size={27} /></span>}
    <div className="flex max-w-full flex-col gap-2" style={{ minWidth: 0 }}>
      <div className="message-bubble" style={{ maxWidth: "100%" }}>
        {editing ? <div className="space-y-3"><textarea autoFocus aria-label="Edit message" value={draft} onChange={(event) => setDraft(event.target.value)} rows={3} className="w-full min-w-56 rounded-md border-2 border-blue-500 bg-white p-2 outline-none focus:ring-2 focus:ring-blue-200" /><div className="flex justify-end gap-2"><button className="flex items-center gap-1 rounded-md border border-black px-3 py-2 text-sm font-bold" onClick={() => { setEditing(false); setDraft(message.content); }}><X size={14} /> Cancel</button><button disabled={!draft.trim() || edit.isPending} className="flex items-center gap-1 rounded-md border border-black bg-[#8acaff] px-3 py-2 text-sm font-bold" onClick={saveEdit}><Check size={14} /> Save</button></div></div>
          : <RichText content={message.content} onCitation={(index) => { const source = message.sources[index]; if (source) onSource(source); }} />}
        {!isUser && message.sources.length > 0 && <div className="mt-4"><strong className="mb-2 block text-sm">Sources:</strong><div className="flex flex-wrap gap-2">{message.sources.map((source) => {
          const doc = documents.find((item) => item.id === source.documentId);
          if (!doc) return null;
          return <button key={`${source.documentId}-${source.page}`} className={`flex min-w-0 items-center gap-2 rounded-lg border-2 px-2 py-1.5 text-left text-xs hover:brightness-95 ${doc.accent}`} onClick={() => onSource(source)}><PdfIcon accent={doc.accent} small /><span className="min-w-0"><strong className="block max-w-36 truncate">{doc.name}</strong><span>Page {source.page}</span></span></button>;
        })}</div></div>}
        <div className="mt-2 text-right text-xs text-muted">{shortTime(message.createdAt)}</div>
      </div>
      {!editing && <div className="flex items-center gap-2 px-1">
        {isUser ? <button title="Edit message" aria-label="Edit message" className="icon-button" onClick={() => { setDraft(message.content); setEditing(true); }}><Pencil size={17} /></button> : <>
          <button aria-label="Good response" title="Good response" className={`icon-button ${message.feedback === "up" ? "bg-blue-200" : ""}`} onClick={() => feedback.mutate({ id: message.id, rating: "up" })}><ThumbsUp size={17} /></button>
          <button aria-label="Poor response" title="Poor response" className={`icon-button ${message.feedback === "down" ? "bg-blue-200" : ""}`} onClick={() => feedback.mutate({ id: message.id, rating: "down" })}><ThumbsDown size={17} /></button>
        </>}
        <button aria-label="Copy message" title="Copy message" className="icon-button" onClick={copy}><Copy size={17} /></button>
      </div>}
    </div>
    {isUser && <span className="avatar"><UserRound size={27} /></span>}
  </div>;
}
