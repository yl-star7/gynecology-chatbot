import { radii, space } from "../../theme";

export const LABELED_INPUT_LAYOUT = {
  fieldGap: space.xs,
  labelInset: space.xs,
  inputRadius: radii.md,
  inputPaddingX: space.lg,
  inputPaddingY: space.lg,
  inputMinHeight: space.xxxl + space.xxl,
  multilineMinHeight: space.xxxl * 3,
  usesBorder: false,
} as const;
