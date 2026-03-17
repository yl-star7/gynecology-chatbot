import { MobileRecordDayView } from "@/components/mobile/MobileRecordDayView";

export default async function RecordDayPage({
  params,
  searchParams,
}: {
  params: Promise<{ isoDate: string }>;
  searchParams: Promise<{ userId?: string }>;
}) {
  const [{ isoDate }, { userId }] = await Promise.all([params, searchParams]);
  return <MobileRecordDayView isoDate={isoDate} userId={userId ?? null} />;
}
