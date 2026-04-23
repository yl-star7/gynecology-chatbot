import { MOBILE_THEME_OPTIONS } from "@gynecology-chatbot/app-core/theme";

export const PATIENT_THEME_OPTIONS = MOBILE_THEME_OPTIONS.map((theme) => ({
  key: theme.key,
  label: theme.label,
  description: theme.description,
}));
