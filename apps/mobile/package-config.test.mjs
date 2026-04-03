import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));
const appJson = JSON.parse(readFileSync(new URL("./app.json", import.meta.url), "utf8"));
const rootPackageJson = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
const envExample = readFileSync(new URL("../../.env.example", import.meta.url), "utf8");
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

test("mobile workspace provides a Metro config that pins React resolution to the app-local runtime", () => {
  assert.equal(
    existsSync(new URL("./metro.config.js", import.meta.url)),
    true,
    "apps/mobile should define metro.config.js so React resolves from apps/mobile/node_modules in the monorepo",
  );
});

test("root dev:d script enables local mobile auth bypass and api provider", () => {
  const devDockerScript = rootPackageJson.scripts?.["dev:d"] ?? "";

  assert.match(
    devDockerScript,
    /MOBILE_AUTH_TEST_MODE=true/,
    "root dev:d should enable local mobile auth test mode for simulator runs",
  );

  assert.match(
    devDockerScript,
    /EXPO_PUBLIC_MOBILE_DATA_PROVIDER=api/,
    "root dev:d should expose the mobile data provider for Expo runtime",
  );

  assert.match(
    devDockerScript,
    /LOCAL_DEV_DUE_DATE=/,
    "root dev:d should provide LOCAL_DEV_DUE_DATE so docker bootstrap can seed without crashing",
  );
});

test("env example documents local mobile auth bypass configuration", () => {
  assert.match(
    envExample,
    /^EXPO_PUBLIC_MOBILE_DATA_PROVIDER=api$/m,
    ".env.example should document the mobile data provider used by local API runs",
  );

  assert.match(
    envExample,
    /^MOBILE_AUTH_TEST_MODE=true$/m,
    ".env.example should document the local mobile auth bypass mode",
  );

  assert.match(
    envExample,
    /^LOCAL_DEV_DUE_DATE=/m,
    ".env.example should document LOCAL_DEV_DUE_DATE for docker bootstrap",
  );
});
