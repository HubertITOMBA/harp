"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateTaskEffectiveDuration } from "./calculate-task-duration";

const updateTaskStatusSchema = z.object({
  taskId: z.number(),
  status: z.enum(["EN_ATTENTE", "EN_COURS", "BLOQUE", "TERMINE", "SUCCES", "ECHEC"]),
});

export async function updateTaskStatus(data: z.infer<typeof updateTaskStatusSchema>) {
  try {
    const validatedData = updateTaskStatusSchema.parse(data);

    const task = await db.harptask.update({
      where: { id: validatedData.taskId },
      data: { status: validatedData.status },
    });

    revalidatePath("/list/tasks");
    revalidatePath(`/list/tasks/${validatedData.taskId}`);
    return { success: true, data: task };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Erreur lors de la mise à jour du statut" };
  }
}

export async function updateTaskItemStatus(data: {
  itemId: number;
  status: "EN_ATTENTE" | "EN_COURS" | "BLOQUE" | "TERMINE" | "SUCCES" | "ECHEC";
  userId?: number;
}) {
  try {
    const taskItem = await db.harptaskitem.findUnique({
      where: { id: data.itemId },
      include: { task: true },
    });

    if (!taskItem) {
      return { error: "La tâche n'existe pas" };
    }

    // Si on démarre la tâche, mettre à jour la date de début
    const updateData: any = { status: data.status };
    if (data.status === "EN_COURS" && !taskItem.startDate) {
      updateData.startDate = new Date();
    }

    // Si on termine la tâche, mettre à jour la date de fin
    if (["TERMINE", "SUCCES", "ECHEC"].includes(data.status) && !taskItem.endDate) {
      updateData.endDate = new Date();
    }

    const updated = await db.harptaskitem.update({
      where: { id: data.itemId },
      data: updateData,
    });

    // Vérifier si toutes les tâches de la chrono-tâche sont terminées
    const allItems = await db.harptaskitem.findMany({
      where: { taskId: taskItem.taskId },
    });

    const allCompleted = allItems.every(
      (item) => ["TERMINE", "SUCCES", "ECHEC"].includes(item.status)
    );

    if (allCompleted && allItems.length > 0) {
      // Déterminer le statut global : SUCCES si toutes sont SUCCES, sinon TERMINE
      const allSuccess = allItems.every((item) => item.status === "SUCCES");
      await db.harptask.update({
        where: { id: taskItem.taskId },
        data: { status: allSuccess ? "SUCCES" : "TERMINE" },
      });
    }

    // Vérifier si on peut démarrer les tâches dépendantes
    if (["TERMINE", "SUCCES"].includes(data.status)) {
      const dependentTasks = await db.harptaskitem.findMany({
        where: {
          predecessorId: data.itemId,
          status: "EN_ATTENTE",
        },
      });

      // Les tâches dépendantes peuvent maintenant être démarrées si leur prédécesseur est terminé
      // (mais on ne les démarre pas automatiquement, l'utilisateur doit le faire)
    }

    // Mettre à jour la durée effective de la chrono-tâche si les dates ont changé
    await updateTaskEffectiveDuration(taskItem.taskId);

    revalidatePath(`/list/tasks/${taskItem.taskId}`);
    revalidatePath("/list/tasks");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut de la tâche:", error);
    return { error: "Erreur lors de la mise à jour du statut" };
  }
}
