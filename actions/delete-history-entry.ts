"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function deleteHistoryEntry(env: string, fromdate: Date) {
  try {
    const entryExists = await db.psadm_dispo.findUnique({
      where: {
        env_fromdate: {
          env: env,
          fromdate: fromdate
        }
      },
    });

    if (!entryExists) {
      return { 
        success: false, 
        error: "Entrée d'historique non trouvée !" 
      };
    }

    await db.psadm_dispo.delete({
      where: {
        env_fromdate: {
          env: env,
          fromdate: fromdate
        }
      }
    });

    revalidatePath('/list/histoenv');

    return {
      success: true,
      message: "L'entrée d'historique a été supprimée avec succès !",
    };
  } catch (error) {
    console.error("Erreur lors de la suppression de l'entrée d'historique:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue lors de la suppression",
    };
  }
}

