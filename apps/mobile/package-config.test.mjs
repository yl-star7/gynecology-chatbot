import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));
const appJson = JSON.parse(readFileSync(new URL("./app.json", import.meta.url), "utf8"));
const dependencies = packageJson.dependencies ?? {};

test("mobile package declares Expo web runtime dependencies", () => {
  assert.equal(
    dependencies["expo"],
    "~52.0.49",
    "apps/mobile should use the Expo SDK patch version expected by the local Expo CLI",
  );

  assert.equal(
    dependencies["react-native"],
    "0.76.9",
    "apps/mobile should use the React Native patch version expected by the local Expo CLI",
  );

  assert.equal(
    dependencies["@expo/metro-runtime"],
    "^4.0.0",
    "apps/mobile must depend on @expo/metro-runtime for Expo web runtime support",
  );

  assert.equal(
    dependencies["expo-asset"],
    "~11.0.1",
    "apps/mobile should depend on expo-asset so Expo web modules resolve consistently",
  );

  assert.equal(
    dependencies["react-native-webview"],
    "13.12.5",
    "apps/mobile should pin the Expo SDK 52 compatible react-native-webview version",
  );
});

test("mobile app config does not ship a placeholder EAS project id for local simulator runs", () => {
  assert.notEqual(
    appJson.expo?.extra?.eas?.projectId,
    "your-project-id",
    "apps/mobile app.json should not include the Expo placeholder project id",
  );
});
