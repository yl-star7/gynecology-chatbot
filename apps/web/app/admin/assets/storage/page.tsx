import {
  CANONICAL_ADMIN_ROUTES,
  redirectToCanonicalAdminRoute,
} from "../../_lib/legacy-admin-route";

export default function Page() {
  redirectToCanonicalAdminRoute(CANONICAL_ADMIN_ROUTES.branding);
}
