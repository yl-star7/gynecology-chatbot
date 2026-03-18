"use client";

import type { MobileContentListItem } from "@gynecology-chatbot/app-core";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  appendUserIdToPath,
  fetchContentItems,
  resolveMobileUserId,
} from "@/lib/mobile/web-mobile-api";
import { MobileCard } from "./MobilePrimitives";
import { MobileShell } from "./MobileShell";
import { useMobileSessionGuard } from "./useMobileSessionGuard";

export function MobileContentIndexView({
  section,
  title,
  userId,
}: {
  section: "knowledge" | "notebook";
  title: string;
  userId: string | null;
}) {
  const searchParams = useSearchParams();
  const resolvedUserId = useMobileSessionGuard(
    resolveMobileUserId(userId ?? searchParams.get("userId")),
  );
  const [items, setItems] = useState<MobileContentListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetchContentItems(section)
      .then((payload) => {
        if (!active) {
          return;
        }

        setItems(payload.items);
        setError(null);
      })
      .catch((nextError) => {
        if (!active) {
          return;
        }

        setError(
          nextError instanceof Error
            ? nextError.message
            : "콘텐츠 목록을 불러오지 못했습니다.",
        );
      });

    return () => {
      active = false;
    };
  }, [section]);

  return (
    <MobileShell
      title={title}
      description={error ?? "앱 내부 정적 문헌 목록을 확인합니다."}
      userId={resolvedUserId}
      showTitleBlock={false}
      showChatFab
    >
      <div className="grid gap-4">
        <MobileCard as="header" className="rounded-[26px] p-5 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-dark)]">
            {section}
          </p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-[var(--text)]">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
            {error ?? "문헌 목록을 선택해 바로 상세 내용을 볼 수 있습니다."}
          </p>
        </MobileCard>

        <div className="grid gap-3">
          {items.length > 0 ? (
            items.map((item) => (
              <Link
                key={item.id}
                href={appendUserIdToPath(
                  `/link/${item.section}?entityId=${encodeURIComponent(item.id)}`,
                  resolvedUserId,
                )}
                className="rounded-[22px] border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-dark)]">
                  {item.slug}
                </p>
                <p className="mt-2 text-lg font-semibold text-[var(--text)]">
                  {item.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                  {item.preview}
                </p>
              </Link>
            ))
          ) : (
            <MobileCard as="div" className="rounded-[22px] p-5 text-sm text-[var(--text-soft)]">
              등록된 콘텐츠가 아직 없습니다.
            </MobileCard>
          )}
        </div>
      </div>
    </MobileShell>
  );
}
