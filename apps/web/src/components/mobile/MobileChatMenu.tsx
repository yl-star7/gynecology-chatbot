"use client";

import type { ChatSessionGroup } from "./mobile-chat-session-groups";
import Link from "next/link";

export function MobileChatMenu({
  currentSessionId,
  groups,
  homeHref,
  isOpen,
  onClose,
  userId,
}: {
  currentSessionId: string;
  groups: ChatSessionGroup[];
  homeHref: string;
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40">
      <button
        type="button"
        aria-label="메뉴 닫기"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(39,24,20,0.16)]"
      />
      <aside className="absolute inset-y-0 left-0 flex w-[82%] max-w-sm flex-col border-r border-[var(--line)] bg-[var(--panel)] px-5 pb-6 pt-5 shadow-[var(--shadow)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-dark)]">
              Menu
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--text)]">
              지난 상담
            </h2>
          </div>
          <button
            type="button"
            aria-label="메뉴 닫기"
            onClick={onClose}
            className="rounded-full border border-[var(--line)] px-3 py-2 text-sm font-medium text-[var(--text)]"
          >
            닫기
          </button>
        </div>

        <Link
          href={homeHref}
          onClick={onClose}
          className="mt-5 rounded-[20px] border border-[var(--line)] bg-[var(--panel)] px-4 py-4 text-base font-semibold text-[var(--text)]"
        >
          홈 가기
        </Link>

        <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="grid gap-5">
            {groups.length > 0 ? (
              groups.map((group) => (
                <section key={group.dateKey} className="grid gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">
                    {group.label}
                  </p>
                  <div className="grid gap-2">
                    {group.sessions.map((session) => (
                      <Link
                        key={session.id}
                        href={
                          userId
                            ? `/chat/${session.id}?userId=${encodeURIComponent(userId)}`
                            : `/chat/${session.id}`
                        }
                        onClick={onClose}
                        className={`rounded-[20px] border px-4 py-3 ${
                          session.id === currentSessionId
                            ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                            : "border-[var(--line)] bg-[var(--panel-strong)]"
                        }`}
                      >
                        <p className="font-medium text-[var(--text)]">
                          {session.title}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">
                          {session.preview}
                        </p>
                        <p className="mt-2 text-xs text-[var(--text-soft)]">
                          {session.updatedAtLabel}
                        </p>
                      </Link>
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <div className="rounded-[20px] border border-dashed border-[var(--line)] p-4 text-sm leading-6 text-[var(--text-soft)]">
                아직 저장된 상담이 없습니다.
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
