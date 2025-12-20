"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { updateTaskEffectiveDuration } from "./calculate-task-duration";

/**
 * Récupère toutes les tâches (items) assignées à l'utilisateur connecté
 * 
 * @returns Un tableau des tâches assignées à l'utilisateur ou null si non connecté
 */
export async function getUserTasks() {
  try {
    const session = await auth();
    
    if (!session?.user?.netid) {
      return { success: false, error: "Utilisateur non authentifié" };
    }

    const netid = session.user.netid;

    // Récupérer toutes les tâches assignées à cet utilisateur
    const tasks = await db.harptaskitem.findMany({
      where: {
        resourceNetid: netid,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        harpitem: {
          select: {
            id: true,
            descr: true,
          },
        },
        predecessor: {
          select: {
            id: true,
            order: true,
            harpitem: {
              select: {
                descr: true,
              },
            },
          },
        },
      },
      orderBy: [
        { task: { createdAt: 'desc' } },
        { order: 'asc' },
      ],
    });

    return { success: true, data: tasks };
  } catch (error) {
    console.error("Erreur lors de la récupération des tâches utilisateur:", error);
    return { success: false, error: "Erreur lors de la récupération des tâches" };
  }
}

// Schéma de validation pour mettre à jour une tâche utilisateur
const UpdateUserTaskSchema = z.object({
  id: z.number().int().positive("L'ID de la tâche est requis"),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  status: z.enum(["EN_ATTENTE", "EN_COURS", "BLOQUE", "TERMINE", "SUCCES", "ECHEC"]).optional(),
  comment: z.string().optional().nullable(),
});

/**
 * Met à jour une tâche assignée à l'utilisateur connecté
 * Permet de modifier la date de début, la date de fin, le statut et le commentaire
 * 
 * @param formData - Les données du formulaire contenant les champs à mettre à jour
 * @returns Un objet avec success (boolean) et message (string) ou error (string)
 */
export async function updateUserTask(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user?.netid) {
      return { success: false, error: "Utilisateur non authentifié" };
    }

    const netid = session.user.netid;

    const rawData = {
      id: formData.get("id") ? parseInt(formData.get("id") as string, 10) : undefined,
      startDate: formData.get("startDate") as string || null,
      endDate: formData.get("endDate") as string || null,
      status: formData.get("status") as string || undefined,
      comment: formData.get("comment") as string || null,
    };

    const validatedData = UpdateUserTaskSchema.parse(rawData);

    // Vérifier que la tâche existe et est assignée à cet utilisateur
    const existingTask = await db.harptaskitem.findFirst({
      where: {
        id: validatedData.id,
        resourceNetid: netid,
      },
      select: {
        id: true,
        taskId: true,
      },
    });

    if (!existingTask) {
      return { success: false, error: "Tâche non trouvée ou non assignée à cet utilisateur" };
    }

    // Préparer les données de mise à jour
    const updateData: any = {};

    if (validatedData.startDate !== undefined) {
      updateData.startDate = validatedData.startDate 
        ? new Date(validatedData.startDate) 
        : null;
    }

    if (validatedData.endDate !== undefined) {
      updateData.endDate = validatedData.endDate 
        ? new Date(validatedData.endDate) 
        : null;
    }

    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
    }

    if (validatedData.comment !== undefined) {
      updateData.comment = validatedData.comment || null;
    }

    // Mettre à jour la tâche
    const updated = await db.harptaskitem.update({
      where: { id: validatedData.id },
      data: updateData,
    });

    // Mettre à jour la durée effective de la chrono-tâche
    await updateTaskEffectiveDuration(updated.taskId);

    revalidatePath("/user/profile/tasks");
    revalidatePath(`/list/tasks/${updated.taskId}`);

    return { 
      success: true, 
      message: "Tâche mise à jour avec succès",
      data: updated 
    };
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la tâche:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: "Erreur lors de la mise à jour de la tâche" };
  }
}

