"use server";

import { db } from "@/lib/db";
import {
  environmentVisibilityWhere,
  loadEnvironmentAccessContextForSession,
} from "@/lib/environment-access";

/**
 * Statut technique et environnements visibles rattachés.
 * Le catalogue de statut reste lisible. Les lignes envsharp sont filtrées.
 *
 * @param id - Identifiant statutenv
 * @returns Le statut, ou null si l'identifiant est invalide
 */
export async function getTypeStatusById(id: string | number) {
  const statusId = typeof id === 'string' ? parseInt(id, 10) : id;
  
  if (isNaN(statusId)) {
    return null;
  }

  const accessContext = await loadEnvironmentAccessContextForSession();
  const visibilityWhere = environmentVisibilityWhere(accessContext);
  
  return await db.statutenv.findUnique({
    where: { id: statusId },
    include: {
      envsharp: {
        where: visibilityWhere ?? { id: { in: [] } },
        select: {
          id: true,
          env: true,
          descr: true,
        }
      },
      harpserve: {
        select: {
          id: true,
          srv: true,
        }
      },
      harpenvserv: {
        select: {
          id: true,
        }
      },
      harpenvdispo: {
        select: {
          id: true,
        }
      }
    }
  });
}

