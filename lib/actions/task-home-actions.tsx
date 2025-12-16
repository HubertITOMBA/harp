"use server"

import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * Récupère la dernière chrono-tâche avec statut EN_COURS ou EN_ATTENTE
 * Le lien s'affiche pour tout utilisateur, peu importe qui a créé la tâche
 * 
 * @returns La dernière chrono-tâche active si elle existe, sinon null
 */
export async function getLastActiveTaskForUser() {
  try {
    // Récupérer la dernière chrono-tâche avec statut EN_COURS ou EN_ATTENTE
    // (pour tout utilisateur, pas de filtre par créateur)
    const lastTask = await db.harptask.findFirst({
      where: {
        status: {
          in: ["EN_COURS", "EN_ATTENTE"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        status: true,
      },
    });

    return lastTask;
  } catch (error) {
    console.error("Erreur lors de la récupération de la dernière chrono-tâche:", error);
    return null;
  }
}

