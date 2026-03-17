"use client";

import type { RecordDayView } from "@gynecology-chatbot/app-core";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchRecordDay, resolveMobileUserId, appendUserIdToPath } from "@/lib/mobile/web-mobile-api";
import { MobileShell } from "./MobileShell";
import { useMobileSessionGuard } from "./useMobileSessionGuard";

function describeEntryType(entryType: string) {
  switch (entryType) {
    case "chat_saved":
      return "상담 저장";
    case "symptom_note":
      return "증상 메모";
    case "ai_summary":
      return "AI 요약";
    case "emotion_checkin":
      return "감정 체크인";
    default:
      return entryType;
  }
}

export function MobileRecordDayView({
  isoDate,
  userId,
}: {
  isoDate: string;
  userId?: string | null;
}) {
  const resolvedUserId = useMobileSessionGuard(resolveMobileUserId(userId ?? null));
  const [recordDay, setRecordDay] = useState<RecordDayView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!resolvedUserId) {
      return;
    }

    let cancelled = false;

    fetchRecordDay(resolvedUserId, isoDate)
      .then((payload) => {
        if (!cancelled) {
          setRecordDay(payload.recordDay);
          setError(null);
        }
      })
      .catch((nextError) => {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "기록 상세를 불러오지 못했습니다.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isoDate, resolvedUserId]);

  return (
    <MobileShell
      title={recordDay?.dateLabel ?? isoDate}
      description={error ?? "이 날짜에 저장된 상담 메모, 감정 기록, 연결 세션을 확인합니다."}
      userId={resolvedUserId}
    >
      <div className="grid gap-4">
        <section className="rounded-[28px] border border-[var(--line)] bg-[var(--panel-strong)] p-5 shadow-[var(--shadow)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">Day Summary</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] bg-[var(--accent-soft)] p-4">
              <p className="text-sm text-[var(--text-soft)]">기준 날짜</p>
              <p className="mt-2 text-xl font-semibold text-[var(--text)]">{recordDay?.dateLabel ?? isoDate}</p>
            </div>
            <div className="rounded-[22px] bg-[rgba(20,34,20,0.05)] p-4">
              <p className="text-sm text-[var(--text-soft)]">감정 기록</p>
              <p className="mt-2 text-xl font-semibold text-[var(--text)]">{recordDay?.emotionTone ?? "기록 없음"}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[var(--line)] bg-white/85 p-5 shadow-[var(--shadow)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">Records</p>
          <div className="mt-4 grid gap-3">
            {recordDay && recordDay.records.length > 0 ? (
              recordDay.records.map((record) => (
                <article key={record.id} className="rounded-[22px] border border-[var(--line)] bg-[rgba(20,34,20,0.03)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-[var(--text)]">{record.title}</p>
                    <span className="text-xs text-[var(--text-soft)]">{describeEntryType(record.entryType)}</span>
                  </div>
                  {record.summary ? <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{record.summary}</p> : null}
                  {record.linkedSessionId ? (
                    <Link
                      href={appendUserIdToPath(`/chat/${record.linkedSessionId}`, resolvedUserId)}
                      className="mt-3 inline-flex rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
                    >
                      연결 상담 보기
                    </Link>
                  ) : null}
                </article>
              ))
            ) : (
              <p className="rounded-[20px] border border-dashed border-[var(--line)] p-4 text-sm text-[var(--text-soft)]">
                이 날짜에 저장된 메모나 요약 기록이 없습니다.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-[28px] border border-[var(--line)] bg-white/85 p-5 shadow-[var(--shadow)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">Related Sessions</p>
          <div className="mt-4 grid gap-3">
            {recordDay && recordDay.relatedSessions.length > 0 ? (
              recordDay.relatedSessions.map((session) => (
                <Link
                  key={session.id}
                  href={appendUserIdToPath(`/chat/${session.id}`, resolvedUserId)}
                  className="rounded-[20px] border border-[var(--line)] bg-[rgba(20,34,20,0.03)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--text)]">{session.title}</p>
                      <p className="mt-1 text-sm text-[var(--text-soft)]">{session.preview}</p>
                    </div>
                    <span className="text-xs text-[var(--text-soft)]">{session.updatedAtLabel}</span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="rounded-[20px] border border-dashed border-[var(--line)] p-4 text-sm text-[var(--text-soft)]">
                연결된 상담 세션이 없습니다.
              </p>
            )}
          </div>
        </section>
      </div>
    </MobileShell>
  );
}
