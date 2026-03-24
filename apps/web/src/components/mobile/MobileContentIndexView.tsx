"use client";

import type { MobileContentListItem } from "@gynecology-chatbot/app-core";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  appendUserIdToPath,
  fetchContentItems,
  fetchMobileProfile,
  resolveMobileUserId,
} from "@/lib/mobile/web-mobile-api";
import { readStoredMobileSessionToken } from "@/lib/mobile/mobile-session";
import { MobileCard } from "./MobilePrimitives";
import { MobileShell } from "./MobileShell";
import { getWeekBabyImagePath } from "./week-baby-images";
import { useMobileSessionGuard } from "./useMobileSessionGuard";

type WeekItem = {
  weekNumber: number;
  title: string;
  babySizeLabel: string | null;
  babySummary: string | null;
  motherSummary: string | null;
};

export function MobileContentIndexView({
  section,
  title,
  userId,
}: {
  section: "knowledge" | "notebook";
  title: string;
  userId: string | null;
}) {
  const searchParams = useSearchParams();
  const resolvedUserId = useMobileSessionGuard(
    resolveMobileUserId(userId ?? searchParams?.get("userId") ?? null),
  );
  const [items, setItems] = useState<MobileContentListItem[]>([]);
  const [weeks, setWeeks] = useState<WeekItem[]>([]);
  const [babyNickname, setBabyNickname] = useState<string | null>(null);
  const [pregnancyWeekLabel, setPregnancyWeekLabel] = useState<string | null>(null);
  const [tonePreference, setTonePreference] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetchContentItems(section)
      .then((payload) => {
        if (active) {
          setItems(payload.items);
          setError(null);
        }
      })
      .catch((nextError) => {
        if (active) {
          setError(
            nextError instanceof Error
              ? nextError.message
              : "목록을 불러오지 못했어요.",
          );
        }
      });

    if (resolvedUserId) {
      fetchMobileProfile(resolvedUserId)
        .then((payload) => {
          if (!active) {
            return;
          }
          setBabyNickname(payload.profile.babyNickname ?? null);
          setPregnancyWeekLabel(payload.profile.pregnancyWeekLabel);
          setTonePreference(payload.profile.tonePreference ?? null);
        })
        .catch(() => undefined);
    }

    if (section === "knowledge") {
      fetch("/api/mobile/weeks", {
        headers: {
          "Content-Type": "application/json",
          ...(readStoredMobileSessionToken()
            ? { Authorization: `Bearer ${readStoredMobileSessionToken()}` }
            : {}),
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (active && data.weeks) {
            setWeeks(data.weeks);
          }
        })
        .catch(() => undefined);
    }

    return () => {
      active = false;
    };
  }, [resolvedUserId, section]);

  const heroName = babyNickname?.trim() || "우리 아기";
  const babyImagePath = getWeekBabyImagePath(pregnancyWeekLabel);

  return (
    <MobileShell
      title={title}
      description={
        error ??
        (section === "knowledge"
          ? "오늘 아기와 엄마의 변화를 먼저 보고, 필요한 내용을 이어서 읽어보세요."
          : "남겨둔 기록을 다시 읽으면서 오늘의 흐름을 차분히 정리해보세요.")
      }
      userId={resolvedUserId}
      showTitleBlock={false}
      showChatFab
    >
      <div className="grid gap-4">
        <MobileCard as="header" className="rounded-[26px] p-5 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-dark)]">
            {section === "knowledge" ? "오늘 내용" : "기록과 회고"}
          </p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-[var(--text)]">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
            {error ??
              (section === "knowledge"
                ? "오늘 아기와 엄마의 변화를 먼저 보고, 필요한 내용을 이어서 읽어보세요."
                : "남겨둔 기록을 다시 읽으면서 오늘의 흐름을 차분히 정리해보세요.")}
          </p>
        </MobileCard>

        {section === "knowledge" ? (
          <>
            <MobileCard as="section" className="rounded-[28px] bg-[var(--accent)] p-6 text-white shadow-[var(--shadow)]">
              <p className="text-xs font-semibold tracking-[0.18em] text-white/80">
                {heroName}의 말
              </p>
              <p className="mt-3 text-sm leading-7">
                엄마, 오늘도 저를 위해 시간을 내주셔서 감사해요. 함께 읽으면서 오늘 하루를 준비해봐요.
              </p>
            </MobileCard>

            <div className="flex justify-center">
              <div className="flex h-[220px] w-[220px] items-center justify-center rounded-full bg-[var(--accent-soft)]">
                <div className="h-[188px] w-[188px] overflow-hidden rounded-full bg-[var(--panel-muted)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={babyImagePath}
                    alt={`${pregnancyWeekLabel ?? "현재"} 태아 이미지`}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <MobileCard as="section" className="rounded-[26px] p-5">
                <p className="text-lg font-semibold text-[var(--text)]">태아 발달</p>
                <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
                  {weeks[0]?.babySummary ??
                    `${heroName}는 ${pregnancyWeekLabel ?? "지금의 주차"}에 맞춰 오늘도 차분히 자라고 있어요.`}
                </p>
              </MobileCard>
              <MobileCard as="section" className="rounded-[26px] bg-[var(--panel-muted)] p-5">
                <p className="text-lg font-semibold text-[var(--text)]">모체 변화</p>
                <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
                  {weeks[0]?.motherSummary ??
                    (tonePreference
                      ? `오늘은 ${tonePreference} 톤으로 몸의 변화를 정리해보면 좋아요.`
                      : "오늘 몸과 마음의 변화를 천천히 살펴보면 좋아요.")}
                </p>
              </MobileCard>
            </div>

            <MobileCard as="section" className="rounded-[26px] p-5">
              <p className="text-lg font-semibold text-[var(--text)]">오늘의 생활 체크리스트</p>
              <div className="mt-4 grid gap-3">
                {[
                  "물 한 잔을 천천히 마셔요.",
                  "몸 상태를 잠깐 기록해요.",
                  "아기에게 짧은 인사를 건네요.",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-[18px] bg-[var(--panel-muted)] px-4 py-4">
                    <div className="h-3.5 w-3.5 rounded-full bg-[var(--accent)]" />
                    <p className="text-sm text-[var(--text)]">{item}</p>
                  </div>
                ))}
              </div>
            </MobileCard>
          </>
        ) : null}

        {section === "knowledge" && weeks.length > 0 ? (
          <div className="grid gap-2">
            <p className="px-1 text-sm font-semibold text-[var(--text)]">주차별 임신 정보</p>
            <div className="grid gap-2">
              {weeks.map((week) => (
                <Link
                  key={week.weekNumber}
                  href={appendUserIdToPath(
                    `/link/knowledge?entityId=week-${week.weekNumber}`,
                    resolvedUserId,
                  )}
                  className="flex items-center gap-3 rounded-[16px] border border-[var(--line)] bg-[var(--panel-strong)] p-4"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)]">
                    <span className="text-sm font-bold text-[var(--accent-dark)]">{week.weekNumber}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--text)]">{week.title}</p>
                    <p className="mt-0.5 truncate text-xs text-[var(--text-soft)]">
                      {week.babySizeLabel ? `${week.babySizeLabel} 크기` : ""}
                      {week.babySizeLabel && week.babySummary ? " · " : ""}
                      {week.babySummary ? week.babySummary.slice(0, 40) : ""}
                    </p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-soft)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {items.length > 0 ? (
          <div className="grid gap-2">
            {section === "knowledge" && weeks.length > 0 ? (
              <p className="mt-2 px-1 text-sm font-semibold text-[var(--text)]">참고 문서</p>
            ) : null}
            {items.map((item, index) => (
              <Link
                key={item.id}
                href={appendUserIdToPath(
                  `/link/${item.section}?entityId=${encodeURIComponent(item.id)}`,
                  resolvedUserId,
                )}
                className="rounded-[22px] border border-[var(--line)] bg-[var(--panel-strong)] p-5 shadow-[var(--shadow)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-dark)]">
                  {section === "knowledge"
                    ? index === 0
                      ? "오늘 먼저 읽어요"
                      : "참고 문서"
                    : "다시 떠올려요"}
                </p>
                <p className="mt-2 text-lg font-semibold text-[var(--text)]">
                  {item.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                  {item.preview}
                </p>
              </Link>
            ))}
          </div>
        ) : weeks.length === 0 ? (
          <MobileCard as="div" className="rounded-[22px] p-5 text-sm text-[var(--text-soft)]">
            아직 등록된 내용이 없어요.
          </MobileCard>
        ) : null}
      </div>
    </MobileShell>
  );
}
