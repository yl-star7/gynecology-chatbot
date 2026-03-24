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
      title="오늘 내용"
      userId={userId ?? null}
    />
  );
}
