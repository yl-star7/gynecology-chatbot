import { MobileContentIndexView } from "@/components/mobile/MobileContentIndexView";

export default async function NotebookPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const { userId } = await searchParams;

  return (
    <MobileContentIndexView
      section="notebook"
      title="기록과 회고"
      userId={userId ?? null}
    />
  );
}
