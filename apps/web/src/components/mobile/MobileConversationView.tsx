"use client";

import type { ChatMessage, ChatSession } from "@gynecology-chatbot/app-core";
import { useEffect, useMemo, useState } from "react";
import {
  createSessionId,
  fetchSession,
  sendChatMessage,
} from "@/lib/mobile/web-mobile-api";
import { MobileRichMessageParts } from "./MobileRichMessageParts";
import { MobileShell } from "./MobileShell";
import { useMobileSessionGuard } from "./useMobileSessionGuard";

function createDraftMessage(text: string): ChatMessage {
  return {
    id: `draft-${Date.now()}`,
    role: "user",
    createdAtLabel: "방금 전",
    parts: [{ type: "text", id: `text-${Date.now()}`, text }],
  };
}

function SendIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22 11 13 2 9 22 2Z" />
    </svg>
  );
}

export function MobileConversationView({
  userId,
  initialSessionId,
}: {
  userId: string | null;
  initialSessionId: string;
}) {
  const resolvedUserId = useMobileSessionGuard(userId);
  const [resolvedSessionId, setResolvedSessionId] = useState(() =>
    initialSessionId === "new" || initialSessionId === "heart-talk" ? createSessionId() : initialSessionId,
  );
  const [session, setSession] = useState<ChatSession | null>(null);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!resolvedUserId || initialSessionId === "new" || initialSessionId === "heart-talk") {
      setSession({ id: resolvedSessionId, title: "아기와 나누는 마음", messages: [] });
      return;
    }

    fetchSession(resolvedUserId, resolvedSessionId)
      .then((payload) => setSession(payload.session))
      .catch((nextError) => {
        setError(nextError instanceof Error ? nextError.message : "대화를 불러오지 못했어요.");
      });
  }, [initialSessionId, resolvedSessionId, resolvedUserId]);

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextText = text.trim();
    if (!resolvedUserId || !nextText || isSending) {
      return;
    }

    const draft = createDraftMessage(nextText);
    setSession((current) => ({
      id: current?.id ?? resolvedSessionId,
      title: current?.title ?? "아기와 나누는 마음",
      messages: [...(current?.messages ?? []), draft],
    }));
    setText("");
    setIsSending(true);

    try {
      const payload = await sendChatMessage({
        userId: resolvedUserId,
        sessionId: resolvedSessionId,
        text: nextText,
        imageDataUris: [],
      });
      setResolvedSessionId(payload.sessionId ?? resolvedSessionId);
      setSession((current) => ({
        id: payload.sessionId ?? current?.id ?? resolvedSessionId,
        title: current?.title ?? "아기와 나누는 마음",
        messages: [...(current?.messages ?? []).filter((message) => message.id !== draft.id), draft, payload.assistantMessage],
      }));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "메시지를 보내지 못했어요.");
    } finally {
      setIsSending(false);
    }
  }

  const messages = useMemo(() => session?.messages ?? [], [session]);

  return (
    <MobileShell
      title="아기와 대화"
      description={error ?? "아기에게 하고 싶은 이야기를 차분히 남겨보세요."}
      userId={resolvedUserId}
      backHref={resolvedUserId ? `/today?userId=${encodeURIComponent(resolvedUserId)}` : "/today"}
      showChatFab={false}
      pageTone="plain"
    >
      <div className="grid gap-4">
        <section className="rounded-[28px] border border-[var(--line)] bg-[var(--panel-strong)] p-6 shadow-[var(--shadow)]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--panel-muted)] text-[18px] text-[var(--accent)]">✉</div>
            <h1 className="text-xl font-semibold text-[var(--text)]">아기와 나누는 마음</h1>
          </div>
        </section>

        <section className="rounded-[28px] border border-[var(--line)] bg-[var(--panel-strong)] p-6 shadow-[var(--shadow)]">
          {messages.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 text-center text-[var(--text-soft)]">
              <div className="text-[56px] leading-none">◌</div>
              <p className="text-[15px]">아기에게 하고 싶은 이야기를 나눠보세요</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[88%] rounded-[24px] px-4 py-4 text-sm leading-7 shadow-[var(--shadow)] ${
                    message.role === "user"
                      ? "ml-auto bg-[var(--accent)] text-white"
                      : "bg-[var(--panel-muted)] text-[var(--text)]"
                  }`}
                >
                  <MobileRichMessageParts
                    message={message}
                    userId={resolvedUserId}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <form className="rounded-[28px] border border-[var(--line)] bg-[var(--panel-strong)] p-4 shadow-[var(--shadow)]" onSubmit={handleSend}>
          <div className="flex gap-3">
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="아기에게 하고 싶은 말을 적어보세요..."
              className="min-h-[88px] flex-1 resize-none rounded-[22px] bg-[var(--panel-muted)] px-4 py-4 text-sm text-[var(--text)] outline-none"
            />
            <button
              type="submit"
              disabled={isSending}
              aria-label="메시지 보내기"
              className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[18px] bg-[var(--accent)] text-white disabled:opacity-50"
            >
              <SendIcon />
            </button>
          </div>
        </form>
      </div>
    </MobileShell>
  );
}
