"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { requestPasswordReset } from "@/lib/mobile/web-mobile-api";
import { setNativeTitle } from "./native-bridge";

export function MobileResetPasswordView() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setNativeTitle("비밀번호 재설정");
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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
      setError(nextError instanceof Error ? nextError.message : "재설정 요청을 보내지 못했습니다.");
      setSubmitted(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col gap-4 px-4 py-5">
      <section className="rounded-[28px] border border-black/5 bg-white/85 p-6 shadow-[0_24px_80px_rgba(28,42,31,0.12)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b24f3c]">Reset Password</p>
        <h1 className="mt-3 text-[30px] font-semibold tracking-[-0.04em] text-[#142214]">비밀번호 재설정</h1>
        <p className="mt-3 text-sm leading-6 text-[#546355]">전화번호를 기준으로 재설정 요청을 시작하는 화면입니다. 실제 SMS 연동 전이라 요청 완료 메시지까지 연결했습니다.</p>
      </section>

      <form className="rounded-[28px] border border-black/5 bg-white/80 p-5 shadow-[0_18px_48px_rgba(28,42,31,0.08)]" onSubmit={handleSubmit}>
        <div className="grid gap-3">
          <input className="rounded-[18px] border border-black/10 bg-[#f9fbf7] px-4 py-3 outline-none" inputMode="tel" onChange={(event) => setPhoneNumber(event.target.value)} placeholder="전화번호" value={phoneNumber} />
          {error ? <p className="rounded-2xl bg-[#fff4f1] px-3 py-2 text-sm text-[#8c4738]">{error}</p> : null}
          {submitted ? <p className="rounded-2xl bg-[#eef6f3] px-3 py-2 text-sm text-[#2f7a55]">재설정 요청을 접수했습니다. 인증 코드 연동 단계만 남아 있습니다.</p> : null}
          <button className="rounded-full bg-[#d76c57] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={isSubmitting} type="submit">{isSubmitting ? "요청 중" : "재설정 요청"}</button>
        </div>
      </form>

      <Link className="text-sm font-semibold text-[#546355]" href="/auth/login">로그인으로 돌아가기</Link>
    </main>
  );
}
