import { notFound } from "next/navigation";

import { requireAdminSession } from "@/lib/admin/auth";
import { AdminChatSessionMessages } from "@/components/admin/AdminChatSessionMessages";

import ChatsPageClient from "../../_components/ChatsPageClient";
import { fetchChatSessionMessages, isUuid } from "../../_lib/load-chat-data";
import { recordViewChatMessagesAudit } from "./_lib/write-view-audit";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ userId: string; sessionId: string }>;
}

export default async function AdminChatSessionDetailPage({
  params,
}: PageProps) {
  const admin = await requireAdminSession();
  const { userId, sessionId } = await params;

  if (!isUuid(userId) || !isUuid(sessionId)) {
    notFound();
  }

  const data = await fetchChatSessionMessages(userId, sessionId);
  if (!data) {
    notFound();
  }

  await recordViewChatMessagesAudit({
    actorUserId: admin.id,
    targetUserId: userId,
    sessionId,
  });

  return (
    <ChatsPageClient
      adminDisplayName={admin.displayName}
      currentPath={`/admin/chats/${userId}/${sessionId}`}
      title={`채팅 로그 · ${data.sessionTitle}`}
    >
      <AdminChatSessionMessages
        userId={userId}
        sessionId={sessionId}
        sessionTitle={data.sessionTitle}
        messages={data.messages}
      />
    </ChatsPageClient>
  );
}
