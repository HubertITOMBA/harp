"use server";

import { db } from "@/lib/db";
import { loadVisibleEnvironmentNames } from "@/lib/environment-access";

/**
 * Type de serveur legacy et relations visibles.
 * Chaque relation porte un nom d'environnement. Seuls les noms visibles sur envsharp restent.
 *
 * @param typsrv - Code de type de serveur
 * @returns Le type, avec les relations déjà filtrées
 */
export async function getTypeServById(typsrv: string) {
  const visible = await loadVisibleEnvironmentNames();
  const nameWhere =
    visible == null
      ? { env: { in: [] as string[] } }
      : visible.unrestricted
        ? {}
        : { env: { in: visible.names } };

  return await db.psadm_typsrv.findUnique({
    where: { typsrv },
    include: {
      psadm_rolesrv: {
        where: nameWhere,
        include: {
          psadm_srv: {
            select: {
              srv: true,
              ip: true,
            }
          },
          psadm_env: {
            select: {
              env: true,
              descr: true,
            }
          }
        }
      }
    }
  });
}

