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

const STEPS = [
  { id: "welcome", label: "환영" },
  { id: "pregnancy", label: "임신 정보" },
  { id: "baby", label: "우리 아기" },
  { id: "preference", label: "상담 설정" },
] as const;

export function MobileOnboardingView({ userId }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pregnancyInfo, setPregnancyInfo] = useState("");
  const [babyNickname, setBabyNickname] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [tonePreference, setTonePreference] = useState("");
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

  function handleNext() {
    if (step === 1 && !pregnancyInfo.trim()) {
      setError("현재 주차나 예정일을 알려주세요.");
      return;
    }
    setError(null);
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }

  function handleBack() {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 0));
  }

  async function handleComplete() {
    if (!userId || !pregnancyInfo.trim()) {
      setError("임신 정보를 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const notes = [
        babyNickname.trim() ? `태명: ${babyNickname.trim()}` : null,
        hospitalName.trim() ? `병원: ${hospitalName.trim()}` : null,
      ].filter(Boolean).join(" / ");

      const payload = await completeOnboarding({
        userId,
        pregnancyWeekOrDueDate: [pregnancyInfo.trim(), notes].filter(Boolean).join(" / "),
        tonePreference: tonePreference.trim() || "친근하게",
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

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col gap-4 px-4 py-5">
      <div className="h-1 overflow-hidden rounded-full bg-[var(--line)]">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {step === 0 && (
        <MobileCard className="p-6">
          <MobileSectionIntro
            eyebrow={`${STEPS.length}단계 중 1단계`}
            title="반가워요!"
            description="앞으로 임신 기간 동안 함께할게요. 몇 가지만 알려주시면 맞춤 상담을 시작할 수 있어요."
          />
          <button
            className="mt-6 w-full rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white"
            onClick={handleNext}
            type="button"
          >
            시작하기
          </button>
        </MobileCard>
      )}

      {step === 1 && (
        <MobileCard className="p-6">
          <MobileSectionIntro
            eyebrow={`${STEPS.length}단계 중 2단계`}
            title="지금 몇 주차예요?"
          />
          <div className="mt-4 grid gap-4">
            <MobileFormField label="현재 주차 또는 출산 예정일">
              <input
                className={mobileFieldClassName}
                onChange={(event) => setPregnancyInfo(event.target.value)}
                placeholder="예: 16주 또는 2026-08-01"
                value={pregnancyInfo}
              />
            </MobileFormField>
            <MobileFormField label="다니고 계신 병원 (선택)">
              <input
                className={mobileFieldClassName}
                onChange={(event) => setHospitalName(event.target.value)}
                placeholder="예: OO산부인과"
                value={hospitalName}
              />
            </MobileFormField>
            {error ? <MobileNotice>{error}</MobileNotice> : null}
            <div className="flex gap-3">
              <button
                className="flex-1 rounded-full border border-[var(--line)] px-4 py-3 text-sm font-semibold text-[var(--text-soft)]"
                onClick={handleBack}
                type="button"
              >
                이전
              </button>
              <button
                className="flex-1 rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white"
                onClick={handleNext}
                type="button"
              >
                다음
              </button>
            </div>
          </div>
        </MobileCard>
      )}

      {step === 2 && (
        <MobileCard className="p-6">
          <MobileSectionIntro
            eyebrow={`${STEPS.length}단계 중 3단계`}
            title="아기 태명을 지어주세요"
            description="아직 정하지 않았다면 건너뛰어도 돼요."
          />
          <div className="mt-4 grid gap-4">
            <MobileFormField label="태명">
              <input
                className={mobileFieldClassName}
                onChange={(event) => setBabyNickname(event.target.value)}
                placeholder="예: 콩이, 달이, 뽀미"
                value={babyNickname}
              />
            </MobileFormField>
            <div className="flex gap-3">
              <button
                className="flex-1 rounded-full border border-[var(--line)] px-4 py-3 text-sm font-semibold text-[var(--text-soft)]"
                onClick={handleBack}
                type="button"
              >
                이전
              </button>
              <button
                className="flex-1 rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white"
                onClick={handleNext}
                type="button"
              >
                {babyNickname.trim() ? "다음" : "건너뛰기"}
              </button>
            </div>
          </div>
        </MobileCard>
      )}

      {step === 3 && (
        <MobileCard className="p-6">
          <MobileSectionIntro
            eyebrow={`${STEPS.length}단계 중 4단계`}
            title="상담 분위기를 골라주세요"
          />
          <div className="mt-4 grid gap-4">
            <div className="grid grid-cols-2 gap-2">
              {["차분하게", "친근하게", "전문적으로", "다정하게"].map((tone) => (
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
            <div className="flex gap-3">
              <button
                className="flex-1 rounded-full border border-[var(--line)] px-4 py-3 text-sm font-semibold text-[var(--text-soft)]"
                onClick={handleBack}
                type="button"
              >
                이전
              </button>
              <button
                className="flex-1 rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                disabled={isSubmitting}
                onClick={handleComplete}
                type="button"
              >
                {isSubmitting ? "준비 중..." : "시작하기"}
              </button>
            </div>
          </div>
        </MobileCard>
      )}
    </main>
  );
}
