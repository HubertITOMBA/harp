"use server";

import { db } from "@/lib/db";
import { loadEnvironmentAccessContextForSession } from "@/lib/environment-access";
import { canSeeEnvironment } from "@/lib/user-scopes";

/**
 * Relation serveur legacy d'un environnement nommé.
 * Le nom est résolu sur envsharp. Sans visibilité, aucune IP n'est renvoyée.
 *
 * @param srv - Nom de serveur legacy
 * @param env - Nom d'environnement, clé unique envsharp.env
 * @param typsrv - Type de serveur
 * @returns La relation visible, ou null
 */
export async function getServRoleById(srv: string, env: string, typsrv: string) {
  const accessContext = await loadEnvironmentAccessContextForSession();
  if (!accessContext.authenticated) {
    return null;
  }
  const environment = await db.envsharp.findUnique({
    where: { env },
    select: { typenvid: true, scopeId: true },
  });
  if (environment == null || !canSeeEnvironment(accessContext, environment)) {
    return null;
  }

  return await db.psadm_rolesrv.findFirst({
    where: {
      srv,
      env,
      typsrv,
    },
    include: {
      psadm_srv: {
        select: {
          srv: true,
          ip: true,
          pshome: true,
          os: true,
          psuser: true,
          domain: true,
        }
      },
      psadm_env: {
        select: {
          env: true,
          descr: true,
          site: true,
        }
      },
      psadm_typsrv: {
        select: {
          typsrv: true,
          descr: true,
        }
      }
    }
  });
}

