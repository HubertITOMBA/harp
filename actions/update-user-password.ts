"use server"

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UpdatePasswordSchema = z.object({
  netid: z.string().min(1, "NetID requis"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

/**
 * Mettre à jour le mot de passe d'un utilisateur psadm_user
 */
export async function updateUserPassword(netid: string, password: string) {
  try {
    // Valider les données
    const validatedFields = UpdatePasswordSchema.safeParse({ netid, password });
    
    if (!validatedFields.success) {
      return { 
        success: false, 
        error: validatedFields.error.errors[0]?.message || "Données invalides" 
      };
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.psadm_user.findUnique({
      where: { netid: netid }
    });

    if (!user) {
      return { 
        success: false, 
        error: "Utilisateur non trouvé" 
      };
    }

    // Mettre à jour le mot de passe
    // Note: Le mot de passe dans psadm_user est stocké en clair (mdp)
    await prisma.psadm_user.update({
      where: { netid: netid },
      data: {
        mdp: password
      }
    });

    revalidatePath(`/list/users/${netid}`);
    
    return { 
      success: true, 
      message: "Mot de passe mis à jour avec succès",
      reminder: "⚠️ IMPORTANT : Vous devez impérativement envoyer un email à l'utilisateur pour lui communiquer le nouveau mot de passe."
    };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du mot de passe:", error);
    return { 
      success: false, 
      error: "Erreur lors de la mise à jour du mot de passe" 
    };
  }
}

