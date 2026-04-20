const bulletLinePattern = /^\s*[-*]\s+\S/;
const inlineBulletBeforeListPattern = /^(.*?)\s+([-*])\s+(\S.*)$/;

export function normalizeChatMarkdownLines(text: string) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");

  return lines.flatMap((line, index) => {
    const nextLine = lines[index + 1] ?? "";

    if (
      bulletLinePattern.test(line) ||
      !bulletLinePattern.test(nextLine)
    ) {
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
