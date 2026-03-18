"use client";

import {
  DEFAULT_MOBILE_THEME_KEY,
  resolveMobileThemeKey,
} from "@gynecology-chatbot/app-core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { completeOnboarding } from "@/lib/mobile/web-mobile-api";
import { appendUserIdToPath } from "@/lib/mobile/web-mobile-api";
import {
  markMobileOnboardingComplete,
  readStoredMobileThemeKey,
  storeMobileProfile,
  storeMobileThemeKey,
  storeMobileUserId,
} from "@/lib/mobile/mobile-session";
import { applyMobileTheme } from "@/lib/mobile/themes";
import { MobileThemePresetButtons } from "./MobileThemePresetButtons";
import { setNativeTitle } from "./native-bridge";

type Props = {
  userId?: string | null;
};

export function MobileOnboardingView({ userId }: Props) {
  const router = useRouter();
  const [pregnancyInfo, setPregnancyInfo] = useState("");
  const [tonePreference, setTonePreference] = useState("");
  const [themeKey, setThemeKey] = useState(
    () => readStoredMobileThemeKey() ?? DEFAULT_MOBILE_THEME_KEY,
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setNativeTitle("온보딩");
  }, []);

  useEffect(() => {
    const storedThemeKey = readStoredMobileThemeKey();
    if (storedThemeKey) {
      setThemeKey(storedThemeKey);
      applyMobileTheme(storedThemeKey);
    }
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId || !pregnancyInfo.trim() || !tonePreference.trim()) {
      setError("현재 주차 또는 예정일, 원하는 말투를 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = await completeOnboarding({
        userId,
        pregnancyWeekOrDueDate: [pregnancyInfo.trim(), notes.trim()]
          .filter(Boolean)
          .join(" / "),
        tonePreference: tonePreference.trim(),
        themeKey,
      });

      storeMobileUserId(payload.user.id);
      storeMobileProfile({ userId: payload.user.id, themeKey });
      applyMobileTheme(themeKey);
      markMobileOnboardingComplete();
      router.replace(appendUserIdToPath("/", payload.user.id));
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "온보딩을 저장하지 못했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col gap-4 px-4 py-5">
      <section className="rounded-[28px] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent-dark)]">
          첫 설정
        </p>
        <h1 className="mt-3 text-[30px] font-semibold tracking-[-0.04em] text-[var(--text)]">
          몇 가지만 알려주시면 바로 시작할 수 있어요
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
          현재 주차나 예정일, 원하는 말투를 설정하면 홈과 채팅 화면에 맞게
          보여드릴게요.
        </p>
      </section>

      <form
        className="rounded-[28px] border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[var(--text)]">
              현재 주차 또는 예정일
            </span>
            <input
              className="rounded-[18px] border border-[var(--line)] bg-[var(--panel-muted)] px-4 py-3 outline-none"
              onChange={(event) => setPregnancyInfo(event.target.value)}
              placeholder="예: 24주 3일 또는 2026-07-01"
              value={pregnancyInfo}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[var(--text)]">
              원하는 상담 톤
            </span>
            <input
              className="rounded-[18px] border border-[var(--line)] bg-[var(--panel-muted)] px-4 py-3 outline-none"
              onChange={(event) => setTonePreference(event.target.value)}
              placeholder="예: 차분하고 간단하게"
              value={tonePreference}
            />
          </label>
          <MobileThemePresetButtons
            label="테마 선택"
            onSelect={(nextThemeKey) => {
              setThemeKey(resolveMobileThemeKey(nextThemeKey));
              storeMobileThemeKey(nextThemeKey);
              applyMobileTheme(nextThemeKey);
            }}
            selectedThemeKey={themeKey}
          />
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[var(--text)]">
              추가 메모
            </span>
            <textarea
              className="min-h-28 rounded-[18px] border border-[var(--line)] bg-[var(--panel-muted)] px-4 py-3 outline-none"
              onChange={(event) => setNotes(event.target.value)}
              placeholder="추가로 기억해둘 내용이 있다면 적어 주세요"
              value={notes}
            />
          </label>
          {error ? (
            <p className="rounded-2xl border border-[var(--line)] bg-[var(--panel-muted)] px-3 py-2 text-sm text-[var(--accent-dark)]">
              {error}
            </p>
          ) : null}
          <button
            className="rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "저장 중" : "설정 저장하고 시작하기"}
          </button>
        </div>
      </form>

      <div className="rounded-[24px] border border-[var(--line)] bg-[var(--panel)] p-5 text-sm leading-6 text-[var(--text-soft)] shadow-[var(--shadow)]">
        <strong className="block text-base text-[var(--text)]">
          입력 예시
        </strong>
        예정일만 알아도 괜찮고, 주차를 더 편하면 주차만 적어도 됩니다. 추가
        메모에는 병원명이나 자주 걱정되는 증상을 남겨둘 수 있어요.
      </div>

      <Link
        className="text-sm font-semibold text-[var(--text-soft)]"
        href={appendUserIdToPath("/auth/login", userId)}
      >
        로그인으로 돌아가기
      </Link>
    </main>
  );
}
