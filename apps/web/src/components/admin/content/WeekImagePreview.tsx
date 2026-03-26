"use client";

import { useState } from "react";

import styles from "../AdminConsoleLayout.module.css";

export function WeekImagePreview({ src, alt }: { src: string | null; alt: string }) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className={styles.imagePlaceholder}>이미지를 불러오지 못했어요.</div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={styles.imagePreview}
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
    />
  );
}
