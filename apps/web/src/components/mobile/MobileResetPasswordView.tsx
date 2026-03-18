"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  requestPasswordReset,
  setPassword as submitPassword,
  verifyPhone,
} from "@/lib/mobile/web-mobile-api";
import { setNativeTitle } from "./native-bridge";

export function MobileResetPasswordView() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setNativeTitle("비밀번호 재설정");
  }, []);

  async function handleRequestCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!phoneNumber.trim()) {
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      await requestPasswordReset({ phoneNumber: phoneNumber.trim() });
      setSubmitted(true);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "재설정 요청을 보내지 못했습니다.",
      );
      setSubmitted(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword(event: React.FormEvent<HTMLFormElement>) {
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

      await submitPassword({
        verificationToken: verification.verificationToken,
        password: password.trim(),
      });

      router.replace("/auth/login");
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "비밀번호를 다시 설정하지 못했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col gap-4 px-4 py-5">
      <section className="rounded-[28px] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent-dark)]">
          Reset Password
        </p>
        <h1 className="mt-3 text-[30px] font-semibold tracking-[-0.04em] text-[var(--text)]">
          비밀번호 재설정
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
          재설정 코드를 문자로 받고, 코드를 확인한 뒤 새 비밀번호를 바로
          저장합니다.
        </p>
      </section>

      <form
        className="rounded-[28px] border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]"
        onSubmit={handleRequestCode}
      >
        <div className="grid gap-3">
          <input
            className="rounded-[18px] border border-[var(--line)] bg-[var(--panel-muted)] px-4 py-3 outline-none"
            inputMode="tel"
            onChange={(event) => setPhoneNumber(event.target.value)}
            placeholder="전화번호"
            value={phoneNumber}
          />
          {error ? (
            <p className="rounded-2xl bg-[#fff4f1] px-3 py-2 text-sm text-[#8c4738]">
              {error}
            </p>
          ) : null}
          {submitted ? (
            <p className="rounded-2xl bg-[#eef6f3] px-3 py-2 text-sm text-[#2f7a55]">
              인증 코드를 발송했습니다. 아래에서 코드를 확인하고 새 비밀번호를
              입력하세요.
            </p>
          ) : null}
          <button
            className="rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? "요청 중"
              : submitted
                ? "코드 다시 보내기"
                : "인증 코드 보내기"}
          </button>
        </div>
      </form>

      <form
        className="rounded-[28px] border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]"
        onSubmit={handleResetPassword}
      >
        <div className="grid gap-3">
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
          <button
            className="rounded-full bg-[var(--text)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            disabled={isSubmitting || !submitted}
            type="submit"
          >
            {isSubmitting ? "저장 중" : "새 비밀번호 저장"}
          </button>
        </div>
      </form>

      <Link
        className="text-sm font-semibold text-[var(--text-soft)]"
        href="/auth/login"
      >
        로그인으로 돌아가기
      </Link>
    </main>
  );
}
