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
        appendUserIdToPath(hasCompletedMobileOnboarding() ? "/" : "/onboarding", storedUserId),
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
      setError(nextError instanceof Error ? nextError.message : "로그인하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col gap-4 px-4 py-5">
      <section className="rounded-[28px] border border-black/5 bg-white/85 p-6 shadow-[0_24px_80px_rgba(28,42,31,0.12)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b24f3c]">Login</p>
        <h1 className="mt-3 text-[30px] font-semibold tracking-[-0.04em] text-[#142214]">전화번호와 비밀번호로 로그인</h1>
        <p className="mt-3 text-sm leading-6 text-[#546355]">
          전화번호 로그인 후 사용자 ID는 API 응답에서 받아 저장합니다. 온보딩 완료 여부에 따라 홈 또는 온보딩으로 자동 이동합니다.
        </p>
      </section>

      <form className="rounded-[28px] border border-black/5 bg-white/80 p-5 shadow-[0_18px_48px_rgba(28,42,31,0.08)]" onSubmit={handleSubmit}>
        <div className="grid gap-3">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[#142214]">전화번호</span>
            <input
              className="rounded-[18px] border border-black/10 bg-[#f9fbf7] px-4 py-3 text-[15px] text-[#142214] outline-none"
              inputMode="tel"
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder="01012345678"
              value={phoneNumber}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[#142214]">비밀번호</span>
            <input
              className="rounded-[18px] border border-black/10 bg-[#f9fbf7] px-4 py-3 text-[15px] text-[#142214] outline-none"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호"
              type="password"
              value={password}
            />
          </label>
          {error ? <p className="rounded-2xl bg-[#fff4f1] px-3 py-2 text-sm text-[#8c4738]">{error}</p> : null}
          <button className="rounded-full bg-[#d76c57] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={isSubmitting} type="submit">
            {isSubmitting ? "로그인 중" : "로그인"}
          </button>
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          className="rounded-[24px] border border-black/5 bg-white/80 p-5 text-sm leading-6 text-[#546355] shadow-[0_18px_48px_rgba(28,42,31,0.08)]"
          href="/auth/set-password"
        >
          <strong className="block text-base text-[#142214]">최초 비밀번호 설정</strong>
          휴대폰 인증 이후 최초 비밀번호를 등록합니다.
        </Link>
        <Link
          className="rounded-[24px] border border-black/5 bg-white/80 p-5 text-sm leading-6 text-[#546355] shadow-[0_18px_48px_rgba(28,42,31,0.08)]"
          href="/auth/reset-password"
        >
          <strong className="block text-base text-[#142214]">비밀번호 재설정</strong>
          전화번호 기준으로 비밀번호를 다시 설정합니다.
        </Link>
      </div>
    </main>
  );
}
