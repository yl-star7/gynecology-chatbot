import { MobileTodayView } from "@/components/mobile/MobileTodayView";

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const { userId } = await searchParams;
  return <MobileTodayView userId={userId ?? null} />;
}
