import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const indexSource = readFileSync(new URL("./app/index.tsx", import.meta.url), "utf8");
const webSource = readFileSync(new URL("./src/web/EmbeddedWebContent.web.tsx", import.meta.url), "utf8");

test("web frame styles use boxShadow instead of deprecated shadow props", () => {
  assert.match(
    indexSource,
    /Platform\.OS === "web"/,
    "app/index.tsx should branch web-only frame styles explicitly",
  );

  assert.match(
    indexSource,
    /boxShadow:\s*"0px 14px 24px rgba\(41, 58, 39, 0\.12\)"/,
    "app/index.tsx should use boxShadow for the wide web frame",
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
