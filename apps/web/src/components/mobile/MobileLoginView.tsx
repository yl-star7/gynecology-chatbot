"use client";

import {
  DEFAULT_MOBILE_THEME_KEY,
  type MobileThemeKey,
} from "@gynecology-chatbot/app-core";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  appendUserIdToPath,
  fetchCurrentMobileSession,
  requestPhoneVerification,
  signInWithPhoneVerification,
} from "@/lib/mobile/web-mobile-api";
import {
  clearMobileSession,
  hasCompletedMobileOnboarding,
  readStoredMobileSessionToken,
  readStoredMobileThemeKey,
  readStoredMobileUserId,
  setMobileOnboardingStatus,
  storeMobileProfile,
  storeMobileSessionToken,
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
  initialUserId?: string | null;
};

export function MobileLoginView({ initialUserId }: Props) {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [themeKey, setThemeKey] = useState(
    () => readStoredMobileThemeKey() ?? DEFAULT_MOBILE_THEME_KEY,
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [hasRequestedCode, setHasRequestedCode] = useState(false);

  useEffect(() => {
    setNativeTitle("로그인");
  }, []);

  useEffect(() => {
    const storedThemeKey = readStoredMobileThemeKey();
    if (storedThemeKey) {
      setThemeKey(storedThemeKey);
      applyMobileTheme(storedThemeKey);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedSessionToken = readStoredMobileSessionToken();
    const storedUserId = readStoredMobileUserId();

    if (!storedSessionToken) {
      if (storedUserId) {
        clearMobileSession();
      }

      return;
    }

    let cancelled = false;

    void fetchCurrentMobileSession()
      .then((payload) => {
        if (cancelled) {
          return;
        }

        storeMobileUserId(payload.user.id);
        storeMobileProfile({
          userId: payload.user.id,
          displayName: payload.user.displayName,
          phoneNumber: payload.user.phoneNumber,
        });
        setMobileOnboardingStatus(payload.user.hasCompletedOnboarding);
        router.replace(
          appendUserIdToPath(
            payload.user.hasCompletedOnboarding ? "/" : "/onboarding",
            payload.user.id,
          ),
        );
      })
      .catch(() => {
        if (!cancelled) {
          clearMobileSession();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialUserId, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!phoneNumber.trim() || !verificationCode.trim()) {
      setError("전화번호와 인증 코드를 먼저 입력하세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setStatusMessage(null);

    try {
      const payload = await signInWithPhoneVerification({
        phoneNumber: phoneNumber.trim(),
        verificationCode: verificationCode.trim(),
      });

      storeMobileUserId(payload.user.id);
      if (payload.sessionToken) {
        storeMobileSessionToken(payload.sessionToken);
      }
      setMobileOnboardingStatus(payload.user.hasCompletedOnboarding);
      storeMobileProfile({
        displayName: payload.user.displayName,
        phoneNumber: payload.user.phoneNumber,
      });
      router.replace(
        appendUserIdToPath(
          payload.user.hasCompletedOnboarding ? "/" : "/onboarding",
          payload.user.id,
        ),
      );
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "로그인에 실패했어요.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSendCode() {
    if (!phoneNumber.trim()) {
      setError("먼저 전화번호를 입력하세요.");
      return;
    }

    setIsSendingCode(true);
    setError(null);
    setStatusMessage(null);

    try {
      await requestPhoneVerification({
        phoneNumber: phoneNumber.trim(),
      });
      setHasRequestedCode(true);
      setStatusMessage(
        "인증번호를 보냈어요. 문자로 받은 번호를 입력해주세요.",
      );
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "인증번호를 보내지 못했어요.",
      );
    } finally {
      setIsSendingCode(false);
    }
  }

  function handleThemeSelect(nextThemeKey: MobileThemeKey) {
    setThemeKey(nextThemeKey);
    storeMobileThemeKey(nextThemeKey);
    applyMobileTheme(nextThemeKey);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col gap-4 px-4 py-5">
      <MobileCard className="p-6 backdrop-blur">
        <MobileSectionIntro
          eyebrow="본인 확인"
          title="전화번호로 간편하게 시작해요"
          description="한 번 인증하면 앱을 다시 열 때 자동으로 로그인돼요."
        />
        <div className="mt-5">
          <MobileThemePresetButtons
            label="분위기 테마"
            onSelect={handleThemeSelect}
            selectedThemeKey={themeKey}
          />
        </div>
      </MobileCard>

      <MobileCard as="form" className="p-5" onSubmit={handleSubmit}>
        <div className="grid gap-3">
          <MobileFormField label="전화번호">
            <input
              className={mobileFieldClassName}
              inputMode="tel"
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder="01012345678"
              value={phoneNumber}
            />
          </MobileFormField>
          <button
            className="rounded-full border border-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent)] disabled:opacity-60"
            disabled={isSendingCode}
            onClick={handleSendCode}
            type="button"
          >
            {isSendingCode
              ? "발송 중"
              : hasRequestedCode
                ? "인증번호 다시 보내기"
                : "인증번호 받기"}
          </button>
          <MobileFormField label="인증번호">
            <input
              className={mobileFieldClassName}
              inputMode="numeric"
              onChange={(event) => setVerificationCode(event.target.value)}
              placeholder="6자리 숫자"
              value={verificationCode}
            />
          </MobileFormField>
          {statusMessage ? (
            <MobileNotice tone="accent">{statusMessage}</MobileNotice>
          ) : null}
          {error ? <MobileNotice>{error}</MobileNotice> : null}
          <button
            className="rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "확인 중..." : "시작하기"}
          </button>
        </div>
      </MobileCard>

      <MobileCard as="div" className="rounded-[24px] p-5 text-sm leading-6 text-[var(--text-soft)]">
        <strong className="block text-base text-[var(--text)]">
          로그인 흐름
        </strong>
        전화번호 입력, 인증 코드 수신, 코드 확인까지 마치면 바로 홈 또는
        온보딩으로 이어집니다.
      </MobileCard>
    </main>
  );
}
