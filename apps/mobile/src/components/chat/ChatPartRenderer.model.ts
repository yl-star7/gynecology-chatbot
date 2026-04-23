const bulletLinePattern = /^\s*[-*]\s+\S/;
const inlineBulletBeforeListPattern = /^(.*?)\s+([-*])\s+(\S.*)$/;
const standaloneQuotePattern = /^["“”]+(.+?)["“”]+[,，]?$/;

function stripWrappingQuoteMarks(value: string) {
  return value
    .trim()
    .replace(/^["“”]+/, "")
    .replace(/["“”]+[,，]?$/, "")
    .trim();
}

export function normalizeStandaloneQuotedLine(line: string) {
  const trimmed = line.trim();
  const match = standaloneQuotePattern.exec(trimmed);
  if (!match) {
    return line;
  }

  const content = stripWrappingQuoteMarks(match[1]);
  if (!content) {
    return line;
  }

  return `**"${content}"**`;
}

export function normalizeChatMarkdownLines(text: string) {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]*\(엄마 정보\)[ \t]*/g, "\n\n(엄마 정보)\n")
    .replace(/[ \t]*\(아기발달정보\)[ \t]*/g, "(아기발달정보)\n")
    .replace(/[ \t]*엄마 정보[ \t]*/g, "\n\n엄마 정보\n")
    .replace(/[ \t]*아기 발달 정보[ \t]*/g, "아기 발달 정보\n")
    .split("\n")
    .map((line) => normalizeStandaloneQuotedLine(line));

  return lines.flatMap((line, index) => {
    const nextLine = lines[index + 1] ?? "";

    if (bulletLinePattern.test(line) || !bulletLinePattern.test(nextLine)) {
      return [line];
    }

    const match = inlineBulletBeforeListPattern.exec(line.trimEnd());
    if (!match) {
      return [line];
    }

    const intro = match[1].trimEnd();
    const item = match[3].trim();
    if (!intro || !item) {
      return [line];
    }

    return [intro, `${match[2]} ${item}`];
  });
}

export function resolveQuickReplyDisplayLabel(label: string) {
  return label;
}
