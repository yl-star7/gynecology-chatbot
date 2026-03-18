import { MobileContentIndexView } from "@/components/mobile/MobileContentIndexView";

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const { userId } = await searchParams;

  return (
    <MobileContentIndexView
      section="knowledge"
      title="임신 지식"
      userId={userId ?? null}
    />
  );
}
