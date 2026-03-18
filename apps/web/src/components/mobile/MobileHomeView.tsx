"use client";

import type {
  HomeViewData,
  RecentChatSummary,
} from "@gynecology-chatbot/app-core";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchHome, fetchSessions } from "@/lib/mobile/web-mobile-api";
import { storeMobileProfile } from "@/lib/mobile/mobile-session";
import { MobileShell } from "./MobileShell";
import { useMobileSessionGuard } from "./useMobileSessionGuard";

function linkWithUserId(path: string, userId: string) {
  return `${path}?userId=${encodeURIComponent(userId)}`;
}

function getCalendarDotClass(
  emotionTone: HomeViewData["calendarDays"][number]["emotionTone"],
  hasChat: boolean,
) {
  if (emotionTone === "joyful") {
    return "bg-emerald-500";
  }

  if (emotionTone === "calm") {
    return "bg-sky-500";
  }

  if (emotionTone === "tired") {
    return "bg-amber-500";
  }

  if (emotionTone === "anxious") {
    return "bg-rose-500";
  }

  if (emotionTone === "sad") {
    return "bg-slate-500";
  }

  return hasChat ? "bg-[var(--accent)]" : "bg-transparent";
}

export function MobileHomeView({ userId }: { userId: string | null }) {
  const resolvedUserId = useMobileSessionGuard(userId);
  const [home, setHome] = useState<HomeViewData | null>(null);
  const [sessions, setSessions] = useState<RecentChatSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.PhedyNative?.setTitle?.("부인과 상담 앱");
  }, []);

  useEffect(() => {
    if (!resolvedUserId) {
      return;
    }

    let cancelled = false;

    Promise.all([fetchHome(resolvedUserId), fetchSessions(resolvedUserId)])
      .then(([homePayload, sessionPayload]) => {
        if (cancelled) {
          return;
        }

        setHome(homePayload.home);
        setSessions(sessionPayload.sessions.slice(0, 4));
        storeMobileProfile({
          displayName: homePayload.home.userName,
          pregnancyWeekLabel: homePayload.home.pregnancyWeekLabel,
        });
        setError(null);
      })
      .catch((nextError) => {
        if (!cancelled) {
          setError(
            nextError instanceof Error
              ? nextError.message
              : "홈 화면을 불러오지 못했습니다.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [resolvedUserId]);

  return (
    <MobileShell
      title={home ? `${home.userName}님, 오늘도 기록을 이어가세요.` : "홈"}
      description={
        error ??
        "오늘 상태와 이번 주 핵심 정보를 먼저 보고, 바로 상담으로 이어집니다."
      }
      userId={resolvedUserId}
      showTitleBlock={false}
    >
      <div className="grid gap-4">
        <section className="rounded-[32px] border border-[var(--line)] bg-[var(--panel-strong)] p-6 shadow-[var(--shadow)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-dark)]">
            Today
          </p>
          <h1 className="mt-3 text-[32px] font-semibold tracking-[-0.04em] text-[var(--text)]">
            {home
              ? `${home.userName}님, 오늘은 ${home.pregnancyWeekLabel}`
              : "오늘 상태를 불러오는 중입니다."}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
            {error ??
              "아기 상태와 오늘 확인할 내용을 먼저 보고, 필요하면 바로 상담으로 이어가세요."}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] bg-[var(--accent-soft)] p-4">
              <p className="text-sm text-[var(--text-soft)]">현재 주차</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--text)]">
                {home?.pregnancyWeekLabel ?? "연결 중"}
              </p>
            </div>
            <div className="rounded-[24px] bg-[var(--panel-muted)] p-4">
              <p className="text-sm text-[var(--text-soft)]">임신 일차</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--text)]">
                {home ? `${home.pregnancyDayCount}일` : "데이터 확인 중"}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {resolvedUserId ? (
              <Link
                href={linkWithUserId("/chat/new", resolvedUserId)}
                className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
              >
                지금 상담하기
              </Link>
            ) : null}
            {resolvedUserId ? (
              <Link
                href={linkWithUserId("/knowledge", resolvedUserId)}
                className="rounded-full border border-[var(--line)] bg-[var(--panel-strong)] px-5 py-3 text-sm font-semibold text-[var(--text)]"
              >
                이번 주 지식 보기
              </Link>
            ) : null}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {[
            {
              eyebrow: "Today",
              title: home?.notebookCard.title ?? "임신수첩",
              body:
                home?.notebookCard.description ??
                "오늘 해야 할 체크리스트와 저장 기록을 확인합니다.",
              href: "/notebook",
            },
            {
              eyebrow: "This Week",
              title: home?.knowledgeCard.title ?? "임신 지식",
              body:
                home?.knowledgeCard.description ??
                "이번 주 변화와 놓치면 안 될 위험 신호를 먼저 봅니다.",
              href: "/knowledge",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={
                resolvedUserId
                  ? linkWithUserId(item.href, resolvedUserId)
                  : item.href
              }
              className="rounded-[28px] border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[var(--shadow)] transition"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-dark)]">
                {item.eyebrow}
              </p>
              <p className="mt-3 text-xl font-semibold text-[var(--text)]">
                {item.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                {item.body}
              </p>
            </Link>
          ))}
        </section>

        <section className="rounded-[28px] border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">
                Continue
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--text)]">
                최근 상담 이어가기
              </h2>
            </div>
            {resolvedUserId ? (
              <Link
                href={linkWithUserId("/chat/new", resolvedUserId)}
                className="text-sm font-semibold text-[var(--accent-dark)]"
              >
                새 상담
              </Link>
            ) : null}
          </div>
          <div className="mt-4 grid gap-3">
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <Link
                  key={session.id}
                  href={
                    resolvedUserId
                      ? linkWithUserId(`/chat/${session.id}`, resolvedUserId)
                      : `/chat/${session.id}`
                  }
                  className="rounded-[20px] border border-[var(--line)] bg-[var(--panel-muted)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--text)]">
                        {session.title}
                      </p>
                      <p className="mt-1 text-sm text-[var(--text-soft)]">
                        {session.preview}
                      </p>
                    </div>
                    <span className="text-xs text-[var(--text-soft)]">
                      {session.updatedAtLabel}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="rounded-[20px] border border-dashed border-[var(--line)] p-4 text-sm text-[var(--text-soft)]">
                아직 상담 세션이 없습니다. 첫 상담을 시작하면 여기에 누적됩니다.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-[28px] border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">
                Calendar
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--text)]">
                {home?.currentMonthLabel ?? "이번 달 기록"}
              </h2>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-2">
            {(home?.calendarDays ?? []).map((day) => {
              const clickable =
                day.hasChat || Boolean(day.emotionTone) || Boolean(day.summary);
              const className = `flex aspect-square flex-col items-center justify-center rounded-[18px] border text-center ${
                day.hasChat
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-[var(--line)] bg-[var(--panel-muted)]"
              }`;

              if (!clickable) {
                return (
                  <div
                    key={day.isoDate}
                    className={className}
                    title={day.summary ?? day.isoDate}
                  >
                    <span className="text-sm font-medium text-[var(--text)]">
                      {day.dayLabel}
                    </span>
                    <span className="mt-1 flex h-3 items-center justify-center">
                      <span className="h-2 w-2 rounded-full bg-transparent" />
                    </span>
                  </div>
                );
              }

              return (
                <Link
                  key={day.isoDate}
                  href={
                    resolvedUserId
                      ? linkWithUserId(
                          `/records/${day.isoDate}`,
                          resolvedUserId,
                        )
                      : `/records/${day.isoDate}`
                  }
                  className={className}
                  title={day.summary ?? day.isoDate}
                >
                  <span className="text-sm font-medium text-[var(--text)]">
                    {day.dayLabel}
                  </span>
                  <span className="mt-1 flex h-3 items-center justify-center">
                    <span
                      className={`h-2 w-2 rounded-full ${getCalendarDotClass(day.emotionTone, day.hasChat)}`}
                    />
                  </span>
                </Link>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-[var(--text-soft)]">
            점이 표시된 날짜만 상담 기록 또는 메모가 있습니다.
          </p>
        </section>
      </div>
    </MobileShell>
  );
}
