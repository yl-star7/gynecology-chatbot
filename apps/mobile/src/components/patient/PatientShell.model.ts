export function resolvePatientShellHeaderLayout(input: {
  hasBackButton: boolean;
  showProfileButton: boolean;
}) {
  return {
    leftSlot: input.hasBackButton ? "back" : "spacer",
    rightSlot: input.showProfileButton ? "profile" : "none",
    compactTrailingSpace: !input.showProfileButton,
    usesCompactTopInset: input.hasBackButton,
  } as const;
}
