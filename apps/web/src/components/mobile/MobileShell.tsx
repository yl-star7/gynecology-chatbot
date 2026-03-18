"use client";

import {
  DEFAULT_MOBILE_THEME_KEY,
  type MobileThemeKey,
} from "@gynecology-chatbot/app-core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  clearMobileSession,
  readStoredMobileThemeKey,
  readStoredMobileProfile,
  storeMobileThemeKey,
} from "@/lib/mobile/mobile-session";
import { applyMobileTheme } from "@/lib/mobile/themes";
import { MobileThemePresetButtons } from "./MobileThemePresetButtons";

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
  headerMode = "default",
}: {
  children: ReactNode;
  title: string;
  description: string;
  userId?: string | null;
  showTitleBlock?: boolean;
  headerMode?: "default" | "compact";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const profile = readStoredMobileProfile();
  const [themeKey, setThemeKey] = useState(
    () => readStoredMobileThemeKey() ?? DEFAULT_MOBILE_THEME_KEY,
  );
  const displayName = profile?.displayName ?? "임부 사용자";
  const profileMeta =
    profile?.pregnancyWeekLabel ??
    profile?.phoneNumber ??
    "채팅과 기록을 이어가는 중";
  const isCompactHeader = headerMode === "compact";
  const navigationItems = [
    { href: "/", label: "홈" },
    { href: "/chat/new", label: "채팅" },
    { href: "/knowledge", label: "지식" },
    { href: "/notebook", label: "수첩" },
    ...(isCompactHeader ? [] : [{ href: "/profile", label: "프로필" }]),
  ];

  useEffect(() => {
    const storedThemeKey = readStoredMobileThemeKey();
    if (storedThemeKey) {
      setThemeKey(storedThemeKey);
    }
  }, []);

  useEffect(() => {
    applyMobileTheme(themeKey);
  }, [themeKey]);

  function handleThemeSelect(nextThemeKey: MobileThemeKey) {
    setThemeKey(nextThemeKey);
    storeMobileThemeKey(nextThemeKey);
    applyMobileTheme(nextThemeKey);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 py-6 sm:px-6">
      <header className="mb-4 rounded-[28px] border border-[var(--line)] bg-[var(--panel)] p-4 shadow-[var(--shadow)]">
        <div className="flex items-center justify-between gap-3">
          {isCompactHeader ? (
            <Link
              href={withUserId("/profile", userId)}
              aria-label="프로필 열기"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent-dark)] transition hover:opacity-90"
            >
              {displayName.slice(0, 1)}
            </Link>
          ) : (
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
          )}
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
        <div className="mt-4">
          <MobileThemePresetButtons
            compact
            label="빠른 테마"
            onSelect={handleThemeSelect}
            selectedThemeKey={themeKey}
          />
        </div>
        <nav
          aria-label="모바일 기본 탐색"
          className="mt-4 flex gap-2 overflow-x-auto pb-1"
        >
          {navigationItems.map((item) => {
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
