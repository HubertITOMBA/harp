"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ID du statut "désactivé" - à ajuster selon votre base de données
const DISABLED_STATUS_ID = 99;

export async function toggleEnvStatus(envId: number, disable: boolean) {
  try {
    const env = await db.envsharp.findUnique({
      where: { id: envId },
    });

    if (!env) {
      return { success: false, error: "Environnement non trouvé" };
    }

    // Vérifier si le statut "désactivé" existe
    let disabledStatus = await db.statutenv.findUnique({
      where: { id: DISABLED_STATUS_ID },
    });

    // Si le statut n'existe pas, créer un statut par défaut ou utiliser un autre ID
    if (!disabledStatus) {
      // Chercher un statut existant ou utiliser le statut actuel
      const currentStatus = await db.statutenv.findFirst({
        where: { statenv: { contains: "désactivé", mode: "insensitive" } },
      });
      
      if (currentStatus) {
        disabledStatus = currentStatus;
      } else {
        // Si aucun statut désactivé n'existe, on peut créer un statut par défaut
        // ou simplement utiliser un ID existant. Pour l'instant, on retourne une erreur.
        return { 
          success: false, 
          error: "Le statut 'désactivé' n'existe pas dans la base de données" 
        };
      }
    }

    if (disable) {
      // Sauvegarder l'ancien statut si nécessaire (optionnel)
      // Pour l'instant, on change simplement le statut
      await db.envsharp.update({
        where: { id: envId },
        data: { statenvId: disabledStatus.id },
      });
      return { 
        success: true, 
        message: `L'environnement ${env.env} a été désactivé avec succès` 
      };
    } else {
      // Réactiver : remettre le statut par défaut (par exemple, statut actif = 1 ou 4)
      // Vous pouvez ajuster selon votre logique métier
      const defaultStatusId = 4; // Statut par défaut (à ajuster)
      await db.envsharp.update({
        where: { id: envId },
        data: { statenvId: defaultStatusId },
      });
      return { 
        success: true, 
        message: `L'environnement ${env.env} a été réactivé avec succès` 
      };
    }
  } catch (error) {
    console.error("Erreur lors de la modification du statut de l'environnement:", error);
    return { 
      success: false, 
      error: "Erreur lors de la modification du statut de l'environnement" 
    };
  } finally {
    revalidatePath("/list/envs");
  }
}

