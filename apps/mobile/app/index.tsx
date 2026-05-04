// @ts-nocheck
import { Redirect } from "expo-router";
import { useMobileAppSession } from "../src/core/MobileAppSessionProvider";

export default function IndexRoute() {
  const { currentUser, isRestoringSession } = useMobileAppSession();

  if (isRestoringSession) {
    return null;
  }

  if (!currentUser) {
    return <Redirect href="/auth/login" />;
  }

  if (currentUser.accountStatus === "pending_approval") {
    return <Redirect href="/approval-pending" />;
  }

  return (
    <Redirect
      href={currentUser.hasCompletedOnboarding ? "/(tabs)/home" : "/onboarding"}
    />
  );
}
