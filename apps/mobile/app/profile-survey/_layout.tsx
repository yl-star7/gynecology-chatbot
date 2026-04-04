// @ts-nocheck
import { Stack } from "expo-router";
import { SHEET_MODAL_SCREEN_OPTIONS } from "../detailStackOptions.model";

export default function ProfileSurveyLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={SHEET_MODAL_SCREEN_OPTIONS} />
    </Stack>
  );
}
