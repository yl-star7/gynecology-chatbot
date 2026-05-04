"use client";

import type { ChatMessage, ChatSession, RecentChatSummary, TodayViewData } from "@gynecology-chatbot/app-core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createSessionId, fetchSession, fetchSessions, fetchTodayView, sendChatMessage } from "@/lib/mobile/web-mobile-api";
import { MobileRichMessageParts } from "./MobileRichMessageParts";
import { MobileShell } from "./MobileShell";
import {
  resolvePendingQuickReplyQuestionIdForSend,
  resolveQuickReplyComposerText,
} from "./mobile-chat-quick-replies";
import { buildWebPatientTodayViewModel } from "./mobile-patient-view-models";
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

export function MobileTodayView({
  userId,
}: {
  userId: string | null;
}) {
  const resolvedUserId = useMobileSessionGuard(userId);
  const [today, setToday] = useState<TodayViewData | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentChatSummary[]>([]);
  const [activeSection, setActiveSection] = useState("info");
  const [resolvedSessionId, setResolvedSessionId] = useState(() => createSessionId());
  const [session, setSession] = useState<ChatSession | null>(null);
  const [text, setText] = useState("");
  const [pendingQuickReplyChoice, setPendingQuickReplyChoice] = useState<{
    id: string;
    text: string;
  } | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!resolvedUserId) {
      return;
    }

    Promise.all([fetchTodayView(resolvedUserId), fetchSessions(resolvedUserId)])
      .then(([todayPayload, sessionListPayload]) => {
        setToday(todayPayload.today);
        setRecentSessions(sessionListPayload.sessions);
      })
      .catch((nextError) => {
        setError(nextError instanceof Error ? nextError.message : "오늘 흐름을 불러오지 못했어요.");
      });
  }, [resolvedUserId]);

  useEffect(() => {
    if (recentSessions[0]?.id) {
      setResolvedSessionId(recentSessions[0].id);
    }
  }, [recentSessions]);

  useEffect(() => {
    if (!resolvedUserId) {
      return;
    }

    const shouldLoadExisting = recentSessions.some((item) => item.id === resolvedSessionId);
    if (!shouldLoadExisting) {
      setSession({ id: resolvedSessionId, title: "아기와 대화", messages: [] });
      return;
    }

    fetchSession(resolvedUserId, resolvedSessionId)
      .then((payload) => setSession(payload.session))
      .catch((nextError) => {
        setError(nextError instanceof Error ? nextError.message : "대화를 불러오지 못했어요.");
      });
  }, [recentSessions, resolvedSessionId, resolvedUserId]);

  const viewModel = buildWebPatientTodayViewModel({
    today,
  });
  const messages = useMemo(() => session?.messages ?? [], [session]);

  const sendMessage = useCallback(async (messageText: string, selectedQuestionId?: string) => {
    if (!resolvedUserId || !messageText || isSending) {
      return;
    }

    const draft = createDraftMessage(messageText);
    setSession((current) => ({
      id: current?.id ?? resolvedSessionId,
      title: current?.title ?? "아기와 대화",
      messages: [...(current?.messages ?? []), draft],
    }));
    setText("");
    setIsSending(true);

    try {
      const payload = await sendChatMessage({
        userId: resolvedUserId,
        sessionId: resolvedSessionId,
        text: messageText,
        ...(selectedQuestionId ? { selectedQuestionId } : {}),
        imageDataUris: [],
      });
      setResolvedSessionId(payload.sessionId ?? resolvedSessionId);
      setSession((current) => ({
        id: payload.sessionId ?? current?.id ?? resolvedSessionId,
        title: current?.title ?? "아기와 대화",
        messages: [
          ...(current?.messages ?? []).filter((message) => message.id !== draft.id),
          draft,
          ...(payload.assistantMessages ?? [payload.assistantMessage]),
        ],
      }));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "메시지를 보내지 못했어요.");
    } finally {
      setIsSending(false);
    }
  }, [resolvedUserId, resolvedSessionId, isSending]);

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextText = text.trim();
    await sendMessage(
      nextText,
      resolvePendingQuickReplyQuestionIdForSend({
        currentText: nextText,
        pendingChoiceId: pendingQuickReplyChoice?.id ?? null,
        pendingChoiceText: pendingQuickReplyChoice?.text ?? null,
      }),
    );
    setPendingQuickReplyChoice(null);
  }

  const handleQuickReply = useCallback(
    (message: string, choiceId?: string, label?: string) => {
      if (isSending) {
        return;
      }
      const nextText = resolveQuickReplyComposerText({
        choiceId,
        label: label ?? message,
        message,
      });
      setPendingQuickReplyChoice(
        choiceId ? { id: choiceId, text: nextText } : null,
      );
      setText(nextText);
    },
    [isSending],
  );

  return (
    <MobileShell
      title="오늘,우리"
      description={error ?? "오늘 아기와 엄마의 흐름을 한 화면에서 이어가요."}
      userId={resolvedUserId}
      showChatFab={false}
      pageTone="plain"
    >
      <div className="grid gap-4">
        <div className="flex gap-2 rounded-[28px] bg-[#f3f3f5] p-1">
          {viewModel.sections.map((section) => {
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-3 text-sm font-semibold ${
                  activeSection === section.id
                    ? "bg-[var(--accent-soft)] text-[var(--accent-dark)]"
                    : "bg-[var(--panel-strong)] text-[var(--text-soft)]"
                }`}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-full ${
                  activeSection === section.id ? "bg-white text-[var(--accent-dark)]" : "bg-[var(--panel-muted)] text-[var(--text-soft)]"
                }`}>
                {section.id === "info" ? "☺" : section.id === "checklist" ? "✓" : "◌"}
              </span>
              {section.label}
            </button>
          );
        })}
        </div>

        {activeSection === "info" ? (
          <section className="rounded-[28px] border border-[var(--line)] bg-[var(--panel-strong)] p-6 shadow-[var(--shadow)]">
            <div className="grid gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f7e9ef] text-[18px] text-[var(--accent)]">✦</div>
                <h2 className="text-xl font-semibold text-[var(--text)]">오늘 아기는요</h2>
              </div>
              <div className="mt-4 rounded-[20px] bg-[#fbf1f7] px-4 py-4">
                <p className="text-sm leading-7 text-[var(--text-soft)]">{viewModel.babyText}</p>
              </div>

              <div className="h-px bg-[var(--line)]" />

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4eef8] text-[18px] text-[var(--accent)]">♡</div>
                <h2 className="text-xl font-semibold text-[var(--text)]">오늘 엄마는요</h2>
              </div>
              <div className="rounded-[20px] bg-[#f5f0fb] px-4 py-4">
                <p className="text-sm leading-7 text-[var(--text-soft)]">{viewModel.momText}</p>
              </div>
            </div>
          </section>
        ) : null}

        {activeSection === "checklist" ? (
          <section className="rounded-[28px] border border-[var(--line)] bg-[var(--panel-strong)] p-6 shadow-[var(--shadow)]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef5ef] text-[18px] text-[var(--success)]">✓</div>
              <h2 className="text-xl font-semibold text-[var(--text)]">오늘의 체크리스트</h2>
            </div>
            <div className="mt-6 grid gap-8">
              {viewModel.checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div
                    className={`h-6 w-6 rounded-[7px] border ${
                      item.completed
                        ? "border-[var(--success)] bg-[#dff3e4]"
                        : "border-[#d6d8de] bg-[#f3f3f5]"
                    }`}
                  />
                  <p className="text-[16px] font-semibold text-[#30313a]">{item.label}</p>
                </div>
              ))}
              {viewModel.checklist.length === 0 ? (
                <p className="text-sm text-[var(--text-soft)]">오늘 체크리스트를 준비 중이에요.</p>
              ) : null}
            </div>
            <div className="mt-10 border-t border-[var(--line)] pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[var(--text-soft)]">완료율</p>
                <p className="text-sm font-semibold text-[var(--success)]">{viewModel.completionRate}%</p>
              </div>
              <div className="mt-4 h-[10px] rounded-full bg-[#ececf0]">
                <div
                  className="h-full rounded-full bg-[var(--success)]"
                  style={{ width: `${viewModel.completionRate}%` }}
                />
              </div>
            </div>
          </section>
        ) : null}

        {activeSection === "conversation" ? (
          <section className="rounded-[28px] border border-[var(--line)] bg-[var(--panel-strong)] p-6 shadow-[var(--shadow)]">
            <div className="grid gap-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4efff] text-[18px] text-[#8a3ffc]">◌</div>
                <h2 className="text-xl font-semibold text-[var(--text)]">아기와 대화</h2>
              </div>
              {messages.length === 0 ? (
                <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 text-center text-[var(--text-soft)]">
                  <div className="text-[48px] leading-none text-[#d5d9e3]">◌</div>
                  <p className="text-[15px]">아기에게 하고 싶은 이야기를 나눠보세요</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-[88%] rounded-[24px] px-4 py-4 text-sm leading-7 shadow-[var(--shadow)] ${
                        message.role === "user"
                          ? "ml-auto bg-[#c084fc] text-white"
                          : "bg-[var(--panel-muted)] text-[var(--text)]"
                      }`}
                    >
                      <MobileRichMessageParts
                        message={message}
                        userId={resolvedUserId}
                        onQuickReply={handleQuickReply}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="h-px bg-[var(--line)]" />

              <form onSubmit={handleSend}>
              <div className="flex gap-3">
                <textarea
                  value={text}
                  onChange={(event) => {
                    setPendingQuickReplyChoice(null);
                    setText(event.target.value);
                  }}
                  placeholder="아기에게 하고 싶은 말을 적어보세요..."
                  className="min-h-[56px] flex-1 resize-none rounded-[22px] bg-[var(--panel-muted)] px-4 py-4 text-sm text-[var(--text)] outline-none"
                />
                <button
                  type="submit"
                  disabled={isSending}
                  aria-label="메시지 보내기"
                  className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[18px] bg-[#c084fc] text-white disabled:opacity-50"
                >
                  <SendIcon />
                </button>
              </div>
              </form>
            </div>
          </section>
        ) : null}
      </div>
    </MobileShell>
  );
}
