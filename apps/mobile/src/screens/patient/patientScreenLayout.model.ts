import { space } from "../../tokens.ts";

const DEFAULT_PATIENT_TAB_BAR_HEIGHT = space.xxxl * 2 + space.md;
const DEFAULT_PATIENT_TAB_BOTTOM_SPACING = space.lg;

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

export function buildPatientTabContentInsets({
  bottomInset,
  topSpacing = space.sm,
  extraBottomSpacing = DEFAULT_PATIENT_TAB_BOTTOM_SPACING,
}: {
  bottomInset: number;
  topSpacing?: number;
  extraBottomSpacing?: number;
}) {
  return buildPatientScrollContentInsets({
    bottomInset,
    tabBarHeight: DEFAULT_PATIENT_TAB_BAR_HEIGHT,
    extraBottomSpacing,
    topSpacing,
  });
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
