"use server";

import { db } from "@/lib/db";

/**
 * Récupère la liste des chrono-tâches avec seulement les métadonnées de base
 * (sans les items, pour des performances optimales)
 */
export async function getTasksList() {
  try {
    const tasks = await db.harptask.findMany({
      select: {
        id: true,
        title: true,
        descr: true,
        status: true,
        date: true,
        estimatedDuration: true,
        createdAt: true,
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: tasks };
  } catch (error) {
    console.error("Erreur lors de la récupération de la liste des chrono-tâches:", error);
    return { success: false, error: "Erreur lors de la récupération de la liste des chrono-tâches" };
  }
}
