"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { appendUserIdToPath } from "@/lib/mobile/web-mobile-api";
import {
  setPassword as submitPassword,
  startPhoneVerification,
  verifyPhone,
} from "@/lib/mobile/web-mobile-api";
import { storeMobileUserId } from "@/lib/mobile/mobile-session";
import { setNativeTitle } from "./native-bridge";

type Props = {
  initialUserId?: string | null;
};

export function MobileSetPasswordView({ initialUserId }: Props) {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [hasRequestedCode, setHasRequestedCode] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);

  useEffect(() => {
    setNativeTitle("비밀번호 설정");
  }, []);

  async function handleSendCode() {
    if (!phoneNumber.trim()) {
      setError("먼저 전화번호를 입력하세요.");
      return;
    }

    setIsSendingCode(true);
    setError(null);
    setStatusMessage(null);

    try {
      await startPhoneVerification({
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!phoneNumber.trim() || !verificationCode.trim() || !password.trim()) {
      setError("전화번호, 인증 코드, 새 비밀번호를 모두 입력하세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const verification = await verifyPhone({
        phoneNumber: phoneNumber.trim(),
        verificationCode: verificationCode.trim(),
      });

      const payload = await submitPassword({
        verificationToken: verification.verificationToken,
        password: password.trim(),
      });

      storeMobileUserId(payload.user.id);
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
          : "비밀번호를 저장하지 못했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col gap-4 px-4 py-5">
      <section className="rounded-[28px] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent-dark)]">
          Start
        </p>
        <h1 className="mt-3 text-[30px] font-semibold tracking-[-0.04em] text-[var(--text)]">
          문자 인증으로 시작하기
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
          등록된 전화번호로 인증 코드를 받고, 비밀번호를 만든 뒤 바로 온보딩으로
          이어집니다.
        </p>
        <div className="mt-4 grid gap-2 rounded-[22px] bg-[var(--accent-soft)] p-4 text-sm text-[var(--accent-dark)]">
          <p>1. 전화번호 입력</p>
          <p>2. 문자 코드 발송</p>
          <p>3. 코드 확인 후 비밀번호 생성</p>
        </div>
      </section>

      <form
        className="rounded-[28px] border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-3">
          <input
            className="rounded-[18px] border border-[var(--line)] bg-[var(--panel-muted)] px-4 py-3 outline-none"
            inputMode="tel"
            onChange={(event) => setPhoneNumber(event.target.value)}
            placeholder="전화번호"
            value={phoneNumber}
          />
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
          <input
            className="rounded-[18px] border border-[var(--line)] bg-[var(--panel-muted)] px-4 py-3 outline-none"
            inputMode="numeric"
            onChange={(event) => setVerificationCode(event.target.value)}
            placeholder="인증 코드"
            value={verificationCode}
          />
          <input
            className="rounded-[18px] border border-[var(--line)] bg-[var(--panel-muted)] px-4 py-3 outline-none"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="새 비밀번호"
            type="password"
            value={password}
          />
          {statusMessage ? (
            <p className="rounded-2xl bg-[#eef6f3] px-3 py-2 text-sm text-[#2f7a55]">
              {statusMessage}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-2xl bg-[#fff4f1] px-3 py-2 text-sm text-[#8c4738]">
              {error}
            </p>
          ) : null}
          <button
            className="rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "저장 중" : "다음으로"}
          </button>
        </div>
      </form>

      <Link
        className="text-sm font-semibold text-[var(--text-soft)]"
        href="/auth/login"
      >
        이미 계정이 있으면 로그인
      </Link>
    </main>
  );
}
