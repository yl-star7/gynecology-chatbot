import { redirect } from "next/navigation";

export default async function AdminContentIndexPage() {
  redirect("/admin/content/documents");
}
