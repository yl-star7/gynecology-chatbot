"use client";

import { ArrowUp, LoaderCircle, Paperclip } from "lucide-react";
import type { Ref } from "react";

const QUICK_PROMPTS = [
  "하복부 통증",
  "출혈",
  "분비물",
  "태동 감소",
  "약 복용",
  "검사 결과",
] as const;

export function MobileChatComposer({
  error,
  imageDataUrl,
  isSending,
  onFileChange,
  onPromptSelect,
  onSend,
  onTextChange,
  showQuickPrompts,
  textareaRef,
  text,
}: {
  error: string | null;
  imageDataUrl: string | null;
  isSending: boolean;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPromptSelect: (prompt: string) => void;
  onSend: () => void;
  onTextChange: (value: string) => void;
  showQuickPrompts: boolean;
  textareaRef?: Ref<HTMLTextAreaElement>;
  text: string;
}) {
  return (
    <section className="sticky bottom-0 z-20 mt-3 border-t border-[var(--line)] bg-[var(--bg)] px-1 pb-3 pt-3">
      <div className="grid gap-3">
        {showQuickPrompts ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => onPromptSelect(prompt)}
                className="shrink-0 rounded-full border border-[var(--line)] bg-[var(--panel-strong)] px-4 py-2 text-sm font-medium text-[var(--text)]"
              >
                {prompt}
              </button>
            ))}
          </div>
        ) : null}

        {imageDataUrl ? (
          <div className="rounded-[20px] border border-[var(--line)] bg-[var(--panel)] p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageDataUrl}
              alt="첨부 미리보기"
              className="h-32 w-full rounded-[16px] object-cover"
            />
          </div>
        ) : null}

        <div className="flex items-end gap-2">
          <label
            aria-label="이미지 첨부"
            className="shrink-0 rounded-full border border-[var(--line)] bg-[var(--panel-strong)] p-3 text-[var(--text)]"
          >
            <Paperclip className="h-5 w-5" strokeWidth={1.9} />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileChange}
            />
          </label>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(event) => onTextChange(event.target.value)}
            placeholder="증상이나 검사 결과를 입력하세요."
            className="min-h-[56px] flex-1 rounded-[24px] border border-[var(--line)] bg-[var(--panel-strong)] px-4 py-3 text-[15px] text-[var(--text)] outline-none"
          />
          <button
            type="button"
            onClick={onSend}
            aria-label="메시지 보내기"
            disabled={isSending || (!text.trim() && !imageDataUrl)}
            className="shrink-0 rounded-full bg-[var(--accent)] p-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSending ? (
              <LoaderCircle
                className="h-5 w-5 animate-spin"
                strokeWidth={1.9}
              />
            ) : (
              <ArrowUp className="h-5 w-5" strokeWidth={2.1} />
            )}
          </button>
        </div>

        <p className="px-1 text-xs leading-5 text-[var(--text-soft)]">
          {error ??
            "응급 신호가 있거나 통증이 심하면 채팅보다 먼저 의료진 진료를 우선하세요."}
        </p>
      </div>
    </section>
  );
}
