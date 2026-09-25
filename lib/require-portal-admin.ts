import { auth } from "@/auth";
import { getAllUserRoles } from "@/actions/get-all-user-roles";
import { decidePortalAdminAccess } from "@/lib/user-scopes";

export type PortalAdminGuard =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Exige une session et le rôle PORTAL_ADMIN lu en base.
 * Un scope 4K ou 150K, ou le rôle PSADMIN, ne suffit pas.
 *
 * @returns ok, ou un refus sans détail de périmètre
 */
export async function requirePortalAdmin(): Promise<PortalAdminGuard> {
  const session = await auth();
  const authenticated = Boolean(session?.user?.id);
  const userRoles = authenticated ? await getAllUserRoles() : [];
  const access = decidePortalAdminAccess({ authenticated, userRoles });

  if (access === "allowed") {
    return { ok: true };
  }
  if (access === "unauthenticated") {
    return { ok: false, error: "Non authentifié" };
  }
  return { ok: false, error: "Accès refusé" };
}
