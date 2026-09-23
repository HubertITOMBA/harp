"use server"

import { auth } from "@/auth";
import { getAllUserRoles } from "@/actions/get-all-user-roles";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";

const UpdatePasswordSchema = z.object({
  netid: z.string().min(1, "NetID requis").max(32, "NetID trop long"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

/**
 * Met à jour le mot de passe d'un utilisateur dans la table User.
 *
 * Réservé à une session valide disposant du rôle PORTAL_ADMIN,
 * lu en base (rôle User + harpuseroles), pas depuis le cache de session.
 * Le mot de passe est hashé avec bcrypt. Aucune écriture n'est faite
 * dans psadm_user.mdp.
 *
 * @param netid - NetID de l'utilisateur dont le mot de passe doit être changé
 * @param nouveauPassword - Nouveau mot de passe en clair (hashé avant stockage)
 * @returns success et message en cas de succès, ou error en cas d'échec
 */
export async function updateUserPassword(netid: string, nouveauPassword: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Vous devez être connecté pour modifier un mot de passe",
      };
    }

    const roles = await getAllUserRoles();
    if (!roles.includes("PORTAL_ADMIN")) {
      return {
        success: false,
        error: "Accès refusé",
      };
    }

    const validatedFields = UpdatePasswordSchema.safeParse({
      netid,
      password: nouveauPassword,
    });

    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.errors[0]?.message || "Données invalides",
      };
    }

    const user = await db.user.findUnique({
      where: { netid: validatedFields.data.netid },
      select: { id: true },
    });

    if (!user) {
      return {
        success: false,
        error: "Utilisateur non trouvé",
      };
    }

    const hashedPassword = await bcrypt.hash(validatedFields.data.password, 10);

    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    revalidatePath("/list/users");
    revalidatePath(`/list/users/${netid}`);

    return {
      success: true,
      message: "Mot de passe mis à jour avec succès",
      reminder:
        "⚠️ IMPORTANT : Vous devez impérativement envoyer un email à l'utilisateur pour lui communiquer le nouveau mot de passe.",
    };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du mot de passe:", error);
    return {
      success: false,
      error: "Erreur lors de la mise à jour du mot de passe",
    };
  }
}
