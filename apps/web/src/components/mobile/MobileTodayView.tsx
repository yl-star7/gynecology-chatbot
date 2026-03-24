"use client";

import type { HomeViewData, RecentChatSummary } from "@gynecology-chatbot/app-core";
import { useEffect, useState } from "react";
import { fetchHome, fetchSessions } from "@/lib/mobile/web-mobile-api";
import { MobileShell } from "./MobileShell";
import { buildWebPatientTodayViewModel } from "./mobile-patient-view-models";
import { useMobileSessionGuard } from "./useMobileSessionGuard";

export function MobileTodayView({
  userId,
}: {
  userId: string | null;
}) {
  const resolvedUserId = useMobileSessionGuard(userId);
  const [home, setHome] = useState<HomeViewData | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentChatSummary[]>([]);
  const [activeSection, setActiveSection] = useState("baby-mom");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!resolvedUserId) {
      return;
    }

    Promise.all([fetchHome(resolvedUserId), fetchSessions(resolvedUserId)])
      .then(([homePayload, sessionListPayload]) => {
        setHome(homePayload.home);
        setRecentSessions(sessionListPayload.sessions);
      })
      .catch((nextError) => {
        setError(nextError instanceof Error ? nextError.message : "오늘 흐름을 불러오지 못했어요.");
      });
  }, [resolvedUserId]);

  const viewModel = buildWebPatientTodayViewModel({
    home,
    session: null,
    recentSessions,
  });

  return (
    <MobileShell
      title="오늘,우리"
      description={error ?? "오늘 아기와 엄마의 흐름을 한 화면에서 이어가요."}
      userId={resolvedUserId}
      showChatFab={false}
    >
      <div className="grid gap-4">
        <div className="flex flex-wrap gap-2 rounded-[28px] bg-white/50 p-1">
          {viewModel.sections.map((section) => {
            const isConversation = section.id === "conversation";
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => {
                  if (isConversation) {
                    window.location.href = resolvedUserId
                      ? `/chat/heart-talk?userId=${encodeURIComponent(resolvedUserId)}`
                      : "/chat/heart-talk";
                    return;
                  }
                  setActiveSection(section.id);
                }}
                className={`flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold ${
                  activeSection === section.id
                    ? "bg-[var(--accent-soft)] text-[var(--accent-dark)]"
                    : "bg-[var(--panel-strong)] text-[var(--text-soft)]"
                }`}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-full ${
                  activeSection === section.id ? "bg-white text-[var(--accent-dark)]" : "bg-[var(--panel-muted)] text-[var(--text-soft)]"
                }`}>
                  {section.id === "baby-mom" ? "◉" : section.id === "checklist" ? "✓" : "✉"}
                </span>
                {section.label}
              </button>
            );
          })}
        </div>

        {activeSection === "baby-mom" ? (
          <section className="grid gap-4">
            <div className="rounded-[28px] border border-[var(--line)] bg-[var(--panel-strong)] p-6 shadow-[var(--shadow)]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[18px] text-[var(--accent)]">✦</div>
                <h2 className="text-xl font-semibold text-[var(--text)]">오늘 아기는요</h2>
              </div>
              <div className="mt-4 rounded-[20px] bg-[var(--panel-muted)] px-4 py-4">
                <p className="text-sm leading-7 text-[var(--text-soft)]">{viewModel.babyText}</p>
              </div>
            </div>

            <div className="rounded-[28px] border border-[var(--line)] bg-[var(--panel-strong)] p-6 shadow-[var(--shadow)]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--panel-muted)] text-[18px] text-[var(--accent)]">♡</div>
                <h2 className="text-xl font-semibold text-[var(--text)]">오늘 엄마는요</h2>
              </div>
              <div className="mt-4 rounded-[20px] bg-[var(--panel-muted)] px-4 py-4">
                <p className="text-sm leading-7 text-[var(--text-soft)]">{viewModel.momText}</p>
              </div>
            </div>
          </section>
        ) : null}

        {activeSection === "checklist" ? (
          <section className="rounded-[28px] border border-[var(--line)] bg-[var(--panel-strong)] p-6 shadow-[var(--shadow)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--panel-muted)] text-[18px] text-[var(--success)]">✓</div>
                <h2 className="text-xl font-semibold text-[var(--text)]">오늘의 체크리스트</h2>
              </div>
              <span className="text-sm font-semibold text-[var(--success)]">0%</span>
            </div>
            <div className="mt-6 grid gap-8">
              {viewModel.checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="h-6 w-6 rounded-[7px] border border-[#d9dde5] bg-[#f8f9fb]" />
                  <p className="text-[16px] font-semibold text-[#30313a]">{item.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 border-t border-[var(--line)] pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[var(--text-soft)]">완료율</p>
                <p className="text-sm font-semibold text-[var(--success)]">0%</p>
              </div>
              <div className="mt-4 h-[10px] rounded-full bg-[#e7eaf0]" />
            </div>
          </section>
        ) : null}
      </div>
    </MobileShell>
  );
}
