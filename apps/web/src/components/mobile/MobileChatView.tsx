"use client";

import type { ChatMessage, RecentChatSummary } from "@gynecology-chatbot/app-core";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createSessionId,
  fetchSession,
  fetchSessions,
  fileToDataUrl,
  sendChatMessage,
} from "@/lib/mobile/web-mobile-api";
import { MobileShell } from "./MobileShell";
import { useMobileSessionGuard } from "./useMobileSessionGuard";

function createDraftMessage(text: string, imageDataUrl?: string): ChatMessage {
  const parts: ChatMessage["parts"] = [];

  if (text.trim()) {
    parts.push({ type: "text", id: `text-${Date.now()}`, text: text.trim() });
  }

  if (imageDataUrl) {
    parts.push({
      type: "image",
      id: `image-${Date.now()}`,
      imageUrl: imageDataUrl,
      alt: "업로드 이미지",
      caption: "사용자 첨부 이미지",
    });
  }

  return {
    id: `draft-${Date.now()}`,
    role: "user",
    createdAtLabel: "방금 전",
    parts,
  };
}

function renderMessagePart(part: ChatMessage["parts"][number], userId: string | null) {
  if (part.type === "text") {
    return (
      <p key={part.id} className="whitespace-pre-wrap text-[15px] leading-7 text-[var(--text)]">
        {part.text}
      </p>
    );
  }

  if (part.type === "image") {
    return (
      <div key={part.id} className="grid gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={part.imageUrl} alt={part.alt} className="h-52 w-full rounded-[20px] object-cover" />
        {part.caption ? <p className="text-xs text-[var(--text-soft)]">{part.caption}</p> : null}
      </div>
    );
  }

  if (part.type === "deepLink") {
    const href = `/link/${part.target}?${new URLSearchParams({
      ...(userId ? { userId } : {}),
      ...(part.entityId ? { entityId: part.entityId } : {}),
    }).toString()}`;

    return (
      <Link key={part.id} href={href} className="rounded-[18px] bg-[var(--accent-soft)] p-4">
        <p className="font-medium text-[var(--accent-dark)]">{part.title}</p>
        <p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">{part.description}</p>
      </Link>
    );
  }

  if (part.type === "carousel") {
    return (
      <div key={part.id} className="grid gap-3">
        <p className="font-medium text-[var(--text)]">{part.title}</p>
        <div className="grid gap-3">
          {part.cards.map((card) => (
            <div key={card.id} className="rounded-[18px] border border-[var(--line)] bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-soft)]">{card.eyebrow}</p>
              <p className="mt-2 font-medium text-[var(--text)]">{card.title}</p>
              <p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div key={part.id} className="rounded-[18px] border border-[var(--line)] bg-white/70 p-4">
      <p className="font-medium text-[var(--text)]">{part.title}</p>
      <p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">{part.body}</p>
    </div>
  );
}

export function MobileChatView({ userId, initialSessionId }: { userId: string | null; initialSessionId: string }) {
  const resolvedUserId = useMobileSessionGuard(userId);
  const [resolvedSessionId] = useState(() => (initialSessionId === "new" ? createSessionId() : initialSessionId));
  const [sessionTitle, setSessionTitle] = useState("새 상담");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [recentSessions, setRecentSessions] = useState<RecentChatSummary[]>([]);
  const [text, setText] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    window.PhedyNative?.setTitle?.("상담 채팅");
  }, []);

  useEffect(() => {
    if (!resolvedUserId) {
      return;
    }

    let cancelled = false;

    fetchSessions(resolvedUserId)
      .then((payload) => {
        if (!cancelled) {
          setRecentSessions(payload.sessions.slice(0, 6));
        }
      })
      .catch((nextError) => {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "최근 세션을 불러오지 못했습니다.");
        }
      });

    if (initialSessionId === "new") {
      return () => {
        cancelled = true;
      };
    }

    fetchSession(resolvedUserId, resolvedSessionId)
      .then((payload) => {
        if (!cancelled) {
          setSessionTitle(payload.session.title);
          setMessages(payload.session.messages);
        }
      })
      .catch((nextError) => {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "세션을 불러오지 못했습니다.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialSessionId, resolvedSessionId, resolvedUserId]);

  const chatHrefBase = useMemo(
    () => (resolvedUserId ? `/chat/${resolvedSessionId}?userId=${encodeURIComponent(resolvedUserId)}` : `/chat/${resolvedSessionId}`),
    [resolvedSessionId, resolvedUserId],
  );

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setImageDataUrl(null);
      return;
    }

    setImageDataUrl(await fileToDataUrl(file));
  }, []);

  const handleSend = useCallback(async () => {
    if (!resolvedUserId) {
      return;
    }

    if (!text.trim() && !imageDataUrl) {
      return;
    }

    const draftMessage = createDraftMessage(text, imageDataUrl ?? undefined);
    setMessages((current) => [...current, draftMessage]);
    setSessionTitle((current) => (current === "새 상담" && text.trim() ? text.trim().slice(0, 24) : current));
    setIsSending(true);
    setError(null);

    try {
      const payload = await sendChatMessage({
        userId: resolvedUserId,
        sessionId: resolvedSessionId,
        text,
        imageDataUris: imageDataUrl ? [imageDataUrl] : [],
      });

      setMessages((current) => [...current, payload.assistantMessage]);
      setText("");
      setImageDataUrl(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "메시지를 전송하지 못했습니다.");
    } finally {
      setIsSending(false);
    }
  }, [imageDataUrl, resolvedSessionId, resolvedUserId, text]);

  return (
    <MobileShell title={sessionTitle} description={error ?? "텍스트와 이미지 첨부를 함께 전송할 수 있습니다."} userId={resolvedUserId}>
      <div className="grid gap-4">
        <section className="rounded-[30px] border border-[var(--line)] bg-white/90 p-5 shadow-[var(--shadow)]">
          <div className="grid gap-3">
            {messages.length > 0 ? (
              messages.map((message) => (
                <article
                  key={message.id}
                  className={`rounded-[24px] p-4 ${message.role === "user" ? "bg-[var(--accent-soft)]" : "border border-[var(--line)] bg-[rgba(255,255,255,0.8)]"}`}
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-[var(--text)]">{message.role === "user" ? "나" : "상담 도우미"}</span>
                    <span className="text-xs text-[var(--text-soft)]">{message.createdAtLabel}</span>
                  </div>
                  <div className="grid gap-3">{message.parts.map((part) => renderMessagePart(part, resolvedUserId))}</div>
                </article>
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-[var(--line)] p-5 text-sm leading-6 text-[var(--text-soft)]">
                아직 메시지가 없습니다. 증상, 궁금한 점, 이미지를 바로 첨부해서 시작하세요.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[30px] border border-[var(--line)] bg-white/90 p-5 shadow-[var(--shadow)]">
          <div className="grid gap-3">
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="불편한 증상이나 궁금한 점을 입력하세요."
              className="min-h-28 rounded-[22px] border border-[var(--line)] bg-[rgba(20,34,20,0.03)] px-4 py-3 text-[15px] text-[var(--text)] outline-none"
            />
            <label className="rounded-[18px] border border-dashed border-[var(--line)] px-4 py-3 text-sm text-[var(--text-soft)]">
              이미지 첨부
              <input type="file" accept="image/*" className="mt-2 block w-full text-sm" onChange={handleFileChange} />
            </label>
            {imageDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageDataUrl} alt="첨부 미리보기" className="h-40 w-full rounded-[20px] object-cover" />
            ) : null}
            <button
              type="button"
              onClick={handleSend}
              disabled={isSending}
              className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSending ? "전송 중" : "보내기"}
            </button>
          </div>
        </section>

        <section className="rounded-[30px] border border-[var(--line)] bg-white/85 p-5 shadow-[var(--shadow)]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[var(--text)]">최근 세션</h2>
            <Link href={chatHrefBase} className="text-sm font-medium text-[var(--accent-dark)]">
              현재 세션 링크
            </Link>
          </div>
          <div className="grid gap-3">
            {recentSessions.map((session) => (
              <Link
                key={session.id}
                href={`/chat/${session.id}${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`}
                className="rounded-[18px] border border-[var(--line)] bg-[rgba(20,34,20,0.03)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-[var(--text)]">{session.title}</p>
                    <p className="mt-1 text-sm text-[var(--text-soft)]">{session.preview}</p>
                  </div>
                  <span className="text-xs text-[var(--text-soft)]">{session.updatedAtLabel}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </MobileShell>
  );
}
