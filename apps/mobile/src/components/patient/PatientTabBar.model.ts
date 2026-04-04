export type PatientTabKey = "home" | "today" | "profile";

export type PatientTabRouteName = "home" | "today" | "profile";
export type PatientTabHref = "/(tabs)/home" | "/(tabs)/today" | "/(tabs)/profile";

export type PatientTabItem = {
  key: PatientTabKey;
  routeName: PatientTabRouteName;
  label: string;
  icon: "home-outline" | "chatbubble-ellipses-outline" | "person-outline";
  href: PatientTabHref;
};

export const PATIENT_TABS: PatientTabItem[] = [
  { key: "home", routeName: "home", label: "홈", icon: "home-outline", href: "/(tabs)/home" },
  { key: "today", routeName: "today", label: "오늘,우리", icon: "chatbubble-ellipses-outline", href: "/(tabs)/today" },
  { key: "profile", routeName: "profile", label: "마이페이지", icon: "person-outline", href: "/(tabs)/profile" },
];

export function openPatientTab(
  router: { navigate: (href: PatientTabHref) => void },
  href: PatientTabHref,
) {
  router.navigate(href);
}
