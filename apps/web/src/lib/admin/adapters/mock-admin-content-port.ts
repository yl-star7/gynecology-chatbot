import {
  MockAdminContentAdapter,
  type AdminContentPort,
} from "@gynecology-chatbot/app-core";

export class MockAdminContentPortAdapter implements AdminContentPort {
  private readonly adapter = new MockAdminContentAdapter();

  async listWeeks() {
    return this.adapter.listWeeks();
  }

  async getWeek(weekNumber: number) {
    return this.adapter.getWeek(weekNumber);
  }

  async saveWeek(weekNumber: number, input: Parameters<AdminContentPort["saveWeek"]>[1]) {
    return this.adapter.saveWeek(weekNumber, input);
  }
}
