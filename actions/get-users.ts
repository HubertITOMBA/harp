"use server"

import { db } from "@/lib/db";

/**
 * Récupère tous les utilisateurs avec netid, nom et prenom pour la sélection dans les tâches
 * 
 * @returns Un tableau d'utilisateurs avec netid, nom et prenom
 */
export async function getUsersForTaskResource() {
  try {
    const users = await db.user.findMany({
      where: {
        netid: {
          not: null,
        },
      },
      orderBy: [
        { nom: 'asc' },
        { prenom: 'asc' },
        { netid: 'asc' },
      ],
      select: {
        netid: true,
        nom: true,
        prenom: true,
      },
    });

    return { success: true, data: users };
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    return { success: false, error: "Erreur lors de la récupération des utilisateurs", data: [] };
  }
}
