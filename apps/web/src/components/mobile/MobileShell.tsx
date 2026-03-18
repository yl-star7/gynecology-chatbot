"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import {
  clearMobileSession,
  readStoredMobileProfile,
} from "@/lib/mobile/mobile-session";

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
}: {
  children: ReactNode;
  title: string;
  description: string;
  userId?: string | null;
  showTitleBlock?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const profile = readStoredMobileProfile();
  const displayName = profile?.displayName ?? "임부 사용자";
  const profileMeta =
    profile?.pregnancyWeekLabel ??
    profile?.phoneNumber ??
    "상담과 기록을 이어가는 중";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 py-6 sm:px-6">
      <header className="mb-4 rounded-[28px] border border-[var(--line)] bg-[var(--panel)] p-4 shadow-[var(--shadow)]">
        <div className="flex items-center justify-between gap-3">
          <Link
            href={withUserId("/profile", userId)}
            className="min-w-0 rounded-full transition hover:opacity-90"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent-dark)]">
                {displayName.slice(0, 1)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-[var(--text)]">
                  {displayName}
                </p>
                <p className="truncate text-sm text-[var(--text-soft)]">
                  {profileMeta}
                </p>
              </div>
            </div>
          </Link>
          <button
            className="rounded-full border border-[var(--line)] bg-[var(--panel-strong)] px-4 py-2 text-sm font-medium text-[var(--text)] transition"
            onClick={() => {
              clearMobileSession();
              router.replace("/auth/login");
            }}
            type="button"
          >
            로그아웃
          </button>
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
        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {[
            { href: "/", label: "홈" },
            { href: "/chat/new", label: "상담" },
            { href: "/knowledge", label: "지식" },
            { href: "/notebook", label: "수첩" },
            { href: "/profile", label: "프로필" },
          ].map((item) => {
            const href = withUserId(item.href, userId);
            const isActive = currentPath === href || pathname === item.href;

            return (
              <Link
                key={item.href}
                href={href}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-[var(--accent)] text-white"
                    : "border border-[var(--line)] bg-[var(--panel-strong)] text-[var(--text)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="flex-1">{children}</div>
    </main>
  );
}
