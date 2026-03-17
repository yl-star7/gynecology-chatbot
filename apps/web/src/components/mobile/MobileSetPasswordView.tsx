"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { appendUserIdToPath } from "@/lib/mobile/web-mobile-api";
import { setPassword as submitPassword, verifyPhone } from "@/lib/mobile/web-mobile-api";
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
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setNativeTitle("비밀번호 설정");
  }, []);

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
      router.replace(appendUserIdToPath("/auth/login", payload.user.id));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "비밀번호를 저장하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col gap-4 px-4 py-5">
      <section className="rounded-[28px] border border-black/5 bg-white/85 p-6 shadow-[0_24px_80px_rgba(28,42,31,0.12)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b24f3c]">Set Password</p>
        <h1 className="mt-3 text-[30px] font-semibold tracking-[-0.04em] text-[#142214]">최초 비밀번호 설정</h1>
        <p className="mt-3 text-sm leading-6 text-[#546355]">전화번호 인증 코드를 확인한 뒤 비밀번호 설정 API를 호출합니다. 완료 후 로그인 화면으로 이어집니다.</p>
      </section>

      <form className="rounded-[28px] border border-black/5 bg-white/80 p-5 shadow-[0_18px_48px_rgba(28,42,31,0.08)]" onSubmit={handleSubmit}>
        <div className="grid gap-3">
          <input className="rounded-[18px] border border-black/10 bg-[#f9fbf7] px-4 py-3 outline-none" inputMode="tel" onChange={(event) => setPhoneNumber(event.target.value)} placeholder="전화번호" value={phoneNumber} />
          <input className="rounded-[18px] border border-black/10 bg-[#f9fbf7] px-4 py-3 outline-none" inputMode="numeric" onChange={(event) => setVerificationCode(event.target.value)} placeholder="인증 코드" value={verificationCode} />
          <input className="rounded-[18px] border border-black/10 bg-[#f9fbf7] px-4 py-3 outline-none" onChange={(event) => setPassword(event.target.value)} placeholder="새 비밀번호" type="password" value={password} />
          {error ? <p className="rounded-2xl bg-[#fff4f1] px-3 py-2 text-sm text-[#8c4738]">{error}</p> : null}
          <button className="rounded-full bg-[#d76c57] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={isSubmitting} type="submit">{isSubmitting ? "저장 중" : "비밀번호 저장"}</button>
        </div>
      </form>

      <Link className="text-sm font-semibold text-[#546355]" href="/auth/login">로그인으로 돌아가기</Link>
    </main>
  );
}
