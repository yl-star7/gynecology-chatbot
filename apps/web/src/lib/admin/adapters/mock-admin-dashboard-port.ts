import { MockAdminDashboardAdapter, type AdminDashboardPort } from "@gynecology-chatbot/app-core";

export class MockAdminDashboardPortAdapter implements AdminDashboardPort {
  private readonly adapter = new MockAdminDashboardAdapter();

  async getDashboard() {
    return this.adapter.getDashboard();
  }
}
