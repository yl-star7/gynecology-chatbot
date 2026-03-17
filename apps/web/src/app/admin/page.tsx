import AdminDashboard from "@/components/AdminDashboard";
import { requireAdminSession } from "@/lib/admin/auth";
import { createAdminServices } from "@/lib/admin/create-admin-services";

export default async function AdminPage() {
  const admin = await requireAdminSession();
  const services = createAdminServices();
  const dashboard = await services.adminDashboardPort.getDashboard();

  return <AdminDashboard dashboard={dashboard} adminDisplayName={admin.displayName} />;
}
