import { MobileConversationView } from "@/components/mobile/MobileConversationView";

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ userId?: string }>;
}) {
  const [{ sessionId }, { userId }] = await Promise.all([params, searchParams]);

  return <MobileConversationView initialSessionId={sessionId} userId={userId ?? null} />;
}
