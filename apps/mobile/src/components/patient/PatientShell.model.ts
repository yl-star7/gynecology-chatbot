export function resolvePatientShellHeaderLayout(input: {
  hasBackButton: boolean;
  showProfileButton: boolean;
  hasRightAction: boolean;
}) {
  return {
    leftSlot: input.hasBackButton ? "back" : "spacer",
    rightSlot: input.showProfileButton
      ? "profile"
      : input.hasRightAction
        ? "action"
        : "none",
    compactTrailingSpace: !input.showProfileButton && !input.hasRightAction,
  } as const;
}
