"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ID du statut "désactivé" - à ajuster selon votre base de données
const DISABLED_STATUS_ID = 99;

export async function toggleInstOraStatus(instanceId: number, disable: boolean) {
  try {
    const instance = await db.harpinstance.findUnique({
      where: { id: instanceId },
      include: {
        harpserve: true,
      },
    });

    if (!instance) {
      return { success: false, error: "Instance non trouvée" };
    }

    if (!instance.harpserve) {
      return { success: false, error: "Aucun serveur associé à cette instance" };
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
      // Désactiver en mettant le serveur associé à désactivé
      await db.harpserve.update({
        where: { id: instance.harpserve.id },
        data: { statenvId: disabledStatus.id },
      });
      return { 
        success: true, 
        message: `L'instance ${instance.oracle_sid} a été désactivée avec succès` 
      };
    } else {
      // Réactiver : remettre le statut par défaut
      const defaultStatusId = 4; // Statut par défaut (à ajuster)
      await db.harpserve.update({
        where: { id: instance.harpserve.id },
        data: { statenvId: defaultStatusId },
      });
      return { 
        success: true, 
        message: `L'instance ${instance.oracle_sid} a été réactivée avec succès` 
      };
    }
  } catch (error) {
    console.error("Erreur lors de la modification du statut de l'instance:", error);
    return { 
      success: false, 
      error: "Erreur lors de la modification du statut de l'instance" 
    };
  } finally {
    revalidatePath("/list/instora");
  }
}

