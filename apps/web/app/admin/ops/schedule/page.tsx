import {
  CANONICAL_ADMIN_ROUTES,
  redirectToCanonicalAdminRoute,
} from "../../_lib/legacy-admin-route";

export const dynamic = "force-dynamic";

export default function AdminOpsScheduleRoute() {
  redirectToCanonicalAdminRoute(CANONICAL_ADMIN_ROUTES.monitoring);
}
