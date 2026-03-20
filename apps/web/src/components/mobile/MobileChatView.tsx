"use client";

import type {
  ChatMessage,
  RecentChatSummary,
} from "@gynecology-chatbot/app-core";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createSessionId,
  fetchSession,
  fetchSessions,
  fileToDataUrl,
  sendChatMessage,
} from "@/lib/mobile/web-mobile-api";
import { readStoredMobileProfile } from "@/lib/mobile/mobile-session";
import { MobileChatComposer } from "./MobileChatComposer";
import { MobileChatMenu } from "./MobileChatMenu";
import { groupChatSessionsByDate } from "./mobile-chat-session-groups";
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
    createdAtLabel: "전송 중",
    parts,
  };
}

function renderMessagePart(
  part: ChatMessage["parts"][number],
  userId: string | null,
) {
  if (part.type === "text") {
    return (
      <p
        key={part.id}
        className="whitespace-pre-wrap text-[15px] leading-7 text-[var(--text)]"
      >
        {part.text}
      </p>
    );
  }

  if (part.type === "image") {
    return (
      <div key={part.id} className="grid gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={part.imageUrl}
          alt={part.alt}
          className="h-52 w-full rounded-[20px] object-cover"
        />
        {part.caption ? (
          <p className="text-xs text-[var(--text-soft)]">{part.caption}</p>
        ) : null}
      </div>
    );
  }

  if (part.type === "deepLink") {
    const href = `/link/${part.target}?${new URLSearchParams({
      ...(userId ? { userId } : {}),
      ...(part.entityId ? { entityId: part.entityId } : {}),
    }).toString()}`;

    return (
      <Link
        key={part.id}
        href={href}
        className="rounded-[18px] bg-[var(--accent-soft)] p-4"
      >
        <p className="font-medium text-[var(--accent-dark)]">{part.title}</p>
        <p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">
          {part.description}
        </p>
      </Link>
    );
  }

  if (part.type === "carousel") {
    return (
      <div key={part.id} className="grid gap-3">
        <p className="font-medium text-[var(--text)]">{part.title}</p>
        <div className="grid gap-3">
          {part.cards.map((card) => (
            <div
              key={card.id}
              className="rounded-[18px] border border-[var(--line)] bg-[var(--panel-muted)] p-4"
            >
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-soft)]">
                {card.eyebrow}
              </p>
              <p className="mt-2 font-medium text-[var(--text)]">
                {card.title}
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      key={part.id}
      className="rounded-[18px] border border-[var(--line)] bg-[var(--panel-muted)] p-4"
    >
      <p className="font-medium text-[var(--text)]">{part.title}</p>
      <p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">
        {part.body}
      </p>
    </div>
  );
}

export function MobileChatView({
  userId,
  initialSessionId,
}: {
  userId: string | null;
  initialSessionId: string;
}) {
  const resolvedUserId = useMobileSessionGuard(userId);
  const [resolvedSessionId] = useState(() =>
    initialSessionId === "new" ? createSessionId() : initialSessionId,
  );
  const [sessionTitle, setSessionTitle] = useState("새 채팅");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [recentSessions, setRecentSessions] = useState<RecentChatSummary[]>([]);
  const [text, setText] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const storedProfile = useMemo(() => readStoredMobileProfile(), []);
  const displaySessionTitle =
    sessionTitle === "새 채팅" ? "새 상담" : sessionTitle;
  const sessionMetaLabel = storedProfile?.pregnancyWeekLabel ?? "증상 상담";

  useEffect(() => {
    window.PhedyNative?.setTitle?.(displaySessionTitle);
  }, [displaySessionTitle]);

  useEffect(() => {
    if (!resolvedUserId) {
      return;
    }

    let cancelled = false;

    fetchSessions(resolvedUserId)
      .then((payload) => {
        if (!cancelled) {
          setRecentSessions(payload.sessions.slice(0, 12));
        }
      })
      .catch((nextError) => {
        if (!cancelled) {
          setError(
            nextError instanceof Error
              ? nextError.message
              : "이전 상담을 불러오지 못했어요.",
          );
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
          setError(
            nextError instanceof Error
              ? nextError.message
              : "상담 내용을 불러오지 못했어요.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialSessionId, resolvedSessionId, resolvedUserId]);

  const homeHref = useMemo(
    () =>
      resolvedUserId ? `/?userId=${encodeURIComponent(resolvedUserId)}` : "/",
    [resolvedUserId],
  );
  const sessionGroups = useMemo(
    () => groupChatSessionsByDate(recentSessions),
    [recentSessions],
  );
  const showQuickPrompts =
    messages.length === 0 && !text.trim() && !imageDataUrl && !isSending;

  useEffect(() => {
    bottomAnchorRef.current?.scrollIntoView({
      behavior: messages.length > 1 ? "smooth" : "auto",
      block: "end",
    });
  }, [messages, isSending]);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) {
        setImageDataUrl(null);
        return;
      }

      setImageDataUrl(await fileToDataUrl(file));
    },
    [],
  );

  const handleSend = useCallback(async () => {
    if (!resolvedUserId) {
      return;
    }

    if (!text.trim() && !imageDataUrl) {
      return;
    }

    const draftMessage = createDraftMessage(text, imageDataUrl ?? undefined);
    const draftMessageId = draftMessage.id;
    setMessages((current) => [...current, draftMessage]);
    setSessionTitle((current) =>
      current === "새 채팅" && text.trim() ? text.trim().slice(0, 24) : current,
    );
    setIsSending(true);
    setError(null);

    try {
      const payload = await sendChatMessage({
        userId: resolvedUserId,
        sessionId: resolvedSessionId,
        text,
        imageDataUris: imageDataUrl ? [imageDataUrl] : [],
      });

      setMessages((current) =>
        current.map((message) =>
          message.id === draftMessageId
            ? { ...message, createdAtLabel: "방금 전" }
            : message,
        ),
      );
      setMessages((current) => [...current, payload.assistantMessage]);
      setText("");
      setImageDataUrl(null);
      const nextSessions = await fetchSessions(resolvedUserId);
      setRecentSessions(nextSessions.sessions.slice(0, 12));
    } catch (nextError) {
      setMessages((current) =>
        current.map((message) =>
          message.id === draftMessageId
            ? { ...message, createdAtLabel: "전송 실패" }
            : message,
        ),
      );
      setError(
        nextError instanceof Error
          ? nextError.message
          : "메시지를 보내지 못했어요.",
      );
    } finally {
      setIsSending(false);
    }
  }, [imageDataUrl, resolvedSessionId, resolvedUserId, text]);

  const handlePromptSelect = useCallback((prompt: string) => {
    setText((current) => (current.trim() ? `${current}\n${prompt}` : prompt));
    composerRef.current?.focus();
  }, []);

  return (
    <>
      <MobileChatMenu
        currentSessionId={resolvedSessionId}
        groups={sessionGroups}
        homeHref={homeHref}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        userId={resolvedUserId}
      />
      <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-3 pb-4 pt-3 sm:px-4">
        <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--bg)] px-1 pb-3">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              aria-label="채팅 메뉴 열기"
              onClick={() => setIsMenuOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--panel-strong)]"
            >
              <span className="grid gap-[4px]">
                <span className="block h-[1.5px] w-4 rounded-full bg-[var(--text)]" />
                <span className="block h-[1.5px] w-4 rounded-full bg-[var(--text)]" />
                <span className="block h-[1.5px] w-4 rounded-full bg-[var(--text)]" />
              </span>
            </button>
            <div className="min-w-0 text-center">
              <p className="text-xs font-medium text-[var(--text-soft)]">
                {sessionMetaLabel}
              </p>
              <h1 className="truncate text-base font-semibold text-[var(--text)]">
                {displaySessionTitle}
              </h1>
            </div>
            <div className="h-11 w-11" aria-hidden />
          </div>
        </header>

        <section className="flex-1 pb-6 pt-4">
          <div className="grid min-h-full gap-3 pb-24">
            {messages.length > 0
              ? messages.map((message) => (
                  <article
                    key={message.id}
                    className={`max-w-[88%] rounded-[26px] p-4 ${
                      message.role === "user"
                        ? "ml-auto bg-[var(--accent-soft)]"
                        : "border border-[var(--line)] bg-[var(--panel-strong)]"
                    }`}
                  >
                    <div className="grid gap-3">
                      {message.parts.map((part) =>
                        renderMessagePart(part, resolvedUserId),
                      )}
                    </div>
                    <p className="mt-3 text-right text-xs text-[var(--text-soft)]">
                      {message.createdAtLabel}
                    </p>
                  </article>
                ))
              : null}
            <div ref={bottomAnchorRef} />
          </div>
        </section>

        <MobileChatComposer
          error={error}
          imageDataUrl={imageDataUrl}
          isSending={isSending}
          onFileChange={handleFileChange}
          onPromptSelect={handlePromptSelect}
          onSend={handleSend}
          onTextChange={setText}
          showQuickPrompts={showQuickPrompts}
          textareaRef={composerRef}
          text={text}
        />
      </main>
    </>
  );
}
