import { requireAdminSession } from "@/lib/admin/auth";
import { AdminChatsSection } from "@/components/admin/AdminChatsSection";

import { fetchChatUsersList } from "./_lib/load-chat-data";
import ChatsPageClient from "./_components/ChatsPageClient";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: Promise<{ query?: string }>;
}

export default async function AdminChatsIndexPage({ searchParams }: PageProps) {
  const admin = await requireAdminSession();
  const resolvedSearchParams = (await searchParams) ?? {};
  const query = (resolvedSearchParams.query ?? "").trim();

  const { rows, totalMatched, pageSize } = await fetchChatUsersList(query, 50);

  return (
    <ChatsPageClient
      adminDisplayName={admin.displayName}
      currentPath="/admin/chats"
      title="채팅 로그 · 유저 목록"
    >
      <AdminChatsSection
        users={rows}
        initialQuery={query}
        totalMatched={totalMatched}
        pageSize={pageSize}
      />
    </ChatsPageClient>
  );
}
