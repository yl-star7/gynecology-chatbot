import {
  CANONICAL_ADMIN_ROUTES,
  redirectToCanonicalAdminRoute,
} from "../_lib/legacy-admin-route";

export default async function AdminContentIndexPage() {
  redirectToCanonicalAdminRoute(CANONICAL_ADMIN_ROUTES.assetsWeeks);
}
