"use client";

import type { ChatMessage } from "@gynecology-chatbot/app-core";
import Link from "next/link";

function renderPart(
  part: ChatMessage["parts"][number],
  userId: string | null,
) {
  if (part.type === "text") {
    return (
      <p key={part.id} className="whitespace-pre-wrap">
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
          className="w-full rounded-[18px] object-cover"
          style={{ maxHeight: 240 }}
        />
        {part.caption ? (
          <p className="text-xs text-[var(--text-soft)]">{part.caption}</p>
        ) : null}
      </div>
    );
  }

  if (part.type === "survey") {
    return (
      <div
        key={part.id}
        className="grid gap-3 rounded-[18px] border border-[var(--line)] bg-white/70 p-4"
      >
        <div className="grid gap-1">
          <p className="font-semibold text-[var(--text)]">{part.title}</p>
          <p className="whitespace-pre-wrap text-sm text-[var(--text-soft)]">
            {part.body}
          </p>
        </div>
        {part.choices.length > 0 ? (
          <div className="grid gap-2">
            {part.choices.map((choice) => (
              <div
                key={choice.id}
                className="rounded-[14px] border border-[var(--line)] px-3 py-2 text-sm text-[var(--text)]"
              >
                {choice.label}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (part.type === "quickReplies") {
    return (
      <div
        key={part.id}
        className="grid gap-3 rounded-[18px] border border-[var(--line)] bg-white/70 p-4"
      >
        {part.title ? (
          <p className="font-semibold text-[var(--text)]">{part.title}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {part.choices.map((choice) => (
            <div
              key={choice.id}
              className="rounded-full border border-[var(--line)] px-3 py-2 text-sm text-[var(--text)]"
            >
              {choice.label}
            </div>
          ))}
        </div>
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
        className="block rounded-[18px] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent-dark)]"
      >
        <strong className="block">{part.title}</strong>
        <span className="mt-1 block text-[var(--text-soft)]">
          {part.description}
        </span>
      </Link>
    );
  }

  if (part.type === "carousel") {
    return (
      <div key={part.id} className="grid gap-2">
        <p className="text-sm font-semibold text-[var(--text)]">{part.title}</p>
        <div className="grid gap-2">
          {part.cards.map((card) => (
            <div
              key={card.id}
              className="rounded-[16px] border border-[var(--line)] bg-white/70 p-4"
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--accent)]">
                {card.eyebrow}
              </p>
              <p className="mt-1 font-semibold text-[var(--text)]">
                {card.title}
              </p>
              <p className="mt-1 text-sm text-[var(--text-soft)]">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

export function MobileRichMessageParts({
  message,
  userId,
}: {
  message: ChatMessage;
  userId: string | null;
}) {
  return (
    <div className="grid gap-3">
      {message.parts.map((part) => renderPart(part, userId))}
    </div>
  );
}
