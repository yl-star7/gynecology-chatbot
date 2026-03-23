import type {
  AdminContentPort,
  AdminDashboardPort,
  AdminUserPort,
} from "@gynecology-chatbot/app-core";

import { MockAdminContentPortAdapter } from "./adapters/mock-admin-content-port";
import { MockAdminDashboardPortAdapter } from "./adapters/mock-admin-dashboard-port";
import { MockAdminUserPortAdapter } from "./adapters/mock-admin-user-port";
import { SupabaseAdminContentPortAdapter } from "./adapters/supabase-admin-content-port";
import {
  SupabaseAdminDashboardPortAdapter,
  SupabaseAdminUserPortAdapter,
} from "./adapters/supabase-admin-dashboard-port";
import {
  hasDockerConfig,
  hasSupabaseConfig,
  resolveServerDataProvider,
} from "../server-data-provider";

export interface AdminServices {
  adminDashboardPort: AdminDashboardPort;
  adminUserPort: AdminUserPort;
  adminContentPort: AdminContentPort;
}

export interface CreateAdminServicesOptions {
  adminDashboardPort?: AdminDashboardPort;
  adminUserPort?: AdminUserPort;
  adminContentPort?: AdminContentPort;
  provider?: "mock" | "backend";
}

function hasBackendAdminConfig() {
  const provider = resolveServerDataProvider();
  return provider === "docker" ? hasDockerConfig() : hasSupabaseConfig();
}

export function createAdminServices(
  options: CreateAdminServicesOptions = {},
): AdminServices {
  const provider =
    options.provider ??
    (process.env.ADMIN_DATA_PROVIDER === "mock"
      ? "mock"
      : hasBackendAdminConfig()
        ? "backend"
        : "mock");

  if (provider === "backend") {
    return {
      adminDashboardPort:
        options.adminDashboardPort ?? new SupabaseAdminDashboardPortAdapter(),
      adminUserPort:
        options.adminUserPort ?? new SupabaseAdminUserPortAdapter(),
      adminContentPort:
        options.adminContentPort ?? new SupabaseAdminContentPortAdapter(),
    };
  }

  return {
    adminDashboardPort:
      options.adminDashboardPort ?? new MockAdminDashboardPortAdapter(),
    adminUserPort: options.adminUserPort ?? new MockAdminUserPortAdapter(),
    adminContentPort:
      options.adminContentPort ?? new MockAdminContentPortAdapter(),
  };
}
