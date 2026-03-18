// @ts-nocheck
import { Redirect } from "expo-router";
import { useMobileAppSession } from "../src/core/MobileAppSessionProvider";

export default function IndexRoute() {
  const { currentUser } = useMobileAppSession();

  if (!currentUser) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <Redirect
      href={currentUser.hasCompletedOnboarding ? "/home" : "/onboarding"}
    />
  );
}
