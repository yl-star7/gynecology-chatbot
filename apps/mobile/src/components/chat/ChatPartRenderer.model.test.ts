import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("./ChatPartRenderer.tsx", import.meta.url),
  "utf8",
);

test("chat markdown paragraphs preserve explicit line breaks", () => {
  assert.doesNotMatch(
    source,
    /paragraph\.join\(" "\)/,
    "TextPartView should not collapse markdown line breaks into spaces.",
  );
  assert.match(
    source,
    /paragraph\.join\("\\n"\)/,
    "TextPartView should keep markdown line breaks inside paragraph text.",
  );
});
