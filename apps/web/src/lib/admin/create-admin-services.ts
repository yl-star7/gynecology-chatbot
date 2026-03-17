import type { AdminDashboardPort, AdminUserPort } from "@gynecology-chatbot/app-core";

import { MockAdminDashboardPortAdapter } from "./adapters/mock-admin-dashboard-port";
import { MockAdminUserPortAdapter } from "./adapters/mock-admin-user-port";
import { SupabaseAdminDashboardPortAdapter, SupabaseAdminUserPortAdapter } from "./adapters/supabase-admin-dashboard-port";

export interface AdminServices {
  adminDashboardPort: AdminDashboardPort;
  adminUserPort: AdminUserPort;
}

export interface CreateAdminServicesOptions {
  adminDashboardPort?: AdminDashboardPort;
  adminUserPort?: AdminUserPort;
  provider?: "mock" | "backend";
}

export function createAdminServices(options: CreateAdminServicesOptions = {}): AdminServices {
  const provider = options.provider ?? (process.env.ADMIN_DATA_PROVIDER === "backend" ? "backend" : "mock");

  if (provider === "backend") {
    return {
      adminDashboardPort: options.adminDashboardPort ?? new SupabaseAdminDashboardPortAdapter(),
      adminUserPort: options.adminUserPort ?? new SupabaseAdminUserPortAdapter(),
    };
  }

  return {
    adminDashboardPort: options.adminDashboardPort ?? new MockAdminDashboardPortAdapter(),
    adminUserPort: options.adminUserPort ?? new MockAdminUserPortAdapter(),
  };
}
