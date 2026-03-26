"use client";

import type { RecordDayView } from "@gynecology-chatbot/app-core";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchRecordDay, resolveMobileUserId, appendUserIdToPath } from "@/lib/mobile/web-mobile-api";
import { MobileCard, mobileInsetCardClassName, MobileSectionIntro } from "./MobilePrimitives";
import { MobileShell } from "./MobileShell";
import { useMobileSessionGuard } from "./useMobileSessionGuard";

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
          setError(nextError instanceof Error ? nextError.message : "기록을 불러오지 못했어요.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isoDate, resolvedUserId]);

  return (
    <MobileShell
      title="하루 기록"
      description="이 날짜의 체크와 대화를 날짜 기준으로 모아봤어요."
      userId={resolvedUserId}
      showTitleBlock={false}
      showChatFab
      pageTone="plain"
    >
      <div className="grid gap-4">
        <MobileCard className="p-5">
          <MobileSectionIntro
            eyebrow="하루 기록"
            title={recordDay?.dateLabel ?? isoDate}
            description={error ?? "이 날짜의 체크와 대화를 날짜 기준으로 모아봤어요."}
          />
        </MobileCard>

        <MobileCard className="p-5">
          <p className="text-sm font-semibold text-[var(--text)]">체크리스트</p>
          <div className="mt-4 grid gap-3">
            {recordDay && recordDay.checklistItems.length > 0 ? (
              recordDay.checklistItems.map((item) => (
                <div key={item.id} className={`${mobileInsetCardClassName} flex items-center gap-4 p-4`}>
                  <div
                    className={`h-6 w-6 rounded-[7px] border ${
                      item.completed
                        ? "border-[var(--success)] bg-[#dff3e4]"
                        : "border-[#d6d8de] bg-[#f3f3f5]"
                    }`}
                  />
                  <p className="font-medium text-[var(--text)]">{item.label}</p>
                </div>
              ))
            ) : null}
            {!recordDay || recordDay.checklistItems.length === 0 ? (
              <p className="rounded-[20px] border border-dashed border-[var(--line)] p-4 text-sm text-[var(--text-soft)]">
                이 날짜에 예정된 체크 항목이 없어요.
              </p>
            ) : null}
          </div>
        </MobileCard>

        <MobileCard className="p-5">
          <p className="text-sm font-semibold text-[var(--text)]">대화</p>
          <div className="mt-4 grid gap-3">
            {recordDay && recordDay.relatedSessions.length > 0 ? (
              recordDay.relatedSessions.map((session) => (
                <Link
                  key={session.id}
                  href={appendUserIdToPath(`/chat/${session.id}`, resolvedUserId)}
                  className={`${mobileInsetCardClassName} p-4`}
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
            ) : null}
            {!recordDay || recordDay.relatedSessions.length === 0 ? (
              <p className="rounded-[20px] border border-dashed border-[var(--line)] p-4 text-sm text-[var(--text-soft)]">
                이 날짜에 남겨진 대화가 없어요.
              </p>
            ) : null}
          </div>
        </MobileCard>
      </div>
    </MobileShell>
  );
}
