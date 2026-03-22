import { MobileLoginView } from "@/components/mobile/MobileLoginView";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const { userId } = await searchParams;

  return <MobileLoginView initialUserId={userId ?? null} />;
}
