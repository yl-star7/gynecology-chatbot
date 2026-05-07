import { notFound } from "next/navigation";

import { requireAdminSession } from "@/lib/admin/auth";
import { AdminChatUserDetail } from "@/components/admin/AdminChatUserDetail";

import ChatsPageClient from "../_components/ChatsPageClient";
import { fetchChatUserDetail } from "../_lib/load-chat-data";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function AdminChatUserDetailPage({ params }: PageProps) {
  const admin = await requireAdminSession();
  const { userId } = await params;

  const detail = await fetchChatUserDetail(userId);
  if (!detail) {
    notFound();
  }

  return (
    <ChatsPageClient
      adminDisplayName={admin.displayName}
      currentPath={`/admin/chats/${userId}`}
      title={`채팅 로그 · ${detail.profile.displayName ?? "유저"}`}
    >
      <AdminChatUserDetail
        profile={detail.profile}
        sessions={detail.sessions}
      />
    </ChatsPageClient>
  );
}
