import assert from "node:assert/strict";
import test from "node:test";
import { createMobileServices } from "./createMobileServices.ts";

test("createMobileServices creates API services", () => {
  const services = createMobileServices();
  assert.ok(services, "should create services");
  assert.ok(services.chatPort, "should have chatPort");
  assert.ok(services.authPort, "should have authPort");
  assert.ok(services.profilePort, "should have profilePort");
  assert.ok(services.homePort, "should have homePort");
  assert.ok(services.todayPort, "should have todayPort");
  assert.ok(services.knowledgePort, "should have knowledgePort");
  assert.ok(services.onboardingPort, "should have onboardingPort");
});
