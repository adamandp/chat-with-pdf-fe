import type { Session } from "@/features/common/types";

const recent = [
  ["session-1", "Q3 Financial Summary", "2026-10-30T08:00:00Z", ["doc-1", "doc-2", "doc-3"]],
  ["session-2", "Compare annual reports", "2026-10-29T08:00:00Z", ["doc-1", "doc-2"]],
  ["session-3", "Marketing strategy", "2026-10-28T08:00:00Z", ["doc-4", "doc-5"]],
  ["session-4", "Key findings", "2026-10-27T08:00:00Z", ["doc-3"]],
  ["session-5", "Product roadmap", "2026-10-25T08:00:00Z", ["doc-5"]],
  ["session-6", "Market overview", "2026-10-23T08:00:00Z", ["doc-4"]],
] as const;

export const sessions: Session[] = recent.map(([id, title, createdAt, documentIds]) => ({
  id, title, createdAt, updatedAt: createdAt, deletedAt: null, documentIds: [...documentIds],
}));

export const deletedSessions: Session[] = [
  ["deleted-chat-1", "Old financial summary"],
  ["deleted-chat-2", "Previous market review"],
  ["deleted-chat-3", "Early strategy notes"],
  ["deleted-chat-4", "Archived questions"],
  ["deleted-chat-5", "Draft comparison"],
].map(([id, title], index) => ({
  id, title, createdAt: new Date(Date.now() - (index + 5) * 86400000).toISOString(),
  updatedAt: new Date(Date.now() - (index + 1) * 86400000).toISOString(),
  deletedAt: new Date(Date.now() - (index + 1) * 86400000).toISOString(), documentIds: [],
}));
