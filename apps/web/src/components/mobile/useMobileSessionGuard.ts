"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import {
  clearMobileSession,
  hasCompletedMobileOnboarding,
  readStoredMobileSessionToken,
  readStoredMobileUserId,
  setMobileOnboardingStatus,
  storeMobileProfile,
  storeMobileUserId,
} from "@/lib/mobile/mobile-session";
import {
  appendUserIdToPath,
  fetchCurrentMobileSession,
  resolveMobileUserId,
} from "@/lib/mobile/web-mobile-api";

export function useMobileSessionGuard(inputUserId?: string | null) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const resolvedUserId = useMemo(() => resolveMobileUserId(inputUserId), [inputUserId]);

  useEffect(() => {
    const storedUserId = readStoredMobileUserId();
    const storedSessionToken = readStoredMobileSessionToken();

    if (!storedSessionToken) {
      if (storedUserId) {
        clearMobileSession();
      }

      router.replace("/auth/login");
      return;
    }

    let cancelled = false;

    void fetchCurrentMobileSession()
      .then((payload) => {
        if (cancelled) {
          return;
        }

        storeMobileUserId(payload.user.id);
        storeMobileProfile({
          userId: payload.user.id,
          displayName: payload.user.displayName,
          phoneNumber: payload.user.phoneNumber,
        });
        setMobileOnboardingStatus(payload.user.hasCompletedOnboarding);

        if (resolvedUserId === payload.user.id) {
          return;
        }

        const nextSearchParams = new URLSearchParams(
          searchParams ? searchParams.toString() : "",
        );
        nextSearchParams.set("userId", payload.user.id);
        const nextPath = `${pathname}?${nextSearchParams.toString()}`;
        router.replace(nextPath);
      })
      .catch(() => {
        if (!cancelled) {
          clearMobileSession();
          router.replace("/auth/login");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, resolvedUserId, router, searchParams]);

  return resolvedUserId;
}
