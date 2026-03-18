"use client";

import {
  DEFAULT_MOBILE_THEME_KEY,
  type MobileThemeKey,
} from "@gynecology-chatbot/app-core";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  appendUserIdToPath,
  requestPhoneVerification,
  signInWithPhoneVerification,
} from "@/lib/mobile/web-mobile-api";
import {
  hasCompletedMobileOnboarding,
  readStoredMobileThemeKey,
  readStoredMobileUserId,
  storeMobileProfile,
  storeMobileSessionToken,
  storeMobileThemeKey,
  storeMobileUserId,
} from "@/lib/mobile/mobile-session";
import { applyMobileTheme } from "@/lib/mobile/themes";
import {
  MobileCard,
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
    if (initialUserId || typeof window === "undefined") {
      return;
    }

    const storedUserId = readStoredMobileUserId();
    if (storedUserId) {
      router.replace(
        appendUserIdToPath(
          hasCompletedMobileOnboarding() ? "/" : "/onboarding",
          storedUserId,
        ),
      );
    }
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
          : "로그인하지 못했습니다.",
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
        "인증 코드를 발송했습니다. 문자로 받은 코드를 입력하세요.",
      );
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "인증 코드를 보내지 못했습니다.",
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
          eyebrow="시작하기"
          title="안녕하세요. 오늘 기록을 이어가 볼까요?"
          description="전화번호로 문자 인증을 한 번 확인하면 바로 로그인됩니다. 이후에는 1년 세션을 기준으로 다시 로그인하지 않고 이어서 사용할 수 있어요."
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
              className="rounded-[18px] border border-[var(--line)] bg-[var(--panel-muted)] px-4 py-3 text-[15px] text-[var(--text)] outline-none"
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
                ? "코드 다시 보내기"
                : "인증 코드 보내기"}
          </button>
          <MobileFormField label="인증 코드">
            <input
              className="rounded-[18px] border border-[var(--line)] bg-[var(--panel-muted)] px-4 py-3 text-[15px] text-[var(--text)] outline-none"
              inputMode="numeric"
              onChange={(event) => setVerificationCode(event.target.value)}
              placeholder="인증 코드"
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
            {isSubmitting ? "인증 확인 중" : "인증하고 로그인"}
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
