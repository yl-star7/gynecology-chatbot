import {
  CANONICAL_ADMIN_ROUTES,
  createLegacyAdminRedirectPage,
} from "../../_lib/legacy-admin-route";

export const dynamic = "force-dynamic";

export default createLegacyAdminRedirectPage(CANONICAL_ADMIN_ROUTES.monitoring);
