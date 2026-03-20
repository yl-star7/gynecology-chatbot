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
  MobileFormField,
  MobileNotice,
  MobileSectionIntro,
} from "./MobilePrimitives";
import { MobileThemePresetButtons } from "./MobileThemePresetButtons";
import { setNativeTitle } from "./native-bridge";

type Props = {
  userId?: string | null;
};

export function MobileOnboardingView({ userId }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pregnancyInfo, setPregnancyInfo] = useState("");
  const [themeKey, setThemeKey] = useState(
    () => readStoredMobileThemeKey() ?? DEFAULT_MOBILE_THEME_KEY,
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setNativeTitle("시작하기");
  }, []);

  useEffect(() => {
    const storedThemeKey = readStoredMobileThemeKey();
    if (storedThemeKey) {
      setThemeKey(storedThemeKey);
      applyMobileTheme(storedThemeKey);
    }
  }, []);

  async function handleComplete() {
    if (!userId || !pregnancyInfo.trim()) {
      setError("현재 주차나 예정일을 알려주세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = await completeOnboarding({
        userId,
        pregnancyWeekOrDueDate: pregnancyInfo.trim(),
        tonePreference: "친근하게",
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
          : "저장에 실패했어요. 다시 시도해주세요.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col justify-center gap-4 px-4 py-5">
      {step === 0 && (
        <MobileCard className="p-6">
          <MobileSectionIntro
            title="반가워요!"
            description="앞으로 임신 기간 동안 함께할게요. 태명, 병원 같은 정보는 나중에 대화하면서 알려주셔도 돼요."
          />
          <button
            className="mt-6 w-full rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white"
            onClick={() => setStep(1)}
            type="button"
          >
            시작하기
          </button>
        </MobileCard>
      )}

      {step === 1 && (
        <MobileCard className="p-6">
          <MobileSectionIntro
            title="지금 몇 주차예요?"
            description="이것만 알려주시면 바로 시작할 수 있어요."
          />
          <div className="mt-4 grid gap-4">
            <MobileFormField label="현재 주차 또는 출산 예정일">
              <input
                className={mobileFieldClassName}
                onChange={(event) => setPregnancyInfo(event.target.value)}
                placeholder="예: 16주 또는 2026-08-01"
                value={pregnancyInfo}
                autoFocus
              />
            </MobileFormField>
            <MobileThemePresetButtons
              label="앱 분위기"
              onSelect={(nextThemeKey) => {
                setThemeKey(resolveMobileThemeKey(nextThemeKey));
                storeMobileThemeKey(nextThemeKey);
                applyMobileTheme(nextThemeKey);
              }}
              selectedThemeKey={themeKey}
            />
            {error ? <MobileNotice>{error}</MobileNotice> : null}
            <button
              className="w-full rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              disabled={isSubmitting}
              onClick={handleComplete}
              type="button"
            >
              {isSubmitting ? "준비 중..." : "상담 시작하기"}
            </button>
          </div>
        </MobileCard>
      )}
    </main>
  );
}
