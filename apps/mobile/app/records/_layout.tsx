// @ts-nocheck
import { Stack } from "expo-router";
import { HIDDEN_HEADER_SCREEN_OPTIONS } from "../detailStackOptions.model";

export default function RecordsLayout() {
  return (
    <Stack>
      <Stack.Screen name="[isoDate]" options={HIDDEN_HEADER_SCREEN_OPTIONS} />
    </Stack>
  );
}
