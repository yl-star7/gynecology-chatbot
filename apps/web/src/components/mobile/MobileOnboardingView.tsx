"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { completeOnboarding } from "@/lib/mobile/web-mobile-api";
import { appendUserIdToPath } from "@/lib/mobile/web-mobile-api";
import { markMobileOnboardingComplete, storeMobileUserId } from "@/lib/mobile/mobile-session";
import { setNativeTitle } from "./native-bridge";

type Props = {
  userId?: string | null;
};

export function MobileOnboardingView({ userId }: Props) {
  const router = useRouter();
  const [pregnancyInfo, setPregnancyInfo] = useState("");
  const [tonePreference, setTonePreference] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setNativeTitle("온보딩");
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId || !pregnancyInfo.trim() || !tonePreference.trim()) {
      setError("주차 또는 예정일과 상담 톤을 입력하세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = await completeOnboarding({
        userId,
        pregnancyWeekOrDueDate: [pregnancyInfo.trim(), notes.trim()].filter(Boolean).join(" / "),
        tonePreference: tonePreference.trim(),
      });

      storeMobileUserId(payload.user.id);
      markMobileOnboardingComplete();
      router.replace(appendUserIdToPath("/", payload.user.id));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "온보딩을 저장하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col gap-4 px-4 py-5">
      <section className="rounded-[28px] border border-black/5 bg-white/85 p-6 shadow-[0_24px_80px_rgba(28,42,31,0.12)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b24f3c]">Onboarding</p>
        <h1 className="mt-3 text-[30px] font-semibold tracking-[-0.04em] text-[#142214]">임신 정보와 상담 톤 설정</h1>
        <p className="mt-3 text-sm leading-6 text-[#546355]">초기 사용자 설정을 모바일 API에 저장하고 홈으로 이어집니다.</p>
      </section>

      <form className="rounded-[28px] border border-black/5 bg-white/80 p-5 shadow-[0_18px_48px_rgba(28,42,31,0.08)]" onSubmit={handleSubmit}>
        <div className="grid gap-3">
          <input className="rounded-[18px] border border-black/10 bg-[#f9fbf7] px-4 py-3 outline-none" onChange={(event) => setPregnancyInfo(event.target.value)} placeholder="임신 주차 또는 예정일" value={pregnancyInfo} />
          <input className="rounded-[18px] border border-black/10 bg-[#f9fbf7] px-4 py-3 outline-none" onChange={(event) => setTonePreference(event.target.value)} placeholder="상담 톤 선호" value={tonePreference} />
          <textarea className="min-h-28 rounded-[18px] border border-black/10 bg-[#f9fbf7] px-4 py-3 outline-none" onChange={(event) => setNotes(event.target.value)} placeholder="추가 메모" value={notes} />
          {error ? <p className="rounded-2xl bg-[#fff4f1] px-3 py-2 text-sm text-[#8c4738]">{error}</p> : null}
          <button className="rounded-full bg-[#d76c57] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={isSubmitting} type="submit">{isSubmitting ? "저장 중" : "온보딩 완료"}</button>
        </div>
      </form>

      <Link className="text-sm font-semibold text-[#546355]" href={appendUserIdToPath("/auth/login", userId)}>로그인으로 돌아가기</Link>
    </main>
  );
}
