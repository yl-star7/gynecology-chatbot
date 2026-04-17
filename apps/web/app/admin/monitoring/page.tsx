import AdminMonitoringPage from "@/components/AdminMonitoringPage";
import { requireAdminSession } from "@/lib/admin/auth";
import { createAdminServices } from "@/lib/admin/create-admin-services";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AdminMonitoringRoute() {
  const admin = await requireAdminSession();
  const services = createAdminServices();
  const dashboard = await services.adminDashboardPort.getDashboard();

  return (
    <AdminMonitoringPage
      adminDisplayName={admin.displayName}
      dashboard={dashboard}
    />
  );
}
