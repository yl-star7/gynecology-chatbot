import { MobileProfileView } from "@/components/mobile/MobileProfileView";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const { userId } = await searchParams;
  return <MobileProfileView userId={userId ?? null} />;
}
