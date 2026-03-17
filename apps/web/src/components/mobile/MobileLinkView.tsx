"use client";

import type { LinkTargetContent } from "@gynecology-chatbot/app-core";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchLinkTarget } from "@/lib/mobile/web-mobile-api";
import { MobileShell } from "./MobileShell";

export function MobileLinkView({
  userId,
  target,
  entityId,
}: {
  userId: string | null;
  target: string;
  entityId?: string;
}) {
  const [content, setContent] = useState<LinkTargetContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.PhedyNative?.setTitle?.("참고 콘텐츠");
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchLinkTarget(target, entityId)
      .then((payload) => {
        if (!cancelled) {
          setContent(payload.content);
          setError(null);
        }
      })
      .catch((nextError) => {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "콘텐츠를 불러오지 못했습니다.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [entityId, target]);

  const backHref = userId ? `/?userId=${encodeURIComponent(userId)}` : "/";

  return (
    <MobileShell
      title={content?.title ?? "콘텐츠를 불러오는 중"}
      description={error ?? `${target} 섹션의 내부 콘텐츠를 웹 앱에서 바로 확인합니다.`}
      userId={userId}
    >
      <section className="rounded-[30px] border border-[var(--line)] bg-white/90 p-6 shadow-[var(--shadow)]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-dark)]">{content?.section ?? target}</p>
        <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.03em] text-[var(--text)]">{content?.title ?? "콘텐츠 연결 중"}</h2>
        <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-[var(--text-soft)]">
          {error ?? content?.body ?? "의학 정보와 참고 안내를 불러오고 있습니다."}
        </p>
        <div className="mt-6 flex gap-3">
          <Link href={backHref} className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white">
            홈으로 돌아가기
          </Link>
          {userId ? (
            <Link
              href={`/chat/new?userId=${encodeURIComponent(userId)}`}
              className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-medium text-[var(--text)]"
            >
              상담 이어가기
            </Link>
          ) : null}
        </div>
      </section>
    </MobileShell>
  );
}
