// @ts-nocheck
import { useLocalSearchParams } from "expo-router";
import { LinkTargetScreen } from "../../../src/screens/LinkTargetScreen";

export default function LinkTargetRoute() {
  const { target, entityId } = useLocalSearchParams<{
    target?: string;
    entityId?: string;
  }>();
  return (
    <LinkTargetScreen
      target={target ?? "knowledge"}
      entityId={typeof entityId === "string" ? entityId : undefined}
    />
  );
}
