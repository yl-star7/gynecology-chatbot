// @ts-nocheck
import { Stack } from "expo-router";
import { HIDDEN_HEADER_SCREEN_OPTIONS } from "../detailStackOptions.model";

export default function DevLayout() {
  return (
    <Stack>
      <Stack.Screen name="chat-mock" options={HIDDEN_HEADER_SCREEN_OPTIONS} />
      <Stack.Screen name="encyclopedia" options={HIDDEN_HEADER_SCREEN_OPTIONS} />
      <Stack.Screen name="encyclopedia-mock" options={HIDDEN_HEADER_SCREEN_OPTIONS} />
    </Stack>
  );
}
