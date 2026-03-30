"use client";

import {
  DEFAULT_MOBILE_THEME_KEY,
  resolveMobileThemeKey,
} from "@gynecology-chatbot/app-core";
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
import {
  MobileCard,
  mobileFieldClassName,
  MobileNotice,
} from "./MobilePrimitives";
import { MobileThemePresetButtons } from "./MobileThemePresetButtons";
import { setNativeTitle } from "./native-bridge";

type Props = { userId?: string | null };

const TONE_OPTIONS = ["차분하게", "친근하게", "전문적으로", "다정하게"];

export function MobileOnboardingView({ userId }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [babyNickname, setBabyNickname] = useState("");
  const [tonePreference, setTonePreference] = useState("");
  const [themeKey, setThemeKey] = useState(
    () => readStoredMobileThemeKey() ?? DEFAULT_MOBILE_THEME_KEY,
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { setNativeTitle("시작하기"); }, []);
  useEffect(() => {
    const stored = readStoredMobileThemeKey();
    if (stored) { setThemeKey(stored); applyMobileTheme(stored); }
  }, []);

  function next() {
    if (step === 0 && !dueDate) {
      setError("출산 예정일을 선택해주세요.");
      return;
    }
    setError(null);
    setStep((s) => s + 1);
  }

  async function handleComplete() {
    setIsSubmitting(true);
    setError(null);
    try {
      const pregnancyInfo = dueDate;
      const notes = babyNickname.trim() ? `태명: ${babyNickname.trim()}` : "";
      const payload = await completeOnboarding({
        userId: userId!,
        pregnancyWeekOrDueDate: [pregnancyInfo, notes].filter(Boolean).join(" / "),
        tonePreference: tonePreference || "친근하게",
        themeKey,
      });
      storeMobileUserId(payload.user.id);
      storeMobileProfile({ userId: payload.user.id, themeKey });
      applyMobileTheme(themeKey);
      markMobileOnboardingComplete();
      router.replace(appendUserIdToPath("/", payload.user.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했어요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const progress = ((step + 1) / 4) * 100;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col justify-center gap-4 px-4 py-5">
      <div className="h-1 overflow-hidden rounded-full bg-[var(--line)]">
        <div className="h-full rounded-full bg-[var(--accent)] transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {step === 0 && (
        <MobileCard className="p-6">
          <h2 className="text-2xl font-bold text-[var(--text)]">출산 예정일을 알려주세요</h2>
          <p className="mt-1 text-sm text-[var(--text-soft)]">달력에서 예정일을 선택해주세요</p>
          <input
            className={`${mobileFieldClassName} mt-4`}
            onChange={(e) => setDueDate(e.target.value)}
            value={dueDate}
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            max={(() => { const d = new Date(); d.setDate(d.getDate() + 294); return d.toISOString().slice(0, 10); })()}
          />
          {error ? <MobileNotice>{error}</MobileNotice> : null}
          <button className="mt-4 w-full rounded-full bg-[var(--accent)] py-3 text-sm font-semibold text-white" onClick={next} type="button">
            다음
          </button>
        </MobileCard>
      )}

      {step === 1 && (
        <MobileCard className="p-6">
          <h2 className="text-2xl font-bold text-[var(--text)]">태명을 지어주세요</h2>
          <p className="mt-1 text-sm text-[var(--text-soft)]">아직 없다면 건너뛰어도 돼요</p>
          <input
            className={`${mobileFieldClassName} mt-4`}
            onChange={(e) => setBabyNickname(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setError(null); setStep(2); } }}
            placeholder="예: 콩이, 달이"
            value={babyNickname}
            autoFocus
          />
          <div className="mt-4 flex gap-3">
            <button className="flex-1 rounded-full border border-[var(--line)] py-3 text-sm font-semibold text-[var(--text-soft)]" onClick={() => setStep(0)} type="button">이전</button>
            <button className="flex-1 rounded-full bg-[var(--accent)] py-3 text-sm font-semibold text-white" onClick={() => { setError(null); setStep(2); }} type="button">
              {babyNickname.trim() ? "다음" : "건너뛰기"}
            </button>
          </div>
        </MobileCard>
      )}

      {step === 2 && (
        <MobileCard className="p-6">
          <h2 className="text-2xl font-bold text-[var(--text)]">어떤 분위기가 좋아요?</h2>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {TONE_OPTIONS.map((tone) => (
              <button
                key={tone}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${
                  tonePreference === tone
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "border-[var(--line)] text-[var(--text-soft)]"
                }`}
                onClick={() => setTonePreference(tone)}
                type="button"
              >
                {tone}
              </button>
            ))}
          </div>
          <div className="mt-4 flex gap-3">
            <button className="flex-1 rounded-full border border-[var(--line)] py-3 text-sm font-semibold text-[var(--text-soft)]" onClick={() => setStep(1)} type="button">이전</button>
            <button className="flex-1 rounded-full bg-[var(--accent)] py-3 text-sm font-semibold text-white" onClick={() => { setError(null); setStep(3); }} type="button">다음</button>
          </div>
        </MobileCard>
      )}

      {step === 3 && (
        <MobileCard className="p-6">
          <h2 className="text-2xl font-bold text-[var(--text)]">앱 분위기를 골라주세요</h2>
          <div className="mt-4">
            <MobileThemePresetButtons
              label=""
              onSelect={(next) => {
                setThemeKey(resolveMobileThemeKey(next));
                storeMobileThemeKey(next);
                applyMobileTheme(next);
              }}
              selectedThemeKey={themeKey}
            />
          </div>
          {error ? <MobileNotice>{error}</MobileNotice> : null}
          <div className="mt-4 flex gap-3">
            <button className="flex-1 rounded-full border border-[var(--line)] py-3 text-sm font-semibold text-[var(--text-soft)]" onClick={() => setStep(2)} type="button">이전</button>
            <button className="flex-1 rounded-full bg-[var(--accent)] py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={isSubmitting} onClick={handleComplete} type="button">
              {isSubmitting ? "준비 중..." : "시작하기"}
            </button>
          </div>
        </MobileCard>
      )}
    </main>
  );
}
