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
  title,
  description,
  userId,
  showTitleBlock = true,
  showChatFab = false,
}: {
  children: ReactNode;
  title: string;
  description: string;
  userId?: string | null;
  showTitleBlock?: boolean;
  showChatFab?: boolean;
}) {
  const [displayName, setDisplayName] = useState("임부 사용자");
  const profileHref = withUserId("/profile", userId);
  const chatHref = withUserId("/chat/new", userId);

  useEffect(() => {
    const profile = readStoredMobileProfile();
    if (profile?.displayName) {
      setDisplayName(profile.displayName);
    }
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 py-6 sm:px-6">
      <header className="mb-4 rounded-[28px] border border-[var(--line)] bg-[var(--panel-strong)] p-4 shadow-[var(--shadow)]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            {!showTitleBlock ? (
              <p className="text-sm font-medium text-[var(--text-soft)]">
                {title}
              </p>
            ) : null}
          </div>
          {userId ? (
            <Link
              href={profileHref}
              aria-label="프로필 열기"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent-dark)] transition hover:opacity-90"
            >
              {displayName.slice(0, 1)}
            </Link>
          ) : null}
        </div>
        {showTitleBlock ? (
          <div className="mt-4">
            <h1 className="text-[26px] font-semibold tracking-[-0.03em] text-[var(--text)]">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
              {description}
            </p>
          </div>
        ) : null}
      </header>

      <div className="flex-1 pb-24">{children}</div>

      {showChatFab && userId ? (
        <Link
          href={chatHref}
          aria-label="새 상담 시작"
          className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-semibold text-white shadow-[var(--shadow)]"
        >
          채팅
        </Link>
      ) : null}
    </main>
  );
}
