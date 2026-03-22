import { MobileOnboardingView } from "@/components/mobile/MobileOnboardingView";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const { userId } = await searchParams;

  return <MobileOnboardingView userId={userId ?? null} />;
}
