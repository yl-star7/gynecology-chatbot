import { Dimensions, Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { resolvePatientBottomInset } from "./patientScreenLayout.model";

export function usePatientBottomInset() {
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const screen = Dimensions.get("screen");

  return resolvePatientBottomInset({
    platformOs: Platform.OS,
    safeAreaBottomInset: insets.bottom,
    safeAreaTopInset: insets.top,
    screenHeight: screen.height,
    windowHeight: window.height,
  });
}
