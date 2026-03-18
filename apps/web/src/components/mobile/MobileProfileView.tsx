"use client";

import {
  DEFAULT_MOBILE_THEME_KEY,
  MOBILE_THEME_OPTIONS,
  resolveMobileThemeKey,
} from "@gynecology-chatbot/app-core";
import type { MobileProfileViewData } from "@gynecology-chatbot/app-core";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchMobileProfile,
  appendUserIdToPath,
  resolveMobileUserId,
  updateMobileProfile,
} from "@/lib/mobile/web-mobile-api";
import { storeMobileProfile } from "@/lib/mobile/mobile-session";
import { applyMobileTheme } from "@/lib/mobile/themes";
import { MobileShell } from "./MobileShell";
import { useMobileSessionGuard } from "./useMobileSessionGuard";

const TONE_OPTIONS = [
  { value: "calm", label: "차분하게" },
  { value: "detailed", label: "자세하게" },
  { value: "reassuring", label: "안심 중심으로" },
];

function resolveToneLabel(value?: string | null) {
  return (
    TONE_OPTIONS.find((option) => option.value === value)?.label ??
    value ??
    "미설정"
  );
}

export function MobileProfileView({ userId }: { userId?: string | null }) {
  const resolvedUserId = useMobileSessionGuard(
    resolveMobileUserId(userId ?? null),
  );
  const [profile, setProfile] = useState<MobileProfileViewData | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tonePreference, setTonePreference] = useState("");
  const [babyNickname, setBabyNickname] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [notificationTime, setNotificationTime] = useState("08:30");
  const [themeKey, setThemeKey] = useState(DEFAULT_MOBILE_THEME_KEY);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!resolvedUserId) {
      return;
    }

    let cancelled = false;

    fetchMobileProfile(resolvedUserId)
      .then((payload) => {
        if (cancelled) {
          return;
        }

        setProfile(payload.profile);
        setDisplayName(payload.profile.displayName);
        setDueDate(payload.profile.dueDate ?? "");
        setTonePreference(payload.profile.tonePreference ?? "");
        setBabyNickname(payload.profile.babyNickname ?? "");
        setHospitalName(payload.profile.hospitalName ?? "");
        setNotificationTime(payload.profile.notificationTime ?? "08:30");
        setThemeKey(resolveMobileThemeKey(payload.profile.themeKey));
        storeMobileProfile({
          userId: payload.profile.userId,
          displayName: payload.profile.displayName,
          phoneNumber: payload.profile.phoneNumber,
          pregnancyWeekLabel: payload.profile.pregnancyWeekLabel,
          themeKey: resolveMobileThemeKey(payload.profile.themeKey),
        });
        applyMobileTheme(payload.profile.themeKey);
        setError(null);
      })
      .catch((nextError) => {
        if (!cancelled) {
          setError(
            nextError instanceof Error
              ? nextError.message
              : "프로필을 불러오지 못했습니다.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [resolvedUserId]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!resolvedUserId || !displayName.trim() || !tonePreference.trim()) {
      setError("이름과 상담 톤은 비워둘 수 없습니다.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload = await updateMobileProfile({
        userId: resolvedUserId,
        displayName: displayName.trim(),
        dueDate: dueDate || null,
        tonePreference: tonePreference.trim(),
        babyNickname: babyNickname.trim() || null,
        hospitalName: hospitalName.trim() || null,
        notificationTime,
        themeKey,
      });

      const refreshed = await fetchMobileProfile(payload.user.id);
      setProfile(refreshed.profile);
      setDisplayName(refreshed.profile.displayName);
      setDueDate(refreshed.profile.dueDate ?? "");
      setTonePreference(refreshed.profile.tonePreference ?? "");
      setBabyNickname(refreshed.profile.babyNickname ?? "");
      setHospitalName(refreshed.profile.hospitalName ?? "");
      setNotificationTime(refreshed.profile.notificationTime ?? "08:30");
      setThemeKey(resolveMobileThemeKey(refreshed.profile.themeKey));
      storeMobileProfile({
        userId: refreshed.profile.userId,
        displayName: refreshed.profile.displayName,
        phoneNumber: refreshed.profile.phoneNumber,
        pregnancyWeekLabel: refreshed.profile.pregnancyWeekLabel,
        themeKey: resolveMobileThemeKey(refreshed.profile.themeKey),
      });
      applyMobileTheme(refreshed.profile.themeKey);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "프로필을 저장하지 못했습니다.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <MobileShell
      title={profile ? `${profile.displayName}님의 프로필` : "프로필"}
      description={
        error ?? "기본 계정 정보와 현재 임신 주차 상태를 확인합니다."
      }
      userId={resolvedUserId}
    >
      <div className="grid gap-4">
        <section className="rounded-[28px] border border-[var(--line)] bg-[var(--panel-strong)] p-5 shadow-[var(--shadow)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">
            Account
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] bg-[var(--accent-soft)] p-4">
              <p className="text-sm text-[var(--text-soft)]">이름</p>
              <p className="mt-2 text-xl font-semibold text-[var(--text)]">
                {profile?.displayName ?? "확인 중"}
              </p>
            </div>
            <div className="rounded-[22px] bg-[rgba(20,34,20,0.05)] p-4">
              <p className="text-sm text-[var(--text-soft)]">전화번호</p>
              <p className="mt-2 text-xl font-semibold text-[var(--text)]">
                {profile?.phoneNumber ?? "확인 중"}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[var(--line)] bg-white/85 p-5 shadow-[var(--shadow)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">
            Settings
          </p>
          <form className="mt-4 grid gap-3" onSubmit={handleSave}>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[var(--text)]">
                이름
              </span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="rounded-[18px] border border-[var(--line)] bg-[rgba(20,34,20,0.03)] px-4 py-3 text-[15px] text-[var(--text)] outline-none"
                placeholder="이름"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[var(--text)]">
                태명
              </span>
              <input
                value={babyNickname}
                onChange={(event) => setBabyNickname(event.target.value)}
                className="rounded-[18px] border border-[var(--line)] bg-[rgba(20,34,20,0.03)] px-4 py-3 text-[15px] text-[var(--text)] outline-none"
                placeholder="예: 튼튼이"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[var(--text)]">
                예정 출산일
              </span>
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="rounded-[18px] border border-[var(--line)] bg-[rgba(20,34,20,0.03)] px-4 py-3 text-[15px] text-[var(--text)] outline-none"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[var(--text)]">
                주 진료 병원
              </span>
              <input
                value={hospitalName}
                onChange={(event) => setHospitalName(event.target.value)}
                className="rounded-[18px] border border-[var(--line)] bg-[rgba(20,34,20,0.03)] px-4 py-3 text-[15px] text-[var(--text)] outline-none"
                placeholder="예: 산단여성병원"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[var(--text)]">
                테마
              </span>
              <select
                value={themeKey}
                onChange={(event) => {
                  const nextThemeKey = resolveMobileThemeKey(
                    event.target.value,
                  );
                  setThemeKey(nextThemeKey);
                  applyMobileTheme(nextThemeKey);
                }}
                className="rounded-[18px] border border-[var(--line)] bg-[rgba(20,34,20,0.03)] px-4 py-3 text-[15px] text-[var(--text)] outline-none"
              >
                {MOBILE_THEME_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label} · {option.description}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[var(--text)]">
                매일 알림 시간
              </span>
              <input
                type="time"
                value={notificationTime}
                onChange={(event) => setNotificationTime(event.target.value)}
                className="rounded-[18px] border border-[var(--line)] bg-[rgba(20,34,20,0.03)] px-4 py-3 text-[15px] text-[var(--text)] outline-none"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[var(--text)]">
                상담 톤
              </span>
              <select
                value={tonePreference}
                onChange={(event) => setTonePreference(event.target.value)}
                className="rounded-[18px] border border-[var(--line)] bg-[rgba(20,34,20,0.03)] px-4 py-3 text-[15px] text-[var(--text)] outline-none"
              >
                {TONE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {error ? (
              <p className="rounded-2xl bg-[#fff4f1] px-3 py-2 text-sm text-[#8c4738]">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isSaving ? "저장 중" : "프로필 저장"}
            </button>
          </form>
        </section>

        <section className="rounded-[28px] border border-[var(--line)] bg-white/85 p-5 shadow-[var(--shadow)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">
            Pregnancy
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[22px] border border-[var(--line)] bg-[rgba(20,34,20,0.03)] p-4">
              <p className="text-sm text-[var(--text-soft)]">현재 주차</p>
              <p className="mt-2 text-lg font-semibold text-[var(--text)]">
                {profile?.pregnancyWeekLabel ?? "정보 없음"}
              </p>
            </div>
            <div className="rounded-[22px] border border-[var(--line)] bg-[rgba(20,34,20,0.03)] p-4">
              <p className="text-sm text-[var(--text-soft)]">임신 일차</p>
              <p className="mt-2 text-lg font-semibold text-[var(--text)]">
                {profile ? `${profile.pregnancyDayCount}일` : "정보 없음"}
              </p>
            </div>
            <div className="rounded-[22px] border border-[var(--line)] bg-[rgba(20,34,20,0.03)] p-4">
              <p className="text-sm text-[var(--text-soft)]">온보딩</p>
              <p className="mt-2 text-lg font-semibold text-[var(--text)]">
                {profile?.hasCompletedOnboarding ? "완료" : "미완료"}
              </p>
            </div>
            <div className="rounded-[22px] border border-[var(--line)] bg-[rgba(20,34,20,0.03)] p-4 sm:col-span-3">
              <p className="text-sm text-[var(--text-soft)]">예정 출산일</p>
              <p className="mt-2 text-lg font-semibold text-[var(--text)]">
                {profile?.dueDate ?? "미설정"}
              </p>
            </div>
            <div className="rounded-[22px] border border-[var(--line)] bg-[rgba(20,34,20,0.03)] p-4">
              <p className="text-sm text-[var(--text-soft)]">태명</p>
              <p className="mt-2 text-lg font-semibold text-[var(--text)]">
                {profile?.babyNickname ?? "미설정"}
              </p>
            </div>
            <div className="rounded-[22px] border border-[var(--line)] bg-[rgba(20,34,20,0.03)] p-4">
              <p className="text-sm text-[var(--text-soft)]">주 진료 병원</p>
              <p className="mt-2 text-lg font-semibold text-[var(--text)]">
                {profile?.hospitalName ?? "미설정"}
              </p>
            </div>
            <div className="rounded-[22px] border border-[var(--line)] bg-[rgba(20,34,20,0.03)] p-4">
              <p className="text-sm text-[var(--text-soft)]">선택 테마</p>
              <p className="mt-2 text-lg font-semibold text-[var(--text)]">
                {MOBILE_THEME_OPTIONS.find((option) => option.key === themeKey)
                  ?.label ?? themeKey}
              </p>
            </div>
            <div className="rounded-[22px] border border-[var(--line)] bg-[rgba(20,34,20,0.03)] p-4">
              <p className="text-sm text-[var(--text-soft)]">매일 알림 시간</p>
              <p className="mt-2 text-lg font-semibold text-[var(--text)]">
                {profile?.notificationTime ?? "08:30"}
              </p>
            </div>
            <div className="rounded-[22px] border border-[var(--line)] bg-[rgba(20,34,20,0.03)] p-4 sm:col-span-3">
              <p className="text-sm text-[var(--text-soft)]">상담 톤</p>
              <p className="mt-2 text-lg font-semibold text-[var(--text)]">
                {resolveToneLabel(profile?.tonePreference)}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[var(--line)] bg-white/85 p-5 shadow-[var(--shadow)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">
            Actions
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={appendUserIdToPath("/", resolvedUserId)}
              className="rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white"
            >
              홈으로
            </Link>
            <Link
              href={appendUserIdToPath("/chat/new", resolvedUserId)}
              className="rounded-full border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--text)]"
            >
              새 상담 시작
            </Link>
          </div>
        </section>
      </div>
    </MobileShell>
  );
}
