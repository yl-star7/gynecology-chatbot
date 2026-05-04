// @ts-nocheck
import { Stack } from "expo-router";
import { HIDDEN_HEADER_SCREEN_OPTIONS } from "../detailStackOptions.model";

export default function AskLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={HIDDEN_HEADER_SCREEN_OPTIONS} />
    </Stack>
  );
}
