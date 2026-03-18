import {
  MockAdminContentAdapter,
  type AdminContentPort,
} from "@gynecology-chatbot/app-core";

export class MockAdminContentPortAdapter implements AdminContentPort {
  private readonly adapter = new MockAdminContentAdapter();

  async createDocument(
    input: Parameters<AdminContentPort["createDocument"]>[0],
  ) {
    return this.adapter.createDocument(input);
  }

  async getDocument(documentId: string) {
    return this.adapter.getDocument(documentId);
  }

  async updateDocument(
    documentId: string,
    input: Parameters<AdminContentPort["updateDocument"]>[1],
  ) {
    return this.adapter.updateDocument(documentId, input);
  }

  async deleteDocument(documentId: string) {
    return this.adapter.deleteDocument(documentId);
  }

  async updateWorkflowRule(
    id: string,
    input: Parameters<AdminContentPort["updateWorkflowRule"]>[1],
  ) {
    return this.adapter.updateWorkflowRule(id, input);
  }

  async listKnowledgeItems() {
    return this.adapter.listKnowledgeItems();
  }

  async createKnowledgeItem(
    input: Parameters<AdminContentPort["createKnowledgeItem"]>[0],
  ) {
    return this.adapter.createKnowledgeItem(input);
  }

  async updateKnowledgeItem(
    id: string,
    input: Parameters<AdminContentPort["updateKnowledgeItem"]>[1],
  ) {
    return this.adapter.updateKnowledgeItem(id, input);
  }

  async deleteKnowledgeItem(id: string) {
    return this.adapter.deleteKnowledgeItem(id);
  }

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
