"use server";

import { db } from "@/lib/db";
import { loadVisibleEnvironmentNames } from "@/lib/environment-access";

/**
 * Version PeopleTools legacy et environnements visibles.
 * Même correspondance par nom unique env que les autres catalogues legacy.
 *
 * @param ptversion - Version PeopleTools
 * @returns La version, avec une liste d'environnements déjà filtrée
 */
export async function getPtVersById(ptversion: string) {
  const visible = await loadVisibleEnvironmentNames();
  const nameWhere =
    visible == null
      ? { env: { in: [] as string[] } }
      : visible.unrestricted
        ? {}
        : { env: { in: visible.names } };

  return await db.psadm_ptools.findUnique({
    where: { ptversion },
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

