import assert from "node:assert/strict";
import test from "node:test";
import { resolvePatientShellHeaderLayout } from "./PatientShell.model.ts";

test("header layout removes right placeholder when profile button is hidden", () => {
  const layout = resolvePatientShellHeaderLayout({
    hasBackButton: false,
    showProfileButton: false,
  });

  assert.deepEqual(layout, {
    leftSlot: "spacer",
    rightSlot: "none",
    compactTrailingSpace: true,
    usesCompactTopInset: false,
  });
});

test("header layout keeps profile button when shown", () => {
  const layout = resolvePatientShellHeaderLayout({
    hasBackButton: false,
    showProfileButton: true,
  });

  assert.deepEqual(layout, {
    leftSlot: "spacer",
    rightSlot: "profile",
    compactTrailingSpace: false,
    usesCompactTopInset: false,
  });
});

test("header layout uses relaxed top inset when back button is shown", () => {
  const layout = resolvePatientShellHeaderLayout({
    hasBackButton: true,
    showProfileButton: false,
  });

  assert.deepEqual(layout, {
    leftSlot: "back",
    rightSlot: "none",
    compactTrailingSpace: true,
    usesCompactTopInset: true,
  });
});
