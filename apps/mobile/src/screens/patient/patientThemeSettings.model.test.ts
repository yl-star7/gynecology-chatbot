import assert from "node:assert/strict";
import test from "node:test";
import { PATIENT_THEME_OPTIONS } from "./patientThemeSettings.model.ts";

test("PATIENT_THEME_OPTIONS lists the selectable app theme colors", () => {
  assert.deepEqual(PATIENT_THEME_OPTIONS, [
    {
      key: "rose-sand",
      label: "핑크",
      description: "포근한 핑크 계열",
    },
    {
      key: "mint-neutral",
      label: "연두",
      description: "차분한 연두 계열",
    },
    {
      key: "sky-blue",
      label: "하늘색",
      description: "맑은 하늘색 계열",
    },
  ]);
});
