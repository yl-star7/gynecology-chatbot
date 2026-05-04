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
  const trimmed = label.trim();
  if (!trimmed) return label;
  const sentences = trimmed.match(/[^.!?。！？\n]+[.!?。！？]/g);
  if (sentences && sentences.length > 0) {
    for (let i = sentences.length - 1; i >= 0; i -= 1) {
      const sentence = sentences[i]!.trim();
      if (/[?？]$/.test(sentence)) {
        return sentence;
      }
    }
  }
  return label;
}

function isUuid(value: string | null | undefined) {
  return Boolean(
    value?.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    ),
  );
}

export function resolveQuickReplyComposerText({
  choiceId,
  label,
  message,
}: {
  choiceId?: string | null;
  label: string;
  message: string;
}) {
  if (isUuid(choiceId)) {
    return resolveQuickReplyDisplayLabel(label);
  }

  return message;
}

export function resolveDeepLinkDisplayTitle({
  title,
  target,
  weekNumber,
}: {
  title?: string | null;
  target?: string | null;
  weekNumber?: number | null;
}) {
  const trimmed = title?.trim() ?? "";
  if (target === "knowledge") {
    const normalized = trimmed
      .replace(/주차별\s*사전/g, "임신백과")
      .replace(/주차\s*사전/g, "주차 임신백과")
      .replace(/사전/g, "임신백과")
      .trim();

    if ((!normalized || /^임신백과\s*→?$/u.test(normalized)) && weekNumber) {
      return `${weekNumber}주차 임신백과`;
    }

    return normalized || "임신백과";
  }

  return trimmed || "연결된 정보";
}
