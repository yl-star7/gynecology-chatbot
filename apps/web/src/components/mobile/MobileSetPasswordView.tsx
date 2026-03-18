"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  MobileCard,
  MobileSectionIntro,
} from "./MobilePrimitives";
import { setNativeTitle } from "./native-bridge";

type Props = {
  initialUserId?: string | null;
};

export function MobileSetPasswordView({ initialUserId }: Props) {
  const [copiedUserId, setCopiedUserId] = useState(initialUserId ?? null);

  useEffect(() => {
    setNativeTitle("문자 인증 안내");
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col gap-4 px-4 py-5">
      <MobileCard className="p-6 backdrop-blur">
        <MobileSectionIntro
          eyebrow="안내"
          title="비밀번호 설정 단계는 제거되었습니다"
          description="이제 전화번호 문자 인증만 확인하면 바로 로그인됩니다. 이후 온보딩에서 이름과 태명, 예정일을 저장하면 됩니다."
        />
        <div className="mt-4 grid gap-2 rounded-[22px] border border-[var(--line)] bg-[var(--accent-soft)] p-4 text-sm text-[var(--accent-dark)]">
          <p>1. 전화번호 입력</p>
          <p>2. 문자 코드 발송</p>
          <p>3. 코드 확인 후 바로 로그인</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            className="rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white"
            href={copiedUserId ? `/auth/login?userId=${encodeURIComponent(copiedUserId)}` : "/auth/login"}
          >
            로그인 화면으로 이동
          </Link>
        </div>
      </MobileCard>
    </main>
  );
}
