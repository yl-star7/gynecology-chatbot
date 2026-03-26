"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { readStoredMobileProfile } from "@/lib/mobile/mobile-session";

function withUserId(path: string, userId?: string | null) {
  if (!userId) {
    return path;
  }

  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}userId=${encodeURIComponent(userId)}`;
}

export function MobileShell({
  children,
  userId,
  pageTone = "plain",
}: {
  children: ReactNode;
  title: string;
  description: string;
  userId?: string | null;
  backHref?: string | null;
  backLabel?: string;
  showTitleBlock?: boolean;
  showChatFab?: boolean;
  pageTone?: "main" | "plain";
}) {
  const [displayName, setDisplayName] = useState("임부");
  const profileHref = withUserId("/profile", userId);
  const todayHref = withUserId("/today", userId);
  const homeHref = withUserId("/", userId);

  useEffect(() => {
    const profile = readStoredMobileProfile();
    if (profile?.displayName) {
      setDisplayName(profile.displayName);
    }
  }, []);

  return (
    <main className={`mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 py-4 sm:px-6 ${pageTone === "main" ? "bg-[var(--bg)]" : "bg-white"}`}>
      <header className="mb-4 flex items-center justify-end gap-3">

        {userId ? (
          <Link
            href={profileHref}
            aria-label="마이페이지 열기"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent-dark)]"
          >
            {displayName.slice(0, 1)}
          </Link>
        ) : (
          <div className="h-10 w-10" />
        )}
      </header>

      <div className="flex-1 pb-28">{children}</div>

      <nav className="fixed bottom-5 left-1/2 z-50 flex w-[min(92vw,32rem)] -translate-x-1/2 items-center justify-between rounded-full border border-[var(--line)] bg-[var(--panel-strong)] px-2 py-2 shadow-[var(--shadow)] backdrop-blur">
        <TabLink href={homeHref} label="홈" />
        <TabLink href={todayHref} label="오늘,우리" />
        <TabLink href={profileHref} label="마이페이지" />
      </nav>
    </main>
  );
}

function TabLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-w-[5.75rem] items-center justify-center rounded-full px-4 py-3 text-sm font-semibold text-[var(--text)]"
    >
      {label}
    </Link>
  );
}
