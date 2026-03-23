import { redirect } from "next/navigation";

export default async function AdminContentStaticRoute() {
  redirect("/admin/content/weeks");
}
