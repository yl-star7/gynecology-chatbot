export type PatientTabKey = "home" | "today" | "profile";

export type PatientTabItem = {
  key: PatientTabKey;
  label: string;
  icon: "home-outline" | "chatbubble-ellipses-outline" | "person-outline";
  href: "/home" | "/today" | "/profile";
};

export const PATIENT_TABS: PatientTabItem[] = [
  { key: "home", label: "홈", icon: "home-outline", href: "/home" },
  { key: "today", label: "오늘,우리", icon: "chatbubble-ellipses-outline", href: "/today" },
  { key: "profile", label: "마이페이지", icon: "person-outline", href: "/profile" },
];

export function openPatientTab(
  router: { navigate: (href: PatientTabItem["href"]) => void },
  href: PatientTabItem["href"],
) {
  router.navigate(href);
}
