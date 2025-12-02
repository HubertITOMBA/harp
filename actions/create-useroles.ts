"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateUserRolesSchema = z.object({
  netid: z.string().min(1, "Le NetID est requis").max(32),
  role: z.string().min(1, "Le rôle est requis").max(32),
});

/**
 * Crée une attribution de rôle HARP à un utilisateur
 */
export async function createUserRoles(formData: FormData) {
  try {
    const rawData = {
      netid: formData.get("netid") as string,
      role: formData.get("role") as string,
    };

    const validatedData = CreateUserRolesSchema.parse(rawData);

    // Vérifier que l'utilisateur existe dans la table User
    const user = await db.user.findUnique({
      where: { netid: validatedData.netid },
      select: { id: true }
    });

    if (!user) {
      return { success: false, error: "Utilisateur non trouvé" };
    }

    // Vérifier que le rôle existe dans harproles
    const harprole = await db.harproles.findFirst({
      where: { role: validatedData.role },
      select: { id: true }
    });

    if (!harprole) {
      return { success: false, error: "Rôle non trouvé" };
    }

    // Vérifier si l'attribution existe déjà
    const existingUserRole = await db.harpuseroles.findFirst({
      where: {
        userId: user.id,
        roleId: harprole.id,
      },
    });

    if (existingUserRole) {
      return { success: false, error: "Cette attribution de rôle existe déjà" };
    }

    const newUserRole = await db.harpuseroles.create({
      data: {
        userId: user.id,
        roleId: harprole.id,
      },
    });

    return { 
      success: true, 
      message: `Le rôle ${validatedData.role} a été attribué à ${validatedData.netid} avec succès`,
      netid: validatedData.netid,
      role: validatedData.role
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    console.error("Erreur lors de la création de l'attribution de rôle:", error);
    return { 
      success: false, 
      error: "Erreur lors de la création de l'attribution de rôle" 
    };
  } finally {
    revalidatePath("/list/useroles");
  }
}

