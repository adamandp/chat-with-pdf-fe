import { ChatScreen } from "@/components/chat/chat-screen";

export default async function SessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  return <ChatScreen sessionId={sessionId} />;
}
