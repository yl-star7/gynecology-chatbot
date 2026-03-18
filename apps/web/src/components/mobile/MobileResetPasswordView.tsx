"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  MobileCard,
  MobileSectionIntro,
} from "./MobilePrimitives";
import { setNativeTitle } from "./native-bridge";

export function MobileResetPasswordView() {
  const [redirectPath] = useState("/auth/login");

  useEffect(() => {
    setNativeTitle("로그인 안내");
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col gap-4 px-4 py-5">
      <MobileCard className="p-6 backdrop-blur">
        <MobileSectionIntro
          eyebrow="안내"
          title="비밀번호 재설정 단계는 더 이상 필요하지 않습니다"
          description="로그인 중 세션이 만료되면 같은 전화번호로 다시 인증 코드만 확인하면 됩니다."
        />
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            className="rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white"
            href={redirectPath}
          >
            로그인 화면으로 이동
          </Link>
        </div>
      </MobileCard>
    </main>
  );
}
