"use client";

declare global {
  interface Window {
    PhedyNative?: {
      available?: boolean;
      openExternal?: (url: string) => boolean;
      openNative?: (path: string) => boolean;
      reload?: () => boolean;
      setTitle?: (title: string) => boolean;
    };
  }
}

export function setNativeTitle(title: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.PhedyNative?.setTitle?.(title);
}

export function openNativePath(path: string) {
  if (typeof window === "undefined") {
    return false;
  }

  return window.PhedyNative?.openNative?.(path) ?? false;
}
