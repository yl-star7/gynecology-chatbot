import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");
const webSource = readFileSync(new URL("./src/web/EmbeddedWebContent.web.tsx", import.meta.url), "utf8");
const nativeSource = readFileSync(new URL("./src/web/EmbeddedWebContent.native.tsx", import.meta.url), "utf8");

test("app entry falls back to the local web server when EXPO_PUBLIC_WEB_URL is missing", () => {
  assert.match(
    appSource,
    /return "http:\/\/localhost:3005";/,
    "App.tsx should fall back to localhost for iOS simulator runs",
  );

  assert.match(
    appSource,
    /return "http:\/\/10\.0\.2\.2:3005";/,
    "App.tsx should use the Android emulator loopback when needed",
  );

  assert.match(
    appSource,
    /\/chat\/new/,
    "App.tsx should send the app directly to the chat route",
  );
});

test("web runtime uses an iframe fallback instead of react-native-webview", () => {
  assert.match(
    webSource,
    /<iframe/,
    "EmbeddedWebContent.web.tsx should render an iframe for Expo web",
  );
});

test("server-side web render gates iframe usage behind a DOM availability check", () => {
  assert.match(
    webSource,
    /typeof document !== "undefined"/,
    "EmbeddedWebContent.web.tsx should avoid rendering the iframe during Expo static rendering",
  );
});

test("native webview blocks the admin route inside the mobile shell", () => {
  assert.match(
    nativeSource,
    /pathname === "\/admin" \|\| requestUrl\.pathname\.startsWith\("\/admin\/"\)/,
    "EmbeddedWebContent.native.tsx should block admin pages from rendering inside the mobile webview",
  );
});
