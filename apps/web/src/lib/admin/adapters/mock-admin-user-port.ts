import type {
  AdminAllowedPhoneNumber,
  AdminDashboardData,
  AdminUserPort,
} from "@gynecology-chatbot/app-core";
import { MockAdminDashboardAdapter } from "@gynecology-chatbot/app-core";

const mockAllowedPhoneNumbers: AdminAllowedPhoneNumber[] = [
  {
    id: "allow-1",
    phoneNumber: "010-2345-6789",
    displayName: "김수연",
    note: "1차 파일럿",
    createdAt: "2026-03-18T09:00:00.000Z",
    updatedAt: "2026-03-18T09:00:00.000Z",
  },
];

export class MockAdminUserPortAdapter implements AdminUserPort {
  private readonly adapter = new MockAdminDashboardAdapter();

  async listUsers(): Promise<AdminDashboardData["managedUsers"]> {
    const dashboard = await this.adapter.getDashboard();
    return dashboard.managedUsers;
  }

  async listAllowedPhoneNumbers(): Promise<AdminAllowedPhoneNumber[]> {
    return mockAllowedPhoneNumbers;
  }

  async createAllowedPhoneNumber(
    input: Parameters<AdminUserPort["createAllowedPhoneNumber"]>[0],
  ): Promise<AdminAllowedPhoneNumber> {
    const nextEntry: AdminAllowedPhoneNumber = {
      id: `allow-${Date.now()}`,
      phoneNumber: input.phoneNumber,
      displayName: input.displayName ?? null,
      note: input.note ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockAllowedPhoneNumbers.unshift(nextEntry);
    return nextEntry;
  }

  async updateAllowedPhoneNumber(
    input: Parameters<AdminUserPort["updateAllowedPhoneNumber"]>[0],
  ): Promise<AdminAllowedPhoneNumber> {
    const current =
      mockAllowedPhoneNumbers.find((entry) => entry.id === input.id) ??
      mockAllowedPhoneNumbers[0];
    const nextEntry: AdminAllowedPhoneNumber = {
      ...current,
      id: input.id,
      phoneNumber: input.phoneNumber,
      displayName: input.displayName ?? null,
      note: input.note ?? null,
      updatedAt: new Date().toISOString(),
    };
    const index = mockAllowedPhoneNumbers.findIndex((entry) => entry.id === input.id);
    if (index >= 0) {
      mockAllowedPhoneNumbers[index] = nextEntry;
    } else {
      mockAllowedPhoneNumbers.unshift(nextEntry);
    }
    return nextEntry;
  }

  async deleteAllowedPhoneNumber(
    input: Parameters<AdminUserPort["deleteAllowedPhoneNumber"]>[0],
  ): Promise<void> {
    const index = mockAllowedPhoneNumbers.findIndex((entry) => entry.id === input.id);
    if (index >= 0) {
      mockAllowedPhoneNumbers.splice(index, 1);
    }
  }

  async updatePhoneNumber(
    _input: Parameters<AdminUserPort["updatePhoneNumber"]>[0],
  ): Promise<void> {
    return;
  }

  async resetSession(
    _input: Parameters<AdminUserPort["resetSession"]>[0],
  ): Promise<void> {
    return;
  }

  async updateUserStatus(
    _input: Parameters<AdminUserPort["updateUserStatus"]>[0],
  ): Promise<void> {
    return;
  }
}
