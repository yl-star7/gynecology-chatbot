import { MobileContentView } from "@/components/mobile/MobileContentView";

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const { userId } = await searchParams;

  return <MobileContentView target="knowledge" title="임신 지식" userId={userId ?? null} />;
}
