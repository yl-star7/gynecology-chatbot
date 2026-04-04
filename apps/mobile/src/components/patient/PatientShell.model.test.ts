import assert from "node:assert/strict";
import test from "node:test";
import { resolvePatientShellHeaderLayout } from "./PatientShell.model.ts";

test("header layout removes right placeholder when no profile button or action is shown", () => {
  const layout = resolvePatientShellHeaderLayout({
    hasBackButton: false,
    showProfileButton: false,
    hasRightAction: false,
  });

  assert.deepEqual(layout, {
    leftSlot: "spacer",
    rightSlot: "none",
    compactTrailingSpace: true,
    usesCompactTopInset: false,
  });
});

test("header layout keeps right action when an explicit action exists", () => {
  const layout = resolvePatientShellHeaderLayout({
    hasBackButton: false,
    showProfileButton: false,
    hasRightAction: true,
  });

  assert.deepEqual(layout, {
    leftSlot: "spacer",
    rightSlot: "action",
    compactTrailingSpace: false,
    usesCompactTopInset: false,
  });
});

test("header layout uses relaxed top inset when back button is shown", () => {
  const layout = resolvePatientShellHeaderLayout({
    hasBackButton: true,
    showProfileButton: false,
    hasRightAction: false,
  });

  assert.deepEqual(layout, {
    leftSlot: "back",
    rightSlot: "none",
    compactTrailingSpace: true,
    usesCompactTopInset: true,
  });
});
