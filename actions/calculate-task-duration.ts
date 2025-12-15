"use server";

import { db } from "@/lib/db";

/**
 * Calcule la durée effective d'une chrono-tâche en additionnant les durées de tous ses items
 * Durée = somme de (endDate - startDate) pour chaque item ayant les deux dates
 */
export async function calculateTaskEffectiveDuration(taskId: number): Promise<number> {
  try {
    const items = await db.harptaskitem.findMany({
      where: { taskId },
      select: {
        startDate: true,
        endDate: true,
      },
    });

    let totalDuration = 0;

    for (const item of items) {
      if (item.startDate && item.endDate) {
        const start = new Date(item.startDate);
        const end = new Date(item.endDate);
        const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
        totalDuration += durationMinutes;
      }
    }

    return totalDuration;
  } catch (error) {
    console.error("Erreur lors du calcul de la durée effective:", error);
    return 0;
  }
}

/**
 * Met à jour la durée effective d'une chrono-tâche
 */
export async function updateTaskEffectiveDuration(taskId: number) {
  try {
    const effectiveDuration = await calculateTaskEffectiveDuration(taskId);
    
    await db.harptask.update({
      where: { id: taskId },
      data: { effectiveDuration },
    });

    return { success: true, effectiveDuration };
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la durée effective:", error);
    return { success: false, error: "Erreur lors de la mise à jour" };
  }
}
