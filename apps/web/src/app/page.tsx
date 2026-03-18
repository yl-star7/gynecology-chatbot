import { MobileHomeView } from "@/components/mobile/MobileHomeView";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const { userId } = await searchParams;
  return <MobileHomeView userId={userId ?? null} />;
}
