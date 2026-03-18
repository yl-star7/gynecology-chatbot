import type { AdminDashboardData, AdminUserPort } from "@gynecology-chatbot/app-core";
import { MockAdminDashboardAdapter } from "@gynecology-chatbot/app-core";

export class MockAdminUserPortAdapter implements AdminUserPort {
  private readonly adapter = new MockAdminDashboardAdapter();

  async listUsers(): Promise<AdminDashboardData["managedUsers"]> {
    const dashboard = await this.adapter.getDashboard();
    return dashboard.managedUsers;
  }

  async updatePhoneNumber(
    _input: Parameters<AdminUserPort["updatePhoneNumber"]>[0],
  ): Promise<void> {
    return;
  }

  async resetPassword(
    _input: Parameters<AdminUserPort["resetPassword"]>[0],
  ): Promise<void> {
    return;
  }
}
