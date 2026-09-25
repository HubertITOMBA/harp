import { auth } from "@/auth";
import { getAllUserRoles } from "@/actions/get-all-user-roles";
import prisma from "@/lib/prisma";
import {
  hasPortalAdminRole,
  resolveEnvironmentScopeFilter,
  type EnvironmentScopeFilter,
} from "@/lib/user-scopes";

/**
 * Résout le périmètre de lecture de la session courante.
 * Les rôles et les lignes harpuserscope sont lus en base.
 * PORTAL_ADMIN ne charge pas harpuserscope : le filtre reste ouvert.
 * Sans identifiant utilisateur, aucun environnement n'est autorisé.
 *
 * @returns Le filtre à appliquer aux lectures envsharp
 */
export async function loadEnvironmentScopeFilter(): Promise<EnvironmentScopeFilter> {
  const userRoles = await getAllUserRoles();
  if (hasPortalAdminRole(userRoles)) {
    return { mode: "all" };
  }

  const session = await auth();
  const userId = Number.parseInt(session?.user?.id ?? "", 10);
  if (!Number.isInteger(userId) || userId <= 0) {
    return { mode: "restricted", scopeIds: [] };
  }

  const assignments = await prisma.harpuserscope.findMany({
    where: { userId },
    select: {
      harpscope: {
        select: { id: true, code: true },
      },
    },
  });

  return resolveEnvironmentScopeFilter({
    userRoles,
    assignedScopes: assignments.map((row) => row.harpscope),
  });
}
