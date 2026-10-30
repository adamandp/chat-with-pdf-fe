import type { ChatMessage } from "@/features/common/types";

const stamp = "2026-10-30T08:24:00Z";
export const messages: ChatMessage[] = [
  {
    id: "msg-1", sessionId: "session-1", role: "user", createdAt: stamp,
    content: "What are the key financial highlights from these three annual reports?", sources: [],
  },
  {
    id: "msg-2", sessionId: "session-1", role: "assistant", createdAt: stamp,
    content: "Here are the key financial highlights from the three annual reports:\n\n1. **Revenue Growth**\nAll three companies showed consistent revenue growth over the past three years, with Company A leading at 12.4% CAGR [1], followed by Company B at 9.8% [2], and Company C at 7.1% [3].\n\n2. **Profitability**\nCompany A achieved the highest net profit margin at 18.2% in 2023 [1], while Company B and C recorded 14.6% [2] and 11.3% [3] respectively.\n\n3. **Key Drivers**\nThe growth was primarily driven by increased market share [1][2] and operational efficiency improvements [3].",
    sources: [{ documentId: "doc-1", page: 12 }, { documentId: "doc-2", page: 8 }, { documentId: "doc-3", page: 15 }],
  },
];
