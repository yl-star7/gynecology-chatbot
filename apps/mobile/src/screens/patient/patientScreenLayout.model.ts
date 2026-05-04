import { space } from "../../tokens.ts";

const DEFAULT_PATIENT_TAB_BOTTOM_SPACING = 0;
export const PATIENT_TAB_BAR_BODY_HEIGHT = space.xxxl + space.md;
export const PATIENT_TAB_BAR_CONTENT_OFFSET_Y = -space.lg;
const DEFAULT_PATIENT_TAB_BAR_MINIMUM_BOTTOM_PADDING = space.xs;

type ConversationKeyboardAvoidingBehavior =
  | "height"
  | "padding"
  | "position"
  | undefined;

export function resolveConversationKeyboardAvoidingBehavior(
  platformOs: string,
): ConversationKeyboardAvoidingBehavior {
  if (platformOs === "ios") {
    return "padding";
  }

  return undefined;
}

export function resolveKeyboardHeightFromCoordinates({
  reportedHeight,
  keyboardScreenY,
  viewportHeight,
}: {
  reportedHeight: number;
  keyboardScreenY: number;
  viewportHeight: number;
}) {
  if (reportedHeight > 0) {
    return reportedHeight;
  }

  if (!Number.isFinite(keyboardScreenY) || !Number.isFinite(viewportHeight)) {
    return 0;
  }

  return Math.max(0, viewportHeight - keyboardScreenY);
}

export function resolveAndroidKeyboardBottomOffset({
  platformOs,
  isKeyboardVisible,
  keyboardHeight,
  baselineWindowHeight,
  currentWindowHeight,
}: {
  platformOs: string;
  isKeyboardVisible: boolean;
  keyboardHeight: number;
  baselineWindowHeight: number;
  currentWindowHeight: number;
}) {
  if (platformOs !== "android" || !isKeyboardVisible || keyboardHeight <= 0) {
    return 0;
  }

  const resizedByKeyboard = Math.max(
    0,
    baselineWindowHeight - currentWindowHeight,
  );

  return Math.max(0, keyboardHeight - resizedByKeyboard);
}

export function resolveAnchoredKeyboardBottomOffset({
  platformOs,
  isKeyboardVisible,
  keyboardHeight,
  baselineWindowHeight,
  currentWindowHeight,
  bottomInset,
}: {
  platformOs: string;
  isKeyboardVisible: boolean;
  keyboardHeight: number;
  baselineWindowHeight: number;
  currentWindowHeight: number;
  bottomInset: number;
}) {
  if (!isKeyboardVisible || keyboardHeight <= 0) {
    return 0;
  }

  if (platformOs === "ios") {
    return Math.max(0, keyboardHeight - bottomInset);
  }

  return resolveAndroidKeyboardBottomOffset({
    platformOs,
    isKeyboardVisible,
    keyboardHeight,
    baselineWindowHeight,
    currentWindowHeight,
  });
}

export function buildPatientScrollContentInsets({
  bottomInset,
  tabBarHeight,
  extraBottomSpacing = 0,
  topSpacing = space.sm,
}: {
  bottomInset: number;
  tabBarHeight: number;
  extraBottomSpacing?: number;
  topSpacing?: number;
}) {
  return {
    paddingTop: topSpacing,
    paddingBottom: bottomInset + tabBarHeight + extraBottomSpacing,
  };
}

export function buildPatientTabBarHeight({
  bottomInset,
  minimumBottomPadding = DEFAULT_PATIENT_TAB_BAR_MINIMUM_BOTTOM_PADDING,
}: {
  bottomInset: number;
  minimumBottomPadding?: number;
}) {
  return PATIENT_TAB_BAR_BODY_HEIGHT + Math.max(bottomInset, minimumBottomPadding);
}

export function buildPatientTabContentInsets({
  bottomInset,
  topSpacing = space.sm,
  extraBottomSpacing = DEFAULT_PATIENT_TAB_BOTTOM_SPACING,
}: {
  bottomInset: number;
  topSpacing?: number;
  extraBottomSpacing?: number;
}) {
  return {
    paddingTop: topSpacing,
    paddingBottom:
      buildPatientTabBarHeight({ bottomInset }) + extraBottomSpacing,
  };
}

export function buildConversationComposerLayout() {
  return {
    inputMinHeight: 52,
    inputMaxHeight: space.xxxl * 3,
    inputPaddingVertical: space.sm + space.xs,
    sendButtonSize: 44,
    emptyStateMinHeight: 0,
    chatCardMinHeight: 0,
  } as const;
}

export function buildTodayConversationLayout() {
  return {
    cardMinHeight: 0,
    emptyStateMinHeight: 0,
    sendButtonSize: 44,
    showComposerDivider: false,
    composerInsideCard: false,
    composerAnchoredAboveTabBar: true,
  } as const;
}
