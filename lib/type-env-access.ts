import prisma from "@/lib/prisma";
import { getAllUserRoles } from "@/actions/get-all-user-roles";
import {
  canAccessTypeEnv,
  hasRole,
  PORTAL_ADMIN_ROLE,
  type TypeEnvAccessGrant,
} from "@/lib/user-roles";

/**
 * Charge une fois les liens RBAC des rôles fournis.
 * Le résultat sert à une décision unitaire ou à une liste, sans requête par environnement.
 *
 * @param userRoles - Rôles HARP déjà résolus
 * @returns Grants aplatis, y compris les sous-rôles inactifs
 */
export async function loadTypeEnvGrantsForRoles(
  userRoles: readonly string[]
): Promise<TypeEnvAccessGrant[]> {
  if (userRoles.length === 0) {
    return [];
  }

  const rows = await prisma.harprolesubrole.findMany({
    where: {
      harproles: { role: { in: [...userRoles] } },
    },
    select: {
      harproles: { select: { role: true } },
      harpsubrole: {
        select: {
          active: true,
          harpsubroletypenv: { select: { typenvid: true } },
        },
      },
    },
  });

  const grants: TypeEnvAccessGrant[] = [];
  for (const row of rows) {
    for (const link of row.harpsubrole.harpsubroletypenv) {
      grants.push({
        role: row.harproles.role,
        active: row.harpsubrole.active,
        typenvid: link.typenvid,
      });
    }
  }
  return grants;
}

/**
 * Charge les rôles HARP de la session et les liens RBAC, puis applique canAccessTypeEnv.
 * La page /harp/envs/[id] s'en sert avant de charger les environnements.
 * Une erreur de lecture refuse l'accès.
 *
 * @param typenvid - Identifiant de famille demandé
 * @returns true seulement si le RBAC démontre la famille
 */
export async function canAccessTypeEnvForSession(typenvid: number): Promise<boolean> {
  if (!Number.isInteger(typenvid) || typenvid <= 0) {
    return false;
  }

  try {
    const userRoles = await getAllUserRoles();
    if (hasRole(userRoles, PORTAL_ADMIN_ROLE)) {
      return canAccessTypeEnv({ userRoles, typenvid, grants: [] });
    }

    const grants = await loadTypeEnvGrantsForRoles(userRoles);
    return canAccessTypeEnv({ userRoles, typenvid, grants });
  } catch (error) {
    console.error("Refus RBAC : lecture des sous-rôles impossible", error);
    return false;
  }
}
