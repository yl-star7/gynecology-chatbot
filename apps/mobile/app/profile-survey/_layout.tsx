// @ts-nocheck
import { Stack } from "expo-router";
import { buildNativeHeaderScreenOptions } from "../nativeHeaderOptions.model";

export default function ProfileSurveyLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={buildNativeHeaderScreenOptions("설문")} />
    </Stack>
  );
}
