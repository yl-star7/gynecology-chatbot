import { redirect } from "next/navigation";

export default async function AdminContentDocumentsRoute() {
  redirect("/admin/content/weeks");
}
