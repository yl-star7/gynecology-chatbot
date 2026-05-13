"use client";

import { useState } from "react";

export function WeekImagePreview({
  src,
  fallbackSrc = null,
  alt,
  emptyLabel = "등록된 이미지가 없어요.",
}: {
  src: string | null;
  fallbackSrc?: string | null;
  alt: string;
  emptyLabel?: string;
}) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const candidates = [src, fallbackSrc].filter(
    (candidate): candidate is string => Boolean(candidate),
  );
  const uniqueCandidates = Array.from(new Set(candidates));
  const currentSrc =
    uniqueCandidates.find((candidate) => !failedSources.includes(candidate)) ??
    null;

  if (!currentSrc) {
    return (
      <div className="grid min-h-56 w-full place-items-center rounded-md border bg-muted p-4 text-center text-sm text-muted-foreground">
        {uniqueCandidates.length > 0
          ? "이미지를 불러오지 못했어요."
          : emptyLabel}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="block min-h-56 w-full rounded-md border object-cover"
      src={currentSrc}
      alt={alt}
      onError={() =>
        setFailedSources((current) =>
          current.includes(currentSrc) ? current : [...current, currentSrc],
        )
      }
    />
  );
}
