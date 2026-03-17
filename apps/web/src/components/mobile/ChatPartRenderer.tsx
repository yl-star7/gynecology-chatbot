"use client";

import type { ChatPart } from "@gynecology-chatbot/app-core";
import Link from "next/link";
import { appendUserIdToPath } from "@/lib/mobile/web-mobile-api";

export function ChatPartRenderer({ part, userId }: { part: ChatPart; userId?: string | null }) {
  if (part.type === "text") {
    return <p className="whitespace-pre-wrap text-[15px] leading-6 text-[#142214]">{part.text}</p>;
  }

  if (part.type === "image") {
    return (
      <figure className="grid gap-2">
        <img alt={part.alt} className="h-52 w-full rounded-[20px] object-cover" src={part.imageUrl} />
        {part.caption ? <figcaption className="text-xs text-[#546355]">{part.caption}</figcaption> : null}
      </figure>
    );
  }

  if (part.type === "deepLink") {
    return (
      <Link
        href={appendUserIdToPath(`/link/${part.target}${part.entityId ? `?entityId=${encodeURIComponent(part.entityId)}` : ""}`, userId)}
        className="block rounded-[20px] bg-[#eef6f3] p-4"
      >
        <p className="text-sm font-semibold text-[#b24f3c]">{part.title}</p>
        <p className="mt-2 text-sm leading-6 text-[#546355]">{part.description}</p>
      </Link>
    );
  }

  if (part.type === "carousel") {
    return (
      <div className="grid gap-3">
        <p className="text-sm font-semibold text-[#142214]">{part.title}</p>
        <div className="grid gap-3">
          {part.cards.map((card) => (
            <article key={card.id} className="rounded-[20px] border border-black/5 bg-white/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#546355]">{card.eyebrow}</p>
              <h3 className="mt-2 text-base font-semibold text-[#142214]">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#546355]">{card.description}</p>
            </article>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] border border-[#d76c57]/20 bg-[#fff4f1] p-4">
      <p className="text-sm font-semibold text-[#142214]">{part.title}</p>
      <p className="mt-2 text-sm leading-6 text-[#546355]">{part.body}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {part.choices.map((choice) => (
          <span key={choice.id} className="rounded-full bg-white px-3 py-1 text-sm text-[#8c4738]">
            {choice.label}
          </span>
        ))}
      </div>
    </div>
  );
}
