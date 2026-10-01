"use server";

import { db } from "@/lib/db";
import { loadVisibleEnvironmentNames } from "@/lib/environment-access";

/**
 * Release legacy et environnements visibles de cette release.
 * Le rattachement se fait par le nom unique env, pas par psadm_env.typenvid.
 *
 * @param harprelease - Code de release
 * @returns La release, avec une liste d'environnements déjà filtrée
 */
export async function getHarpVersById(harprelease: string) {
  const visible = await loadVisibleEnvironmentNames();
  const nameWhere =
    visible == null
      ? { env: { in: [] as string[] } }
      : visible.unrestricted
        ? {}
        : { env: { in: visible.names } };

  return await db.psadm_release.findUnique({
    where: { harprelease },
    include: {
      psadm_env: {
        where: nameWhere,
        select: {
          env: true,
          descr: true,
          site: true,
        }
      }
    }
  });
}

