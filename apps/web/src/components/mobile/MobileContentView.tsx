"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { appendUserIdToPath, fetchLinkTarget, resolveMobileUserId } from "@/lib/mobile/web-mobile-api";
import { setNativeTitle } from "./native-bridge";
import { MobileCard, MobileSkeletonBlock } from "./MobilePrimitives";
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
  const resolvedUserId = useMobileSessionGuard(
    resolveMobileUserId(userId ?? searchParams?.get("userId") ?? null),
  );
  const backHref = appendUserIdToPath("/", resolvedUserId);
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
        setError(nextError instanceof Error ? nextError.message : "내용을 불러오지 못했어요.");
      });

    return () => {
      active = false;
    };
  }, [entityId, target]);

  return (
    <MobileShell
      title="콘텐츠"
      description="상세 내용을 확인해보세요."
      userId={resolvedUserId}
      backHref={backHref}
      showTitleBlock={false}
      showChatFab
    >
      <div className="grid gap-4">
        <MobileCard
          as="header"
          className="rounded-[26px] p-5 backdrop-blur"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-dark)]">
            {resolveEyebrowLabel(title, sectionTitle)}
          </p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-[var(--text)]">
            {sectionTitle}
          </h1>
          {error ? (
            <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
              {error}
            </p>
          ) : body ? (
            <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
              내용을 확인해보세요.
            </p>
          ) : (
            <div className="mt-3 grid gap-2">
              <MobileSkeletonBlock className="h-4 w-full" />
              <MobileSkeletonBlock className="h-4 w-5/6" />
            </div>
          )}
        </MobileCard>

        <MobileCard
          as="article"
          className="rounded-[26px] p-5 text-[15px] leading-7 text-[var(--text)]"
        >
          {body ? (
            <p className="whitespace-pre-wrap">{body}</p>
          ) : (
            <div className="grid gap-3">
              <MobileSkeletonBlock className="h-4 w-full" />
              <MobileSkeletonBlock className="h-4 w-full" />
              <MobileSkeletonBlock className="h-4 w-4/5" />
              <MobileSkeletonBlock className="h-4 w-full" />
            </div>
          )}
        </MobileCard>

        <div className="flex gap-3">
          <Link
            href={appendUserIdToPath("/", resolvedUserId)}
            className="rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white"
          >
            홈으로
          </Link>
        </div>
      </div>
    </MobileShell>
  );
}
