"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function toggleUserStatus(netid: string, disable: boolean) {
  try {
    const psadmUser = await db.psadm_user.findUnique({
      where: { netid },
    });

    if (!psadmUser) {
      return { success: false, error: "Utilisateur non trouvé" };
    }

    if (disable) {
      // Désactiver : préfixer le mot de passe avec "DISABLED_" pour empêcher la connexion
      // On garde le hash original pour pouvoir le restaurer
      const disabledPassword = `DISABLED_${psadmUser.mdp}`;
      await db.psadm_user.update({
        where: { netid },
        data: { mdp: disabledPassword },
      });

      // Désactiver aussi dans la table User (NextAuth) si elle existe
      try {
        const authUser = await db.user.findUnique({
          where: { netid },
        });
        if (authUser && authUser.password) {
          const disabledAuthPassword = `DISABLED_${authUser.password}`;
          await db.user.update({
            where: { netid },
            data: { password: disabledAuthPassword },
          });
        }
      } catch (error) {
        // Ignorer si la table User n'existe pas ou si l'utilisateur n'y est pas
        console.log("Utilisateur non trouvé dans la table User, continuation...");
      }

      return { 
        success: true, 
        message: `L'utilisateur ${netid} a été désactivé avec succès` 
      };
    } else {
      // Réactiver : retirer le préfixe "DISABLED_"
      if (psadmUser.mdp.startsWith("DISABLED_")) {
        const originalPassword = psadmUser.mdp.replace("DISABLED_", "");
        await db.psadm_user.update({
          where: { netid },
          data: { mdp: originalPassword },
        });

        // Réactiver aussi dans la table User (NextAuth) si elle existe
        try {
          const authUser = await db.user.findUnique({
            where: { netid },
          });
          if (authUser && authUser.password?.startsWith("DISABLED_")) {
            const originalAuthPassword = authUser.password.replace("DISABLED_", "");
            await db.user.update({
              where: { netid },
              data: { password: originalAuthPassword },
            });
          }
        } catch (error) {
          // Ignorer si la table User n'existe pas ou si l'utilisateur n'y est pas
          console.log("Utilisateur non trouvé dans la table User, continuation...");
        }

        return { 
          success: true, 
          message: `L'utilisateur ${netid} a été réactivé avec succès` 
        };
      } else {
        return { 
          success: false, 
          error: "L'utilisateur n'est pas désactivé" 
        };
      }
    }
  } catch (error) {
    console.error("Erreur lors de la modification du statut de l'utilisateur:", error);
    return { 
      success: false, 
      error: "Erreur lors de la modification du statut de l'utilisateur" 
    };
  } finally {
    revalidatePath("/list/users");
  }
}

