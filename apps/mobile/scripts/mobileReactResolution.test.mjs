import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { resolveMobileReactRequest } = require("./mobileReactResolution.cjs");

test("mobile React resolution points to the app-local React 18 runtime", () => {
  const reactPath = resolveMobileReactRequest("react");
  const reactDomServerPath = resolveMobileReactRequest("react-dom/server.node");
  const reactDomClientPath = resolveMobileReactRequest("react-dom/client");
  const schedulerPath = resolveMobileReactRequest("scheduler");
  const schedulerPostTaskPath = resolveMobileReactRequest("scheduler/unstable_post_task");

  assert.ok(reactPath?.includes("/apps/mobile/node_modules/"), "react should resolve from apps/mobile/node_modules");
  assert.ok(
    reactDomServerPath?.includes("/apps/mobile/node_modules/"),
    "react-dom/server.node should resolve from apps/mobile/node_modules",
  );
  assert.ok(
    reactDomClientPath?.includes("/apps/mobile/node_modules/"),
    "react-dom/client should resolve from apps/mobile/node_modules",
  );
  assert.ok(
    schedulerPath?.includes("/apps/mobile/node_modules/"),
    "scheduler should resolve from apps/mobile/node_modules",
  );
  assert.ok(
    schedulerPostTaskPath?.includes("/apps/mobile/node_modules/"),
    "scheduler subpaths should resolve from apps/mobile/node_modules",
  );
});
