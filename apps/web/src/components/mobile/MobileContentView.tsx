"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { appendUserIdToPath, fetchLinkTarget, resolveMobileUserId } from "@/lib/mobile/web-mobile-api";
import { setNativeTitle } from "./native-bridge";
import { MobileShell } from "./MobileShell";
import { useMobileSessionGuard } from "./useMobileSessionGuard";

function resolveEyebrowLabel(title: string, sectionTitle: string) {
  return title === sectionTitle ? "참고 문서" : title;
}

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
    setNativeTitle(sectionTitle);
  }, [sectionTitle]);

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
    <MobileShell
      title={title}
      description="앱 내부 문서를 확인합니다."
      userId={resolvedUserId}
      showTitleBlock={false}
      headerMode="compact"
    >
      <div className="grid gap-4">
        <header className="rounded-[26px] border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[var(--shadow)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-dark)]">
            {resolveEyebrowLabel(title, sectionTitle)}
          </p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-[var(--text)]">
            {sectionTitle}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
            {error ?? "앱 내부 참고 문서를 그대로 확인하는 화면입니다."}
          </p>
        </header>

        <article className="rounded-[26px] border border-[var(--line)] bg-[var(--panel-strong)] p-5 text-[15px] leading-7 text-[var(--text)] shadow-[var(--shadow)]">
          {body ? (
            <p className="whitespace-pre-wrap">{body}</p>
          ) : (
            <p className="text-[var(--text-soft)]">콘텐츠를 불러오는 중입니다.</p>
          )}
        </article>

        <div className="flex gap-3">
          <Link
            href={appendUserIdToPath("/", resolvedUserId)}
            className="rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white"
          >
            홈으로
          </Link>
          <Link
            href={appendUserIdToPath("/chat/new", resolvedUserId)}
            className="rounded-full bg-[var(--accent-dark)] px-4 py-3 text-sm font-semibold text-white"
          >
            상담으로 이동
          </Link>
        </div>
      </div>
    </MobileShell>
  );
}
