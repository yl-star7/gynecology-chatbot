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
      title="임신수첩"
      userId={userId ?? null}
    />
  );
}
