import { redirect } from "next/navigation";

export const CANONICAL_ADMIN_ROUTES = {
  assetsWeeks: "/admin/assets/weeks",
  branding: "/admin/ops/branding",
  lexicon: "/admin/lexicon",
  operations: "/admin/ops/settings",
  monitoring: "/admin/ops/monitoring",
  users: "/admin/ops/users",
  workflows: "/admin/engine/workflows",
  copy: "/admin/engine/copy",
} as const;

export function redirectToCanonicalAdminRoute(
  route: (typeof CANONICAL_ADMIN_ROUTES)[keyof typeof CANONICAL_ADMIN_ROUTES],
): never {
  redirect(route);
}

export function createLegacyAdminRedirectPage(
  route: (typeof CANONICAL_ADMIN_ROUTES)[keyof typeof CANONICAL_ADMIN_ROUTES],
) {
  return function LegacyAdminRedirectPage() {
    redirectToCanonicalAdminRoute(route);
  };
}
