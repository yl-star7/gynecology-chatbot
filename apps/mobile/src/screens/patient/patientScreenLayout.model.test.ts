import assert from "node:assert/strict";
import test from "node:test";
import {
  buildConversationComposerLayout,
  buildPatientScrollContentInsets,
  buildPatientTabContentInsets,
  buildPatientTabBarHeight,
  buildTodayConversationLayout,
  PATIENT_TAB_BAR_BODY_HEIGHT,
  resolveAnchoredKeyboardBottomOffset,
  resolveAndroidKeyboardBottomOffset,
  resolveConversationKeyboardAvoidingBehavior,
  resolveKeyboardHeightFromCoordinates,
} from "./patientScreenLayout.model.ts";

test("conversation composer layout keeps the input and send button slimmer", () => {
  const layout = buildConversationComposerLayout();

  assert.equal(layout.inputMinHeight, 52);
  assert.equal(layout.sendButtonSize, 44);
  assert.equal(layout.emptyStateMinHeight, 0);
  assert.equal(layout.chatCardMinHeight, 0);
});

test("conversation keyboard avoiding keeps the composer visible on Android", () => {
  assert.equal(resolveConversationKeyboardAvoidingBehavior("ios"), "padding");
  assert.equal(resolveConversationKeyboardAvoidingBehavior("android"), undefined);
  assert.equal(resolveConversationKeyboardAvoidingBehavior("web"), undefined);
});

test("android keyboard bottom offset lifts the composer only when resize did not happen", () => {
  assert.equal(
    resolveAndroidKeyboardBottomOffset({
      platformOs: "android",
      isKeyboardVisible: true,
      keyboardHeight: 360,
      baselineWindowHeight: 800,
      currentWindowHeight: 800,
    }),
    360,
  );

  assert.equal(
    resolveAndroidKeyboardBottomOffset({
      platformOs: "android",
      isKeyboardVisible: true,
      keyboardHeight: 360,
      baselineWindowHeight: 800,
      currentWindowHeight: 440,
    }),
    0,
  );
});

test("android keyboard bottom offset is inactive when the keyboard is hidden or not Android", () => {
  assert.equal(
    resolveAndroidKeyboardBottomOffset({
      platformOs: "android",
      isKeyboardVisible: false,
      keyboardHeight: 360,
      baselineWindowHeight: 800,
      currentWindowHeight: 800,
    }),
    0,
  );

  assert.equal(
    resolveAndroidKeyboardBottomOffset({
      platformOs: "ios",
      isKeyboardVisible: true,
      keyboardHeight: 360,
      baselineWindowHeight: 800,
      currentWindowHeight: 800,
    }),
    0,
  );
});

test("anchored keyboard bottom offset lifts iOS composer above the keyboard", () => {
  assert.equal(
    resolveAnchoredKeyboardBottomOffset({
      platformOs: "ios",
      isKeyboardVisible: true,
      keyboardHeight: 336,
      baselineWindowHeight: 844,
      currentWindowHeight: 844,
      bottomInset: 34,
    }),
    302,
  );
});

test("anchored keyboard bottom offset reuses Android resize compensation", () => {
  assert.equal(
    resolveAnchoredKeyboardBottomOffset({
      platformOs: "android",
      isKeyboardVisible: true,
      keyboardHeight: 360,
      baselineWindowHeight: 800,
      currentWindowHeight: 440,
      bottomInset: 0,
    }),
    0,
  );
});

test("keyboard height falls back to the visible frame when Android reports zero height", () => {
  assert.equal(
    resolveKeyboardHeightFromCoordinates({
      reportedHeight: 0,
      keyboardScreenY: 520,
      viewportHeight: 840,
    }),
    320,
  );

  assert.equal(
    resolveKeyboardHeightFromCoordinates({
      reportedHeight: 280,
      keyboardScreenY: 520,
      viewportHeight: 840,
    }),
    280,
  );

  assert.equal(
    resolveKeyboardHeightFromCoordinates({
      reportedHeight: 0,
      keyboardScreenY: Number.NaN,
      viewportHeight: 840,
    }),
    0,
  );
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

test("patient tab bar height follows the device bottom safe area", () => {
  assert.equal(
    buildPatientTabBarHeight({
      bottomInset: 24,
    }),
    PATIENT_TAB_BAR_BODY_HEIGHT + 24,
  );
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

test("patient tab content insets reserve tab bar and device safe area space", () => {
  const insets = buildPatientTabContentInsets({
    bottomInset: 12,
    topSpacing: 4,
  });

  assert.deepEqual(insets, {
    paddingTop: 4,
    paddingBottom: PATIENT_TAB_BAR_BODY_HEIGHT + 12,
  });
});

test("patient tab content insets stay identical when screens pass zero extra spacing", () => {
  assert.deepEqual(
    buildPatientTabContentInsets({
      bottomInset: 12,
      topSpacing: 4,
    }),
    buildPatientTabContentInsets({
      bottomInset: 12,
      topSpacing: 4,
      extraBottomSpacing: 0,
    }),
  );
});
