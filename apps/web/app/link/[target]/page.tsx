import { MobileContentView } from "@/components/mobile/MobileContentView";

export default async function LinkPage({
  params,
  searchParams,
}: {
  params: Promise<{ target: string }>;
  searchParams: Promise<{ userId?: string; entityId?: string }>;
}) {
  const [{ target }, { userId, entityId }] = await Promise.all([params, searchParams]);

  return <MobileContentView entityId={entityId} target={target} title="내부 문서" userId={userId ?? null} />;
}
