// @ts-nocheck
import { useLocalSearchParams } from "expo-router";
import { LinkTargetScreen } from "../../../src/screens/LinkTargetScreen";

export default function LinkTargetRoute() {
  const { target } = useLocalSearchParams<{ target?: string }>();
  return <LinkTargetScreen target={target ?? "knowledge"} />;
}
