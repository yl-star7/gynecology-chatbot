export const USER_GUIDE_URL =
  "https://fluoridated-hunter-34f.notion.site/35610b1324b880c4b572dfc9a7cb57e7?source=copy_link";

export function normalizeSurveyFormUrl(input: string | null | undefined) {
  if (!input?.trim()) {
    return null;
  }

  try {
    const parsedUrl = new URL(input.trim());
    const isAllowedHost =
      parsedUrl.hostname === "docs.google.com" ||
      parsedUrl.hostname === "forms.gle";
    const isAllowedPath =
      parsedUrl.hostname === "forms.gle" ||
      parsedUrl.pathname.startsWith("/forms/");

    if (parsedUrl.protocol !== "https:" || !isAllowedHost || !isAllowedPath) {
      return null;
    }

    return parsedUrl.toString();
  } catch {
    return null;
  }
}
