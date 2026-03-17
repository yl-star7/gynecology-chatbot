"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { hasCompletedMobileOnboarding, readStoredMobileUserId } from "@/lib/mobile/mobile-session";
import { appendUserIdToPath, resolveMobileUserId } from "@/lib/mobile/web-mobile-api";

export function useMobileSessionGuard(inputUserId?: string | null) {
  const router = useRouter();
  const resolvedUserId = useMemo(() => resolveMobileUserId(inputUserId), [inputUserId]);

  useEffect(() => {
    if (resolvedUserId) {
      return;
    }

    const storedUserId = readStoredMobileUserId();
    if (storedUserId) {
      router.replace(
        appendUserIdToPath(
          hasCompletedMobileOnboarding() ? "/" : "/onboarding",
          storedUserId,
        ),
      );
      return;
    }

    router.replace("/auth/login");
  }, [resolvedUserId, router]);

  return resolvedUserId;
}
