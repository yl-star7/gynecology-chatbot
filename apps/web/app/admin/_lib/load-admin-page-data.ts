import { requireAdminSession } from "@/lib/admin/auth";
import { createAdminServices } from "@/lib/admin/create-admin-services";

export async function loadAdminPageData() {
  const admin = await requireAdminSession();
  const services = createAdminServices();
  const dashboard = await services.adminDashboardPort.getDashboard();

  return {
    admin,
    dashboard,
  };
}
