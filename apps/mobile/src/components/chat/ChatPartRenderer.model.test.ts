import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { normalizeChatMarkdownLines } from "./ChatPartRenderer.model.ts";

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

test("chat markdown treats an inline first bullet as part of the following list", () => {
  assert.deepEqual(
    normalizeChatMarkdownLines(
      [
        "그래서 ㅁㅁㅁㅁㅁ - ㄴㄹㄴㅇㄹㄴ",
        "- ㄴㅇㄹㄴㅇㄹ",
        "- ㄴㅇㄹㄴㅇㄹㄴㄹㅇ",
      ].join("\n"),
    ),
    [
      "그래서 ㅁㅁㅁㅁㅁ",
      "- ㄴㄹㄴㅇㄹㄴ",
      "- ㄴㅇㄹㄴㅇㄹ",
      "- ㄴㅇㄹㄴㅇㄹㄴㄹㅇ",
    ],
  );
});

test("chat markdown keeps inline hyphens as text when they are not followed by a list", () => {
  assert.deepEqual(
    normalizeChatMarkdownLines("몸무게 50 - 60kg 정도로 기록해요."),
    ["몸무게 50 - 60kg 정도로 기록해요."],
  );
});
