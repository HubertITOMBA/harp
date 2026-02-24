"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateTaskEffectiveDuration } from "./calculate-task-duration";
import { notifyUserAboutTaskAssignment } from "@/lib/actions/notification-actions";

const createTaskItemSchema = z.object({
  taskId: z.number(),
  harpitemId: z.number().optional().nullable(), // ID de l'item réutilisable (requis maintenant)
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  resourceNetid: z.string().optional().nullable(),
  predecessorId: z.number().optional().nullable(),
  status: z.enum(["EN_ATTENTE", "EN_COURS", "BLOQUE", "TERMINE", "SUCCES", "ECHEC"]).default("EN_ATTENTE"),
  comment: z.string().optional().nullable(),
  order: z.number().default(0),
}).refine(
  (data) => data.harpitemId,
  {
    message: "Un item réutilisable doit être fourni",
    path: ["harpitemId"],
  }
);

export async function createTaskItem(data: z.infer<typeof createTaskItemSchema>) {
  try {
    const validatedData = createTaskItemSchema.parse(data);

    // Vérifier que la chrono-tâche existe
    const task = await db.harptask.findUnique({
      where: { id: validatedData.taskId },
    });

    if (!task) {
      return { error: "La chrono-tâche n'existe pas" };
    }

    // Le prédécesseur est maintenant directement l'ID de la tâche précédente
    const predecessorId = validatedData.predecessorId || null;
    
    // Vérifier que le prédécesseur existe et appartient à la même chrono-tâche
    if (predecessorId) {
      const predecessor = await db.harptaskitem.findFirst({
        where: {
          id: predecessorId,
          taskId: validatedData.taskId,
        },
      });
      if (!predecessor) {
        return { error: "La tâche prédécesseur n'existe pas ou n'appartient pas à cette chrono-tâche" };
      }
    }

    // Vérifier que l'item réutilisable existe
    const harpitemId = validatedData.harpitemId;
    if (!harpitemId) {
      return { error: "Un item réutilisable doit être fourni" };
    }
    
    const harpitem = await db.harpitems.findUnique({
      where: { id: harpitemId },
    });
    if (!harpitem) {
      return { error: "L'item réutilisable n'existe pas" };
    }

    // Calculer l'ordre si non spécifié
    let order = validatedData.order;
    if (order === 0) {
      const maxOrder = await db.harptaskitem.findFirst({
        where: { taskId: validatedData.taskId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      order = (maxOrder?.order || 0) + 1;
    }

    const taskItem = await db.harptaskitem.create({
      data: {
        taskId: validatedData.taskId,
        harpitemId: harpitemId,
        startDate: validatedData.startDate || null,
        endDate: validatedData.endDate || null,
        resourceNetid: validatedData.resourceNetid || null,
        predecessorId: predecessorId,
        status: validatedData.status,
        comment: validatedData.comment || null,
        order: order,
      },
    });

    // Mettre à jour la durée effective de la chrono-tâche
    await updateTaskEffectiveDuration(validatedData.taskId);

    // Notifier la ressource désignée (notification + email)
    if (validatedData.resourceNetid?.trim()) {
      await notifyUserAboutTaskAssignment({
        resourceNetid: validatedData.resourceNetid.trim(),
        chronoTitle: task.title,
        taskItemDescr: harpitem.descr,
        isNew: true,
      });
    }

    revalidatePath(`/list/tasks/${validatedData.taskId}`);
    revalidatePath(`/list/tasks`);
    return { success: true, data: taskItem };
  } catch (error) {
    console.error("Erreur lors de la création de la tâche:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Erreur lors de la création de la tâche" };
  }
}
