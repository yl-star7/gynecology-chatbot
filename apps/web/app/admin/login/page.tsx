import AdminLoginView from "@/components/AdminLoginView";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { redirect } from "next/navigation";

export default async function AdminLoginPage() {
  const admin = await readAdminSessionUser();
  if (admin) {
    redirect("/admin");
  }

  return <AdminLoginView />;
}
