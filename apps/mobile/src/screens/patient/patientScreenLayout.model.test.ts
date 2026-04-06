import assert from "node:assert/strict";
import test from "node:test";
import {
  buildConversationComposerLayout,
  buildPatientScrollContentInsets,
  buildPatientTabContentInsets,
  buildTodayConversationLayout,
} from "./patientScreenLayout.model.ts";

test("conversation composer layout keeps the input and send button slimmer", () => {
  const layout = buildConversationComposerLayout();

  assert.equal(layout.inputMinHeight, 52);
  assert.equal(layout.sendButtonSize, 44);
  assert.equal(layout.emptyStateMinHeight, 0);
  assert.equal(layout.chatCardMinHeight, 0);
});

test("patient scroll content insets use safe area and tab bar instead of fixed 140 padding", () => {
  const insets = buildPatientScrollContentInsets({
    bottomInset: 12,
    tabBarHeight: 88,
    extraBottomSpacing: 16,
  });

  assert.deepEqual(insets, {
    paddingTop: 8,
    paddingBottom: 116,
  });
});

test("today conversation layout keeps the composer outside the conversation card", () => {
  const layout = buildTodayConversationLayout();

  assert.equal(layout.cardMinHeight, 0);
  assert.equal(layout.emptyStateMinHeight, 0);
  assert.equal(layout.sendButtonSize, 44);
  assert.equal(layout.showComposerDivider, false);
  assert.equal(layout.composerInsideCard, false);
  assert.equal(layout.composerAnchoredAboveTabBar, true);
});

test("patient tab content insets replace fixed 140 bottom padding across screens", () => {
  const insets = buildPatientTabContentInsets({
    bottomInset: 12,
    topSpacing: 4,
  });

  assert.deepEqual(insets, {
    paddingTop: 4,
    paddingBottom: 104,
  });
});
