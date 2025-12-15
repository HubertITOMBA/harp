"use server"

import { db } from "@/lib/db";

/**
 * Récupère toutes les tâches d'une chrono-tâche pour permettre la sélection d'un prédécesseur
 */
export async function getTaskItems(taskId: number) {
  try {
    const items = await db.harptaskitem.findMany({
      where: { taskId },
      select: {
        id: true,
        order: true,
        status: true,
        harpitem: {
          select: {
            id: true,
            descr: true,
          },
        },
      },
      orderBy: { order: "asc" },
    });

    return { success: true, data: items };
  } catch (error) {
    console.error("Erreur lors de la récupération des tâches:", error);
    return { success: false, error: "Erreur lors de la récupération des tâches" };
  }
}
