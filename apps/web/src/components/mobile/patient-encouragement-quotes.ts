import { PATIENT_ENCOURAGEMENT_QUOTES } from "@gynecology-chatbot/app-core";

export { PATIENT_ENCOURAGEMENT_QUOTES };

export function pickPatientEncouragementQuote(seed: string) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return PATIENT_ENCOURAGEMENT_QUOTES[
    hash % PATIENT_ENCOURAGEMENT_QUOTES.length
  ];
}
