"use client";

import type { HomeViewData } from "@gynecology-chatbot/app-core";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchHome, fetchMobileProfile } from "@/lib/mobile/web-mobile-api";
import { storeMobileProfile } from "@/lib/mobile/mobile-session";
import { MobileShell } from "./MobileShell";
import { MobileSkeletonBlock } from "./MobilePrimitives";
import { buildWebPatientHomeViewModel } from "./mobile-patient-view-models";
import { getWeekBabyImagePath } from "./week-baby-images";
import { useMobileSessionGuard } from "./useMobileSessionGuard";

export function MobileHomeView({ userId }: { userId: string | null }) {
  const resolvedUserId = useMobileSessionGuard(userId);
  const [home, setHome] = useState<HomeViewData | null>(null);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [babyNickname, setBabyNickname] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.PhedyNative?.setTitle?.("홈");
  }, []);

  useEffect(() => {
    if (!resolvedUserId) {
      return;
    }

    let cancelled = false;

    Promise.all([fetchHome(resolvedUserId), fetchMobileProfile(resolvedUserId)])
      .then(([homePayload, profilePayload]) => {
        if (cancelled) {
          return;
        }

        setHome(homePayload.home);
        setDueDate(profilePayload.profile.dueDate ?? null);
        setBabyNickname(profilePayload.profile.babyNickname ?? null);
        storeMobileProfile({
          userId: profilePayload.profile.userId,
          displayName: profilePayload.profile.displayName,
          phoneNumber: profilePayload.profile.phoneNumber,
          pregnancyWeekLabel: profilePayload.profile.pregnancyWeekLabel,
          themeKey: profilePayload.profile.themeKey,
        });
      })
      .catch((nextError) => {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "홈 정보를 불러오지 못했어요.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [resolvedUserId]);

  const viewModel = buildWebPatientHomeViewModel({
    home,
    profile: { babyNickname, dueDate },
  });
  const babyImagePath = getWeekBabyImagePath(viewModel.pregnancyWeekLabel);

  return (
    <MobileShell
      title="홈"
      description={error ?? "오늘도 아기와 연결된 흐름을 이어가요."}
      userId={resolvedUserId}
      showChatFab
    >
      <div className="grid gap-4">
        <section className="grid gap-2">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--text-soft)]">
            {new Date().getMonth() + 1}월
          </p>
          <p className="text-4xl font-semibold tracking-[-0.05em] text-[var(--text)]">
            {new Date().getDate()}
          </p>
          <h1 className="-mt-3 text-4xl font-semibold tracking-[-0.05em] text-[var(--text)]">
            {viewModel.heroName}
          </h1>
        </section>

        <section className="rounded-[30px] bg-[var(--accent)] p-6 text-white shadow-[var(--shadow)]">
          <p className="text-xs font-semibold tracking-[0.18em] text-white/80">
            {viewModel.heroName}의 한마디
          </p>
          <p className="mt-3 text-sm leading-7">{viewModel.babyMessage}</p>
        </section>
        <div className="flex justify-center -mt-2">
          <div className="h-5 w-5 rotate-45 rounded-bl-[10px] bg-[var(--accent)]" />
        </div>

        <section className="flex justify-center">
          <div className="flex h-[272px] w-[272px] items-center justify-center rounded-full bg-[var(--accent-soft)]">
            <div className="relative h-[236px] w-[236px] overflow-hidden rounded-full bg-[var(--panel-muted)]">
              <div className="absolute left-10 top-12 h-3 w-3 rounded-full bg-white/40" />
              <div className="absolute right-14 top-20 h-2.5 w-2.5 rounded-full bg-white/35" />
              <div className="absolute bottom-14 left-14 h-3.5 w-3.5 rounded-full bg-white/30" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={babyImagePath}
                alt={`${viewModel.pregnancyWeekLabel} 태아 이미지`}
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-5 left-1/2 flex h-[52px] w-[52px] -translate-x-1/2 items-center justify-center rounded-[18px] bg-white/85 shadow-[var(--shadow)]">
                <span className="text-[24px] text-[var(--accent)]">✉</span>
                <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] text-white">
                  ♥
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[var(--line)] bg-[var(--panel-strong)] p-6 shadow-[var(--shadow)]">
          <p className="text-sm font-medium text-[var(--accent-dark)]">
            {viewModel.pregnancyWeekLabel}
          </p>
          <div className="mt-3 flex items-end gap-3">
            <p className="text-sm text-[var(--text-soft)]">{viewModel.metricLabel}</p>
            <p className="text-4xl font-semibold tracking-[-0.05em] text-[var(--text)]">
              {viewModel.metricValue}
            </p>
          </div>
          <p className="mt-2 text-sm text-[var(--text-soft)]">
            임신 {viewModel.pregnancyDayCount}일째예요.
          </p>
        </section>

        <section className="rounded-[28px] border border-[var(--line)] bg-[var(--panel-strong)] p-6 text-center shadow-[var(--shadow)]">
          <p className="text-[15px] leading-7 text-[var(--text)]">{viewModel.quote}</p>
        </section>

        <section className="rounded-[28px] border border-[var(--line)] bg-[var(--panel-muted)] p-6 shadow-[var(--shadow)]">
          <h2 className="text-xl font-semibold text-[var(--text)]">오늘의 한마디</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{viewModel.note}</p>
        </section>

        {home ? null : (
          <div className="grid gap-3">
            <MobileSkeletonBlock className="h-32 w-full rounded-[28px]" />
            <MobileSkeletonBlock className="h-24 w-full rounded-[28px]" />
          </div>
        )}
      </div>
    </MobileShell>
  );
}
