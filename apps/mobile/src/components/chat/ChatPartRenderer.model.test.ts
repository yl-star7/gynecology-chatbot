import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  normalizeChatMarkdownLines,
  normalizeStandaloneQuotedLine,
  resolveDeepLinkDisplayTitle,
  resolveQuickReplyComposerText,
  resolveQuickReplyDisplayLabel,
} from "./ChatPartRenderer.model.ts";

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

test("chat markdown normalizes repeated standalone quote marks into one bold quoted line", () => {
  assert.equal(
    normalizeStandaloneQuotedLine(
      '"""최근에 있으면 안되는 중요한 사건이나 사실을 잠시 잊었던 적이 있었나요?"""',
    ),
    '**"최근에 있으면 안되는 중요한 사건이나 사실을 잠시 잊었던 적이 있었나요?"**',
  );
  assert.deepEqual(
    normalizeChatMarkdownLines(
      '"""최근에 있으면 안되는 중요한 사건이나 사실을 잠시 잊었던 적이 있었나요?""",\n이 질문에 답해주세요.',
    ),
    [
      '**"최근에 있으면 안되는 중요한 사건이나 사실을 잠시 잊었던 적이 있었나요?"**',
      "이 질문에 답해주세요.",
    ],
  );
});

test("quick reply display label is never abbreviated", () => {
  const label = "아기에게 가장 먼저 가르쳐주고 싶은 것은 무엇인가요?";

  assert.equal(resolveQuickReplyDisplayLabel(label), label);
  assert.doesNotMatch(resolveQuickReplyDisplayLabel(label), /…|\\.\\.\\./);
});

test("quick reply display label extracts the trailing question sentence", () => {
  const label =
    "작은 씨앗 크기에서 레몬 크기만큼 자란 아기를 떠올리며, 오늘은 감사에 대해 엄마의 생각을 들려주세요. 살아오면서 엄마에게 가장 감사했던 사람은 누구였나요?";

  assert.equal(
    resolveQuickReplyDisplayLabel(label),
    "살아오면서 엄마에게 가장 감사했던 사람은 누구였나요?",
  );
});

test("quick reply composer text uses the selected message exactly", () => {
  assert.equal(
    resolveQuickReplyComposerText({
      label: "다른 방향으로 물어봐주세요.",
      message: "다른 방향으로 물어봐주세요.",
    }),
    "다른 방향으로 물어봐주세요.",
  );
});

test("question quick reply composer text uses the visible question label", () => {
  assert.equal(
    resolveQuickReplyComposerText({
      choiceId: "550e8400-e29b-41d4-a716-446655440025",
      label:
        "오늘은 감사에 대해 엄마의 생각을 들려주세요. 살아오면서 엄마에게 가장 감사했던 사람은 누구였나요?",
      message:
        "오늘은 감사에 대해 엄마의 생각을 들려주세요. 살아오면서 엄마에게 가장 감사했던 사람은 누구였나요?",
    }),
    "살아오면서 엄마에게 가장 감사했던 사람은 누구였나요?",
  );
});

test("knowledge deep link display title uses encyclopedia copy", () => {
  assert.equal(
    resolveDeepLinkDisplayTitle({ title: "27주차 사전", target: "knowledge" }),
    "27주차 임신백과",
  );
  assert.equal(
    resolveDeepLinkDisplayTitle({ title: "사전", target: "knowledge" }),
    "임신백과",
  );
  assert.equal(
    resolveDeepLinkDisplayTitle({
      title: "임신백과 →",
      target: "knowledge",
      weekNumber: 32,
    }),
    "32주차 임신백과",
  );
});
