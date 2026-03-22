"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold text-neutral-900">
        화면을 불러오지 못했어요.
      </h1>
      <p className="text-sm text-neutral-600">
        잠시 후 다시 시도해 주세요.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-neutral-900 px-5 py-3 text-sm font-medium text-white"
      >
        다시 시도
      </button>
    </main>
  );
}
