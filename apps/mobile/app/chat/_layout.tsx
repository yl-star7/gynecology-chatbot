// @ts-nocheck
import { Stack } from "expo-router";
import { HIDDEN_HEADER_SCREEN_OPTIONS } from "../detailStackOptions.model";

export default function ChatLayout() {
  return (
    <Stack>
      <Stack.Screen name="[sessionId]" options={HIDDEN_HEADER_SCREEN_OPTIONS} />
      <Stack.Screen name="link/[target]" options={HIDDEN_HEADER_SCREEN_OPTIONS} />
    </Stack>
  );
}
