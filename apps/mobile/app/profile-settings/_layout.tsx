// @ts-nocheck
import { Stack } from "expo-router";
import { buildNativeHeaderScreenOptions } from "../nativeHeaderOptions.model";

export default function ProfileSettingsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={buildNativeHeaderScreenOptions("정보 설정")} />
    </Stack>
  );
}
