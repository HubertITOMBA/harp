"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ID du statut "désactivé" - à ajuster selon votre base de données
const DISABLED_STATUS_ID = 99;

export async function toggleServerStatus(serverId: number, disable: boolean) {
  try {
    const server = await db.harpserve.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      return { success: false, error: "Serveur non trouvé" };
    }

    // Vérifier si le statut "désactivé" existe
    let disabledStatus = await db.statutenv.findUnique({
      where: { id: DISABLED_STATUS_ID },
    });

    // Si le statut n'existe pas, chercher un statut existant
    if (!disabledStatus) {
      const currentStatus = await db.statutenv.findFirst({
        where: { statenv: { contains: "désactivé", mode: "insensitive" } },
      });
      
      if (currentStatus) {
        disabledStatus = currentStatus;
      } else {
        return { 
          success: false, 
          error: "Le statut 'désactivé' n'existe pas dans la base de données" 
        };
      }
    }

    if (disable) {
      await db.harpserve.update({
        where: { id: serverId },
        data: { statenvId: disabledStatus.id },
      });
      return { 
        success: true, 
        message: `Le serveur ${server.srv} a été désactivé avec succès` 
      };
    } else {
      // Réactiver : remettre le statut par défaut
      const defaultStatusId = 4; // Statut par défaut (à ajuster)
      await db.harpserve.update({
        where: { id: serverId },
        data: { statenvId: defaultStatusId },
      });
      return { 
        success: true, 
        message: `Le serveur ${server.srv} a été réactivé avec succès` 
      };
    }
  } catch (error) {
    console.error("Erreur lors de la modification du statut du serveur:", error);
    return { 
      success: false, 
      error: "Erreur lors de la modification du statut du serveur" 
    };
  } finally {
    revalidatePath("/list/servers");
  }
}

