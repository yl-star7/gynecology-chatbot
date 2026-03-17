import { MobileHomeView } from "@/components/mobile/MobileHomeView";
import { MobileLoginView } from "@/components/mobile/MobileLoginView";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const { userId } = await searchParams;

  if (!userId) {
    return <MobileLoginView initialUserId={null} />;
  }

  return <MobileHomeView userId={userId} />;
}
