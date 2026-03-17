import { MobileContentView } from "@/components/mobile/MobileContentView";

export default async function NotebookPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const { userId } = await searchParams;

  return <MobileContentView target="notebook" title="임신수첩" userId={userId ?? null} />;
}
