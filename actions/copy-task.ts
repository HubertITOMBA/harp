"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateTaskEffectiveDuration } from "./calculate-task-duration";

const copyTaskSchema = z.object({
  sourceTaskId: z.number(),
  title: z.string().min(1, "Le titre est requis"),
  descr: z.string().optional().nullable(),
  date: z.date().optional().nullable(),
  estimatedDuration: z.number().optional().nullable(),
});

/**
 * Copie une chrono-tâche existante avec tous ses items
 */
export async function copyTask(data: z.infer<typeof copyTaskSchema>) {
  try {
    const validatedData = copyTaskSchema.parse(data);

    // Récupérer la tâche source avec tous ses items
    const sourceTask = await db.harptask.findUnique({
      where: { id: validatedData.sourceTaskId },
      include: {
        items: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!sourceTask) {
      return { error: "La chrono-tâche source n'existe pas" };
    }

    // Créer la nouvelle chrono-tâche
    const newTask = await db.harptask.create({
      data: {
        title: validatedData.title,
        descr: validatedData.descr || sourceTask.descr || null,
        status: "EN_ATTENTE", // Nouvelle tâche commence en attente
        date: validatedData.date || null,
        estimatedDuration: validatedData.estimatedDuration || sourceTask.estimatedDuration || null,
        effectiveDuration: null, // Sera calculé après la copie des items
      },
    });

    // Créer un mapping des anciens IDs vers les nouveaux IDs pour gérer les prédécesseurs
    const itemIdMapping = new Map<number, number>();

    // Copier tous les items dans l'ordre
    for (const sourceItem of sourceTask.items) {
      const newItem = await db.harptaskitem.create({
        data: {
          taskId: newTask.id,
          harpitemId: sourceItem.harpitemId, // Conserver la référence à l'item réutilisable
          startDate: validatedData.date ? new Date(validatedData.date) : null, // Utiliser la date de la nouvelle tâche
          predecessorId: null, // Sera mis à jour après si nécessaire
          status: "EN_ATTENTE", // Nouvelle tâche, tous les items en attente
          comment: sourceItem.comment,
          order: sourceItem.order,
        },
      });

      // Mapper l'ancien ID vers le nouveau ID
      itemIdMapping.set(sourceItem.id, newItem.id);
    }

    // Mettre à jour les prédécesseurs avec les nouveaux IDs
    for (const sourceItem of sourceTask.items) {
      if (sourceItem.predecessorId) {
        const newPredecessorId = itemIdMapping.get(sourceItem.predecessorId);
        if (newPredecessorId) {
          const newItemId = itemIdMapping.get(sourceItem.id);
          if (newItemId) {
            await db.harptaskitem.update({
              where: { id: newItemId },
              data: { predecessorId: newPredecessorId },
            });
          }
        }
      }
    }

    // Calculer la durée effective (sera 0 car aucune date de fin n'est définie)
    await updateTaskEffectiveDuration(newTask.id);

    revalidatePath("/list/tasks");
    return { success: true, data: newTask };
  } catch (error) {
    console.error("Erreur lors de la copie de la chrono-tâche:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Erreur lors de la copie de la chrono-tâche" };
  }
}
