import { MobileChatView } from "@/components/mobile/MobileChatView";

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ userId?: string }>;
}) {
  const [{ sessionId }, { userId }] = await Promise.all([params, searchParams]);

  return <MobileChatView initialSessionId={sessionId} userId={userId ?? null} />;
}
