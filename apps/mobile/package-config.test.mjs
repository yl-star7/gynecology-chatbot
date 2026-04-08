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

test("mobile app config keeps Expo updates metadata consistent when using EAS project settings", () => {
  const projectId = appJson.expo?.extra?.eas?.projectId;

  assert.equal(
    appJson.expo?.owner,
    "yl-star7",
    "apps/mobile app.json should keep the Expo owner aligned with the configured EAS project",
  );

  assert.deepEqual(
    appJson.expo?.runtimeVersion,
    { policy: "appVersion" },
    "apps/mobile app.json should define runtimeVersion for Expo updates compatibility",
  );

  assert.equal(
    appJson.expo?.updates?.url,
    `https://u.expo.dev/${projectId}`,
    "apps/mobile app.json should define the Expo updates URL derived from the configured EAS project id",
  );
});

test("mobile workspace provides a Metro config that pins React resolution to the app-local runtime", () => {
  assert.equal(
    existsSync(new URL("./metro.config.js", import.meta.url)),
    true,
    "apps/mobile should define metro.config.js so React resolves from apps/mobile/node_modules in the monorepo",
  );
});

test("root dev:d script enables api provider and due date", () => {
  const devDockerScript = rootPackageJson.scripts?.["dev:d"] ?? "";

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
    /^LOCAL_DEV_DUE_DATE=/m,
    ".env.example should document LOCAL_DEV_DUE_DATE for docker bootstrap",
  );
});

test("mobile start script provides Expo public env defaults for local simulator runs", () => {
  const startScript = packageJson.scripts?.start ?? "";

  assert.match(
    startScript,
    /EXPO_PUBLIC_MOBILE_DATA_PROVIDER=\$\{EXPO_PUBLIC_MOBILE_DATA_PROVIDER:-api\}/,
    "apps/mobile start should default EXPO_PUBLIC_MOBILE_DATA_PROVIDER to api",
  );

  assert.match(
    startScript,
    /EXPO_PUBLIC_API_BASE_URL=\$\{EXPO_PUBLIC_API_BASE_URL:-http:\/\/localhost:3005\}/,
    "apps/mobile start should default EXPO_PUBLIC_API_BASE_URL for local runs",
  );

  assert.match(
    startScript,
    /EXPO_PUBLIC_WEB_URL=\$\{EXPO_PUBLIC_WEB_URL:-http:\/\/localhost:3005\}/,
    "apps/mobile start should default EXPO_PUBLIC_WEB_URL for local runs",
  );

  assert.match(
    startScript,
    /EXPO_PUBLIC_DEV_USER_ID=\$\{EXPO_PUBLIC_DEV_USER_ID:-local-user-demo\}/,
    "apps/mobile start should default EXPO_PUBLIC_DEV_USER_ID for local runs",
  );
});
