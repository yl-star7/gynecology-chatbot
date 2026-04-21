import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPrefetchPlan,
  getAllWeekBabyImageUris,
  getWeekBabyImageSource,
} from "./week-baby-images.ts";

test("getAllWeekBabyImageUris returns one uri per supported week (5~40)", () => {
  const uris = getAllWeekBabyImageUris();
  assert.equal(uris.length, 36);
  assert.ok(uris[0].includes("/05/w05-"));
  assert.ok(uris[uris.length - 1].includes("/40/w40-"));
  assert.equal(new Set(uris).size, uris.length, "중복된 URI가 있으면 안 됨");
});

test("getWeekBabyImageSource defaults to the current public GCS location", () => {
  const source = getWeekBabyImageSource("18주");

  assert.equal(
    source.uri,
    "https://storage.googleapis.com/pregnancy-content/weeks/18/w18-bell-pepper.png",
  );
});

test("buildPrefetchPlan without anchor defers every week", () => {
  const plan = buildPrefetchPlan(null);
  assert.equal(plan.priority.length, 0);
  assert.equal(plan.deferred.length, 36);
});

test("buildPrefetchPlan places current week first, then ±1, ±2, ±3", () => {
  const plan = buildPrefetchPlan(20);
  const expectedOrder = [20, 21, 19, 22, 18, 23, 17].map((week) => {
    const source = getWeekBabyImageSource(`${week}주`);
    return source.uri;
  });
  assert.deepEqual(plan.priority, expectedOrder);
  assert.equal(plan.priority.length + plan.deferred.length, 36);
});

test("buildPrefetchPlan clamps anchor below min week", () => {
  const plan = buildPrefetchPlan(2);
  // anchor=5로 클램프 → priority: 5,6,7,8 (음수 주차는 제외)
  const priorityUris = plan.priority;
  assert.ok(priorityUris[0].includes("/05/"));
  assert.equal(
    priorityUris.length,
    4,
    "5주 기준 하위 주차가 없으므로 5,6,7,8만 priority",
  );
});

test("buildPrefetchPlan clamps anchor above max week", () => {
  const plan = buildPrefetchPlan(45);
  // anchor=40 → priority: 40,39,38,37
  const priorityUris = plan.priority;
  assert.ok(priorityUris[0].includes("/40/"));
  assert.equal(priorityUris.length, 4);
});

test("buildPrefetchPlan has no overlap between priority and deferred", () => {
  const plan = buildPrefetchPlan(25);
  const priority = new Set(plan.priority);
  for (const uri of plan.deferred) {
    assert.ok(!priority.has(uri), `deferred에 priority 중복: ${uri}`);
  }
  assert.equal(priority.size + plan.deferred.length, 36);
});
