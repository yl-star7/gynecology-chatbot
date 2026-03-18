"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signInWithPhonePassword } from "@/lib/mobile/web-mobile-api";
import { appendUserIdToPath } from "@/lib/mobile/web-mobile-api";
import {
  hasCompletedMobileOnboarding,
  readStoredMobileUserId,
  storeMobileProfile,
  storeMobileUserId,
} from "@/lib/mobile/mobile-session";
import { setNativeTitle } from "./native-bridge";

type Props = {
  initialUserId?: string | null;
};

export function MobileLoginView({ initialUserId }: Props) {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setNativeTitle("로그인");
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

    if (!phoneNumber.trim() || !password.trim()) {
      setError("전화번호와 비밀번호를 먼저 입력하세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = await signInWithPhonePassword({
        phoneNumber: phoneNumber.trim(),
        password: password.trim(),
      });

      storeMobileUserId(payload.user.id);
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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col gap-4 px-4 py-5">
      <section className="rounded-[28px] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent-dark)]">
          Welcome
        </p>
        <h1 className="mt-3 text-[30px] font-semibold tracking-[-0.04em] text-[var(--text)]">
          처음 시작하거나, 다시 이어서 로그인
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
          처음 사용자라면 문자 인증으로 비밀번호를 만든 뒤 바로 온보딩으로
          이어집니다. 기존 사용자는 전화번호와 비밀번호로 바로 로그인합니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            className="rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white"
            href="/auth/set-password"
          >
            처음 시작하기
          </Link>
          <Link
            className="rounded-full border border-[var(--line)] px-4 py-3 text-sm font-semibold text-[var(--text-soft)]"
            href="/auth/reset-password"
          >
            비밀번호 재설정
          </Link>
        </div>
      </section>

      <form
        className="rounded-[28px] border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-3">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[#142214]">
              전화번호
            </span>
            <input
              className="rounded-[18px] border border-[var(--line)] bg-[var(--panel-muted)] px-4 py-3 text-[15px] text-[var(--text)] outline-none"
              inputMode="tel"
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder="01012345678"
              value={phoneNumber}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[#142214]">
              비밀번호
            </span>
            <input
              className="rounded-[18px] border border-[var(--line)] bg-[var(--panel-muted)] px-4 py-3 text-[15px] text-[var(--text)] outline-none"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호"
              type="password"
              value={password}
            />
          </label>
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
            {isSubmitting ? "로그인 중" : "로그인"}
          </button>
        </div>
      </form>

      <div className="rounded-[24px] border border-[var(--line)] bg-[var(--panel)] p-5 text-sm leading-6 text-[var(--text-soft)] shadow-[var(--shadow)]">
        <strong className="block text-base text-[var(--text)]">
          Mock User 시작 플로우
        </strong>
        등록된 전화번호 입력 후 문자 코드를 받고, 비밀번호를 만든 뒤 온보딩에서
        예정일과 상담 톤을 설정합니다.
      </div>
    </main>
  );
}
