"use client";

import type { ChatPart } from "@gynecology-chatbot/app-core";
import Link from "next/link";
import { appendUserIdToPath } from "@/lib/mobile/web-mobile-api";

export function ChatPartRenderer({ part, userId }: { part: ChatPart; userId?: string | null }) {
  if (part.type === "text") {
    return (
      <p className="whitespace-pre-wrap text-[15px] leading-6 text-[var(--text)]">
        {part.text}
      </p>
    );
  }

  if (part.type === "image") {
    return (
      <figure className="grid gap-2">
        <img
          alt={part.alt}
          className="h-52 w-full rounded-[20px] object-cover"
          src={part.imageUrl}
        />
        {part.caption ? (
          <figcaption className="text-xs text-[var(--text-soft)]">
            {part.caption}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  if (part.type === "deepLink") {
    return (
      <Link
        href={appendUserIdToPath(`/link/${part.target}${part.entityId ? `?entityId=${encodeURIComponent(part.entityId)}` : ""}`, userId)}
        className="block rounded-[20px] border border-[var(--line)] bg-[var(--accent-soft)] p-4"
      >
        <p className="text-sm font-semibold text-[var(--accent-dark)]">
          {part.title}
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
          {part.description}
        </p>
      </Link>
    );
  }

  if (part.type === "carousel") {
    return (
      <div className="grid gap-3">
        <p className="text-sm font-semibold text-[var(--text)]">{part.title}</p>
        <div className="grid gap-3">
          {part.cards.map((card) => (
            <article
              key={card.id}
              className="rounded-[20px] border border-[var(--line)] bg-[var(--panel)] p-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">
                {card.eyebrow}
              </p>
              <h3 className="mt-2 text-base font-semibold text-[var(--text)]">
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                {card.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] border border-[var(--line)] bg-[var(--accent-soft)] p-4">
      <p className="text-sm font-semibold text-[var(--text)]">{part.title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
        {part.body}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {part.choices.map((choice) => (
          <span
            key={choice.id}
            className="rounded-full bg-[var(--panel-strong)] px-3 py-1 text-sm text-[var(--accent-dark)]"
          >
            {choice.label}
          </span>
        ))}
      </div>
    </div>
  );
}
