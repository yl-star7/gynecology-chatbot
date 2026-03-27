import { MobileProfileView } from "@/components/mobile/MobileProfileView";

export default async function ProfileSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const { userId } = await searchParams;
  return <MobileProfileView userId={userId ?? null} mode="settings" />;
}
