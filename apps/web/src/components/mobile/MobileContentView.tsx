"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { appendUserIdToPath, fetchLinkTarget, resolveMobileUserId } from "@/lib/mobile/web-mobile-api";
import { setNativeTitle } from "./native-bridge";
import { useMobileSessionGuard } from "./useMobileSessionGuard";

export function MobileContentView({
  target,
  title,
  userId,
  entityId,
}: {
  target: string;
  title: string;
  userId?: string | null;
  entityId?: string;
}) {
  const searchParams = useSearchParams();
  const resolvedUserId = useMobileSessionGuard(resolveMobileUserId(userId ?? searchParams.get("userId")));
  const [body, setBody] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [sectionTitle, setSectionTitle] = useState(title);

  useEffect(() => {
    setNativeTitle(title);
  }, [title]);

  useEffect(() => {
    let active = true;

    fetchLinkTarget(target, entityId)
      .then((payload) => {
        if (!active) {
          return;
        }
        setSectionTitle(payload.content.title);
        setBody(payload.content.body);
        setError(null);
      })
      .catch((nextError) => {
        if (!active) {
          return;
        }
        setError(nextError instanceof Error ? nextError.message : "콘텐츠를 불러오지 못했습니다.");
      });

    return () => {
      active = false;
    };
  }, [entityId, target]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col gap-4 px-4 py-5">
      <header className="rounded-[26px] border border-black/5 bg-white/85 p-5 shadow-[0_18px_48px_rgba(28,42,31,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#546355]">{title}</p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-[#142214]">{sectionTitle}</h1>
        <p className="mt-3 text-sm leading-6 text-[#546355]">{error ?? "앱 내부 참조 문서를 그대로 확인하는 화면입니다."}</p>
      </header>

      <article className="rounded-[26px] border border-black/5 bg-white/80 p-5 text-[15px] leading-7 text-[#142214] shadow-[0_18px_48px_rgba(28,42,31,0.08)]">
        {body ? <p className="whitespace-pre-wrap">{body}</p> : <p className="text-[#546355]">콘텐츠를 불러오는 중입니다.</p>}
      </article>

      <div className="flex gap-3">
        <Link href={appendUserIdToPath("/", resolvedUserId)} className="rounded-full bg-[#142214] px-4 py-3 text-sm font-semibold text-white">
          홈
        </Link>
        <Link href={appendUserIdToPath("/chat/new", resolvedUserId)} className="rounded-full bg-[#d76c57] px-4 py-3 text-sm font-semibold text-white">
          채팅으로 이동
        </Link>
      </div>
    </main>
  );
}
