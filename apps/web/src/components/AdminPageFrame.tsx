"use client";

import type { ReactNode } from "react";

import { AdminConsoleShell } from "./admin/AdminConsoleShell";

interface AdminPageFrameProps {
  adminDisplayName: string;
  currentPath: string;
  title: string;
  children: ReactNode;
}

export default function AdminPageFrame({
  adminDisplayName,
  currentPath,
  title,
  children,
}: AdminPageFrameProps) {
  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <AdminConsoleShell
      adminDisplayName={adminDisplayName}
      currentPath={currentPath}
      title={title}
      onLogout={handleLogout}
    >
      {children}
    </AdminConsoleShell>
  );
}
