"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateTaskEffectiveDuration } from "./calculate-task-duration";
import { notifyUserAboutTaskAssignment } from "@/lib/actions/notification-actions";

// Schéma de validation pour créer une chrono-tâche
const CreateTaskSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(255, "Le titre ne peut pas dépasser 255 caractères"),
  descr: z.string().optional().nullable(),
  status: z.enum(["EN_ATTENTE", "EN_COURS", "BLOQUE", "TERMINE", "SUCCES", "ECHEC"]).optional(),
  date: z.string().optional().nullable(),
  estimatedDuration: z.string().optional().nullable(),
});

/**
 * Crée une nouvelle chrono-tâche dans la base de données
 * 
 * @param formData - Les données du formulaire contenant les champs de la chrono-tâche
 * @returns Un objet avec success (boolean), message (string) en cas de succès, 
 *          ou error (string) en cas d'échec, et id (number) de la chrono-tâche créée
 */
export async function createTask(formData: FormData) {
  try {
    const rawData = {
      title: formData.get("title") as string,
      descr: formData.get("descr") as string || null,
      status: formData.get("status") as string || "EN_ATTENTE",
      date: formData.get("date") as string || null,
      estimatedDuration: formData.get("estimatedDuration") as string || null,
    };

    const validatedData = CreateTaskSchema.parse(rawData);

    // Préparer les données pour l'insertion
    const taskData: any = {
      title: validatedData.title,
      descr: validatedData.descr || null,
      status: (validatedData.status || "EN_ATTENTE") as any,
    };

    // Ajouter la date si fournie
    if (validatedData.date) {
      taskData.date = new Date(validatedData.date);
    }

    // Ajouter la durée estimée si fournie
    if (validatedData.estimatedDuration) {
      taskData.estimatedDuration = parseInt(validatedData.estimatedDuration, 10);
    }

    // Créer la chrono-tâche
    const newTask = await db.harptask.create({
      data: taskData,
    });

    return { 
      success: true, 
      message: `Chrono-tâche "${validatedData.title}" créée avec succès`,
      id: newTask.id 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Erreur:", error);
    return { success: false, error: "Erreur lors de la création de la chrono-tâche" };
  } finally {
    revalidatePath("/list/tasks");
  }
}

// Récupérer toutes les chrono-tâches
export async function getAllTasks() {
  try {
    const tasks = await db.harptask.findMany({
      include: {
        items: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: tasks };
  } catch (error) {
    console.error("Erreur lors de la récupération des chrono-tâches:", error);
    return { success: false, error: "Erreur lors de la récupération des chrono-tâches" };
  }
}

// Récupérer une chrono-tâche avec ses items
export async function getTaskById(taskId: number) {
  try {
    const task = await db.harptask.findUnique({
      where: { id: taskId },
      include: {
        items: {
          include: {
            predecessor: {
              select: {
                id: true,
                status: true,
                harpitem: {
                  select: {
                    id: true,
                    descr: true,
                  },
                },
              },
            },
            harpitem: {
              select: {
                id: true,
                descr: true,
              },
            },
            user: {
              select: {
                id: true,
                netid: true,
                nom: true,
                prenom: true,
              },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!task) {
      return { success: false, error: "Chrono-tâche non trouvée" };
    }

    return { success: true, data: task };
  } catch (error) {
    console.error("Erreur lors de la récupération de la chrono-tâche:", error);
    return { success: false, error: "Erreur lors de la récupération de la chrono-tâche" };
  }
}

// Mettre à jour une chrono-tâche
const updateTaskSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  descr: z.string().optional().nullable(),
  status: z.enum(["EN_ATTENTE", "EN_COURS", "BLOQUE", "TERMINE", "SUCCES", "ECHEC"]).optional(),
  date: z.date().optional().nullable(),
  estimatedDuration: z.number().optional().nullable(),
});

export async function updateTask(data: z.infer<typeof updateTaskSchema>) {
  try {
    const validatedData = updateTaskSchema.parse(data);
    const { id, ...updateData } = validatedData;

    const task = await db.harptask.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/list/tasks");
    revalidatePath(`/list/tasks/${id}`);
    return { success: true, data: task };
  } catch (error) {
    console.error("Erreur lors de la mise à jour:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Erreur lors de la mise à jour" };
  }
}

// Supprimer une chrono-tâche
export async function deleteTask(taskId: number) {
  try {
    await db.harptask.delete({
      where: { id: taskId },
    });

    revalidatePath("/list/tasks");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression:", error);
    return { error: "Erreur lors de la suppression" };
  }
}

// Mettre à jour une tâche individuelle
const updateTaskItemSchema = z.object({
  id: z.number(),
  harpitemId: z.number().optional().nullable(), // ID de l'item réutilisable
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  resourceNetid: z.string().optional().nullable(),
  predecessorId: z.number().optional().nullable(),
  status: z.enum(["EN_ATTENTE", "EN_COURS", "BLOQUE", "TERMINE", "SUCCES", "ECHEC"]).optional(),
  comment: z.string().optional().nullable(),
  order: z.number().optional(),
});

export async function updateTaskItem(data: z.infer<typeof updateTaskItemSchema>) {
  try {
    const validatedData = updateTaskItemSchema.parse(data);
    const { id, predecessorId, harpitemId, ...updateData } = validatedData;
    
    // Si harpitemId est fourni, vérifier qu'il existe
    if (harpitemId !== undefined) {
      if (harpitemId) {
        const harpitem = await db.harpitems.findUnique({
          where: { id: harpitemId },
        });
        if (!harpitem) {
          return { error: "L'item réutilisable n'existe pas" };
        }
        (updateData as any).harpitemId = harpitemId;
      } else {
        (updateData as any).harpitemId = null;
      }
    }

    // Le prédécesseur est maintenant directement l'ID de la tâche précédente
    if (predecessorId !== undefined) {
      if (predecessorId) {
        // Vérifier que le prédécesseur existe et appartient à la même chrono-tâche
        const taskItem = await db.harptaskitem.findUnique({
          where: { id },
          select: { taskId: true },
        });

        if (taskItem) {
          const predecessor = await db.harptaskitem.findFirst({
            where: {
              id: predecessorId,
              taskId: taskItem.taskId,
            },
          });
          if (!predecessor) {
            return { error: "La tâche prédécesseur n'existe pas ou n'appartient pas à cette chrono-tâche" };
          }
          (updateData as any).predecessorId = predecessorId;
        }
      } else {
        (updateData as any).predecessorId = null;
      }
    }

    const updated = await db.harptaskitem.update({
      where: { id },
      data: updateData,
    });

    // Mettre à jour la durée effective de la chrono-tâche
    await updateTaskEffectiveDuration(updated.taskId);

    // Notifier la ressource désignée (notification + email)
    if (updated.resourceNetid?.trim()) {
      const [task, harpitem] = await Promise.all([
        db.harptask.findUnique({
          where: { id: updated.taskId },
          select: { title: true },
        }),
        updated.harpitemId
          ? db.harpitems.findUnique({
              where: { id: updated.harpitemId },
              select: { descr: true },
            })
          : null,
      ]);
      await notifyUserAboutTaskAssignment({
        resourceNetid: updated.resourceNetid.trim(),
        chronoTitle: task?.title ?? "Chrono-tâche",
        taskItemDescr: harpitem?.descr ?? "Tâche",
        isNew: false,
      });
    }

    revalidatePath(`/list/tasks/${updated.taskId}`);
    revalidatePath(`/list/tasks`);
    return { success: true, data: updated };
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la tâche:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Erreur lors de la mise à jour de la tâche" };
  }
}

// Supprimer une tâche individuelle
export async function deleteTaskItem(itemId: number) {
  try {
    const item = await db.harptaskitem.findUnique({
      where: { id: itemId },
      select: { taskId: true },
    });

    if (!item) {
      return { error: "Tâche non trouvée" };
    }

    await db.harptaskitem.delete({
      where: { id: itemId },
    });

    // Mettre à jour la durée effective de la chrono-tâche
    await updateTaskEffectiveDuration(item.taskId);

    revalidatePath(`/list/tasks/${item.taskId}`);
    revalidatePath(`/list/tasks`);
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression:", error);
    return { error: "Erreur lors de la suppression" };
  }
}
