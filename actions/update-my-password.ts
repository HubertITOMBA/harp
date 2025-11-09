"use server"

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";

const UpdateMyPasswordSchema = z.object({
  currentPassword: z.string().min(1, "Le mot de passe actuel est requis"),
  newPassword: z.string().min(6, "Le nouveau mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string().min(1, "La confirmation du mot de passe est requise"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

/**
 * Met à jour le mot de passe de l'utilisateur connecté
 * 
 * @param formData - Les données du formulaire contenant le mot de passe actuel et le nouveau mot de passe
 * @returns Un objet avec success (boolean), message (string) en cas de succès, 
 *          ou error (string) en cas d'échec
 */
export async function updateMyPassword(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { 
        success: false, 
        error: "Vous devez être connecté pour modifier votre mot de passe" 
      };
    }

    const userId = parseInt(session.user.id, 10);
    
    if (isNaN(userId) || userId <= 0) {
      return { 
        success: false, 
        error: "ID utilisateur invalide" 
      };
    }

    const rawData = {
      currentPassword: formData.get("currentPassword") as string,
      newPassword: formData.get("newPassword") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    const validatedData = UpdateMyPasswordSchema.parse(rawData);

    // Récupérer l'utilisateur avec son mot de passe
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
        netid: true,
      },
    });

    if (!user) {
      return { 
        success: false, 
        error: "Utilisateur non trouvé" 
      };
    }

    // Vérifier le mot de passe actuel
    if (user.password) {
      const isPasswordValid = await bcrypt.compare(
        validatedData.currentPassword,
        user.password
      );

      if (!isPasswordValid) {
        return { 
          success: false, 
          error: "Le mot de passe actuel est incorrect" 
        };
      }
    } else {
      // Si l'utilisateur n'a pas de mot de passe (connexion via OAuth), 
      // on peut permettre la création d'un mot de passe
      // ou exiger une autre méthode d'authentification
      return { 
        success: false, 
        error: "Vous n'avez pas de mot de passe défini. Veuillez contacter l'administrateur." 
      };
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10);

    // Mettre à jour le mot de passe dans la table User
    await db.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    // Mettre à jour aussi dans psadm_user si l'utilisateur existe
    if (user.netid) {
      try {
        await db.psadm_user.update({
          where: { netid: user.netid },
          data: {
            mdp: validatedData.newPassword, // Stocké en clair dans psadm_user
          },
        });
      } catch (error) {
        // Si l'utilisateur n'existe pas dans psadm_user, on continue quand même
        console.warn("Utilisateur non trouvé dans psadm_user:", user.netid);
      }
    }

    revalidatePath("/user/profile");
    
    return { 
      success: true, 
      message: "Votre mot de passe a été mis à jour avec succès" 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    console.error("Erreur lors de la mise à jour du mot de passe:", error);
    return { 
      success: false, 
      error: "Erreur lors de la mise à jour du mot de passe" 
    };
  }
}

