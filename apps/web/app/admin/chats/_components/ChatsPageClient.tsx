"use client";

import type { ReactNode } from "react";

import AdminPageFrame from "@/components/AdminPageFrame";

interface ChatsPageClientProps {
  adminDisplayName: string;
  currentPath: string;
  title: string;
  children: ReactNode;
}

export default function ChatsPageClient({
  adminDisplayName,
  currentPath,
  title,
  children,
}: ChatsPageClientProps) {
  return (
    <AdminPageFrame
      adminDisplayName={adminDisplayName}
      currentPath={currentPath}
      title={title}
    >
      {children}
    </AdminPageFrame>
  );
}
