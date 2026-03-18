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
}
