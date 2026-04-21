export function resolvePatientShellHeaderLayout(input: {
  hasBackButton: boolean;
  showProfileButton: boolean;
  hasTrailingAction?: boolean;
}) {
  const rightSlot = input.hasTrailingAction
    ? "action"
    : input.showProfileButton
      ? "profile"
      : "none";

  return {
    leftSlot: input.hasBackButton ? "back" : "spacer",
    rightSlot,
    compactTrailingSpace: rightSlot === "none",
    usesCompactTopInset: input.hasBackButton,
  } as const;
}
