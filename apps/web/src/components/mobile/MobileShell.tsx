"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { clearMobileSession, readStoredMobileProfile } from "@/lib/mobile/mobile-session";

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
}: {
  children: ReactNode;
  title: string;
  description: string;
  userId?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const profile = readStoredMobileProfile();
  const displayName = profile?.displayName ?? "임부 사용자";
  const profileMeta = profile?.pregnancyWeekLabel ?? profile?.phoneNumber ?? "상담과 기록을 이어가는 중";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 py-6 sm:px-6">
      <div className="mb-4 rounded-[28px] border border-[var(--line)] bg-[rgba(255,255,255,0.72)] p-4 shadow-[var(--shadow)] backdrop-blur">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent-dark)]">User Mobile Web</p>
        <div className="grid gap-4">
          <div className="flex flex-col gap-3 rounded-[24px] border border-[var(--line)] bg-white/80 p-4 sm:flex-row sm:items-start sm:justify-between">
            <Link href={withUserId("/profile", userId)} className="min-w-0 rounded-[20px] transition hover:bg-[rgba(20,34,20,0.03)] sm:flex-1 sm:p-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">Profile</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent-dark)]">
                  {displayName.slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-[var(--text)]">{displayName}</p>
                  <p className="truncate text-sm text-[var(--text-soft)]">{profileMeta}</p>
                </div>
              </div>
            </Link>
            <div className="flex flex-wrap gap-2">
              <Link
                href={withUserId("/profile", userId)}
                className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:bg-white"
              >
                프로필 보기
              </Link>
              <Link
                href={withUserId("/admin", userId)}
                className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:bg-white"
              >
                관리자
              </Link>
              <button
                className="rounded-full border border-[var(--line)] bg-white/70 px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:bg-white"
                onClick={() => {
                  clearMobileSession();
                  router.replace("/auth/login");
                }}
                type="button"
              >
                로그아웃
              </button>
            </div>
          </div>
          <div>
            <h1 className="text-[26px] font-semibold tracking-[-0.03em] text-[var(--text)]">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{description}</p>
          </div>
        </div>
        <nav className="mt-4 flex flex-wrap gap-2">
          {[
            { href: "/", label: "홈" },
            { href: "/profile", label: "프로필" },
            { href: "/chat/new", label: "새 상담" },
            { href: "/notebook", label: "임신수첩" },
            { href: "/knowledge", label: "임신 지식" },
          ].map((item) => {
            const href = withUserId(item.href, userId);
            const isActive = currentPath === href || pathname === item.href;

            return (
              <Link
                key={item.href}
                href={href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-[var(--accent)] text-white"
                    : "border border-[var(--line)] bg-white/80 text-[var(--text)] hover:bg-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex-1">{children}</div>
    </main>
  );
}
