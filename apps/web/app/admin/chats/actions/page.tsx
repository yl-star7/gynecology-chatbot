import { requireAdminSession } from "@/lib/admin/auth";
import { AdminChatActionsFeed } from "@/components/admin/AdminChatActionsFeed";

import ChatsPageClient from "../_components/ChatsPageClient";
import { fetchChatActions } from "../_lib/load-chat-data";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: Promise<{
    phoneNumber?: string;
    userId?: string;
    actionType?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function AdminChatActionsPage({
  searchParams,
}: PageProps) {
  const admin = await requireAdminSession();
  const resolved = (await searchParams) ?? {};

  const filters = {
    phoneNumber: (resolved.phoneNumber ?? "").trim(),
    userId: (resolved.userId ?? "").trim(),
    actionType: (resolved.actionType ?? "all").trim() || "all",
    from: (resolved.from ?? "").trim(),
    to: (resolved.to ?? "").trim(),
  };

  const limit = 200;
  const { actions, actionTypes } = await fetchChatActions(filters, limit);

  return (
    <ChatsPageClient
      adminDisplayName={admin.displayName}
      currentPath="/admin/chats/actions"
      title="채팅 로그 · 액션 로그"
    >
      <AdminChatActionsFeed
        actions={actions}
        actionTypes={actionTypes}
        initialFilters={filters}
        limit={limit}
      />
    </ChatsPageClient>
  );
}
