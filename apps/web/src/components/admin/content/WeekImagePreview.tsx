"use client";

import { useState } from "react";

export function WeekImagePreview({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="grid min-h-56 w-full place-items-center rounded-md border bg-muted p-4 text-center text-sm text-muted-foreground">
        이미지를 불러오지 못했어요.
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="block min-h-56 w-full rounded-md border object-cover"
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
    />
  );
}
