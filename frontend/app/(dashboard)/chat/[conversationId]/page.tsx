import { ChatLayout } from "@/components/chat/ChatLayout";

interface ConversationPageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { conversationId } = await params;
  return <ChatLayout conversationId={conversationId} />;
}
