import type { ChatMessage } from "@gynecology-chatbot/app-core";

export function sanitizeInlineCitationMarkers(text: string) {
  return text
    .replace(/\s*\[\d+\]/g, "")
    .replace(/(?:\s*\(\d+\))+/g, "")
    .replace(/\s*\((?:\d+\s*,\s*)+\d+\)/g, "")
    .replace(/[^\S\n]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function sanitizeChatParts(parts: ChatMessage["parts"]) {
  return parts.map((part) => {
    if (part.type === "text") {
      return {
        ...part,
        text: sanitizeInlineCitationMarkers(part.text),
      };
    }

    return part;
  });
}
