import {
  CANONICAL_ADMIN_ROUTES,
  createLegacyAdminRedirectPage,
} from "../../_lib/legacy-admin-route";

export default createLegacyAdminRedirectPage(CANONICAL_ADMIN_ROUTES.copy);
