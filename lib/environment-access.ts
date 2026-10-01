import { auth } from "@/auth";
import { getAllUserRoles } from "@/actions/get-all-user-roles";
import prisma from "@/lib/prisma";
import { loadEnvironmentScopeFilter } from "@/lib/load-environment-scope-filter";
import { canAccessTypeEnvForSession, loadTypeEnvGrantsForRoles } from "@/lib/type-env-access";
import { accessibleTypenvIds } from "@/lib/user-roles";
import {
  canSeeEnvironment,
  decideEnvironmentFamilyAndScope,
  environmentVisibilityWhere,
  hasPortalAdminRole,
  type EnvironmentAccessContext,
  type EnvironmentServerAccess,
} from "@/lib/user-scopes";

export type { EnvironmentAccessContext };
export { canSeeEnvironment, environmentVisibilityWhere };

/**
 * Charge une fois les rôles, le bypass PORTAL_ADMIN, les familles et le scope.
 * Les listes réutilisent ce contexte au lieu d'une lecture RBAC par environnement.
 *
 * @returns Contexte de visibilité de la session, ou un contexte fermé sans session
 */
export async function loadEnvironmentAccessContextForSession(): Promise<EnvironmentAccessContext> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      authenticated: false,
      portalAdmin: false,
      allowedTypenvIds: [],
      scopeFilter: { mode: "restricted", scopeIds: [] },
    };
  }

  const userRoles = await getAllUserRoles();
  const portalAdmin = hasPortalAdminRole(userRoles);
  const grants = portalAdmin ? [] : await loadTypeEnvGrantsForRoles(userRoles);
  const scopeFilter = await loadEnvironmentScopeFilter();

  return {
    authenticated: true,
    portalAdmin,
    allowedTypenvIds: accessibleTypenvIds({ userRoles, grants }),
    scopeFilter,
  };
}

/**
 * Noms envsharp visibles, pour filtrer une table legacy reliée par le nom unique `env`.
 * unrestricted : PORTAL_ADMIN, aucun filtre de nom.
 * null : session absente ou aucune ligne visible.
 *
 * @returns Noms autorisés, le mode sans filtre, ou null
 */
export async function loadVisibleEnvironmentNames(): Promise<
  { unrestricted: true } | { unrestricted: false; names: string[] } | null
> {
  const context = await loadEnvironmentAccessContextForSession();
  if (!context.authenticated) {
    return null;
  }
  if (context.portalAdmin) {
    return { unrestricted: true };
  }
  const where = environmentVisibilityWhere(context);
  if (where == null) {
    return { unrestricted: false, names: [] };
  }
  const rows = await prisma.envsharp.findMany({
    where,
    select: { env: true },
  });
  return { unrestricted: false, names: rows.map((row) => row.env) };
}

export type ResolvedEnvironment = {
  id: number;
  typenvid: number | null;
  scopeId: number | null;
};

/**
 * Autorise un environnement déjà lu en base.
 * Le typenvid utilisé est celui de la ligne. Une famille absente est refusée,
 * sauf pour PORTAL_ADMIN, qui conserve l'accès sans filtre 4K/150K.
 *
 * @param environment - Ligne envsharp, ou null si elle n'existe pas
 * @returns 200, 401, 403 ou 404
 */
export async function authorizeResolvedEnvironment(
  environment: ResolvedEnvironment | null
): Promise<EnvironmentServerAccess> {
  const session = await auth();
  if (!session?.user?.id) {
    return 401;
  }
  if (environment == null) {
    return 404;
  }

  let familyAllowed = false;
  if (Number.isInteger(environment.typenvid) && (environment.typenvid as number) > 0) {
    familyAllowed = await canAccessTypeEnvForSession(environment.typenvid as number);
  } else {
    const roles = await getAllUserRoles();
    familyAllowed = hasPortalAdminRole(roles);
  }
  if (!familyAllowed) {
    return 403;
  }

  const scopeFilter = await loadEnvironmentScopeFilter();
  return decideEnvironmentFamilyAndScope({
    authenticated: true,
    environment,
    familyAllowed,
    scopeFilter,
  });
}

/**
 * Autorise un environnement à partir de son identifiant envsharp.id.
 * La famille est lue sur la ligne, jamais reçue du client.
 *
 * @param environmentId - Clé envsharp.id
 * @returns 200, 400, 401, 403 ou 404
 */
export async function canAccessEnvironmentForSession(
  environmentId: number
): Promise<EnvironmentServerAccess | 400> {
  if (!Number.isInteger(environmentId) || environmentId <= 0) {
    return 400;
  }

  const session = await auth();
  if (!session?.user?.id) {
    return 401;
  }

  const environment = await prisma.envsharp.findUnique({
    where: { id: environmentId },
    select: { id: true, typenvid: true, scopeId: true },
  });

  return authorizeResolvedEnvironment(environment);
}
