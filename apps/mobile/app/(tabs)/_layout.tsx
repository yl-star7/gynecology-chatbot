// @ts-nocheck
import { Slot, useRouter } from "expo-router";
import { useEffect } from "react";
import { useMobileAppSession } from "../../src/core/MobileAppSessionProvider";

export default function TabsLayout() {
  const { currentUser } = useMobileAppSession();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.replace("/auth/login");
    } else if (!currentUser.hasCompletedOnboarding) {
      router.replace("/onboarding");
    }
  }, [currentUser, router]);

  if (!currentUser) return null;

  return <Slot />;
}
