import { MobileSetPasswordView } from "@/components/mobile/MobileSetPasswordView";

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const { userId } = await searchParams;

  return <MobileSetPasswordView initialUserId={userId ?? null} />;
}
